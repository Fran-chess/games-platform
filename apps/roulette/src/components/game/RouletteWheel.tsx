/**
 * Componente de Ruleta Interactiva
 *
 * Posee el canvas visible, las capas pre-renderizadas y el botón central
 * "GIRAR" (un <button> del DOM superpuesto al centro del canvas). La
 * animación y la lógica del giro viven en `useRouletteLogic`.
 *
 * Pensado para tablet táctil en modo kiosco:
 * - El único elemento activo es el botón central; la rueda no recibe toques.
 * - El estado presionado se maneja con pointer events (iOS no aplica :active
 *   en touch) y se suelta en pointerup, pointercancel y pointerleave.
 * - Los estados del botón se animan por CSS (ver `.spin-button` en globals.css),
 *   sin encender el loop de dibujo del canvas.
 */

"use client";

import { useRef, useEffect, useCallback, useState, memo } from "react";
import { motion } from "framer-motion";
import { useRouletteLogic } from "@/hooks/useRouletteLogic";
import {
  createWheelGeometry,
  setupCanvas,
  createWheelLayers,
  renderFrame,
  type WheelGeometry,
  type WheelLayers,
  type FrameState,
} from "@/services/roulette/canvasRenderer";
import { SPIN_CONFIG } from "@/utils/roulette";
import type { RouletteWheelProps } from "@/types";

/** Variable CSS que fija el diámetro visible del botón central (la lee `.spin-button`) */
const SPIN_BUTTON_SIZE_VAR = "--spin-button-size";

/** El arco del botón dura lo mismo que el giro, con la misma desaceleración (ver `.spin-button` en globals.css) */
const SPIN_BUTTON_STYLE = { "--spin-duration": `${SPIN_CONFIG.DURATION_MS}ms` } as React.CSSProperties;

/** Etiqueta del disco según la fase: en reposo invita a girar; una vez pulsado, acompaña */
const DISC_LABEL = { idle: "GIRAR", spinning: "¡SUERTE!", resolved: "¡SUERTE!" } as const;

const RouletteWheel = memo(function RouletteWheel({ questions }: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  // Recursos de dibujo; se regeneran solo al cambiar tamaño o preguntas
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const geometryRef = useRef<WheelGeometry | null>(null);
  const layersRef = useRef<WheelLayers | null>(null);

  const draw = useCallback((frame: FrameState) => {
    const ctx = contextRef.current;
    const geometry = geometryRef.current;
    const layers = layersRef.current;
    if (!ctx || !geometry || !layers) return;

    renderFrame(ctx, geometry, layers, frame);
  }, []);

  const { segments, phase, startSpin, getFrame } = useRouletteLogic({ questions, render: draw });

  /**
   * Recalcula geometría, canvas, capas y tamaño del botón para el tamaño actual del contenedor
   */
  const rebuildLayers = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const geometry = createWheelGeometry(container);
    if (!geometry) return;

    const ctx = setupCanvas(canvas, geometry);
    const layers = createWheelLayers(segments, geometry);
    if (!ctx || !layers) return;

    contextRef.current = ctx;
    geometryRef.current = geometry;
    layersRef.current = layers;

    // El botón se dimensiona desde la misma geometría que el canvas, así nunca se desalinean
    container.style.setProperty(SPIN_BUTTON_SIZE_VAR, `${geometry.centerButtonDiameter}px`);

    draw(getFrame());
  }, [segments, draw, getFrame]);

  // Montaje inicial y cambios de tamaño del contenedor
  useEffect(() => {
    rebuildLayers();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const current = geometryRef.current;
      const next = createWheelGeometry(container);
      if (!next) return;
      if (current && current.size === next.size && current.dpr === next.dpr) return;
      rebuildLayers();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [rebuildLayers]);

  const handlePressStart = useCallback(() => setIsPressed(true), []);
  const handlePressEnd = useCallback(() => setIsPressed(false), []);

  const handleSpinClick = useCallback(() => {
    setIsPressed(false);
    startSpin();
  }, [startSpin]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Ruleta de categorías"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          touchAction: "none",
        }}
      />

      {segments.length > 0 ? (
        <button
          type="button"
          className="spin-button"
          style={SPIN_BUTTON_STYLE}
          aria-label="Girar la ruleta"
          disabled={phase !== "idle"}
          data-phase={phase}
          data-pressed={isPressed}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onClick={handleSpinClick}
        >
          <span className="spin-button__disc">{DISC_LABEL[phase]}</span>
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <div className="text-white text-xl">Sin preguntas disponibles</div>
        </div>
      )}
    </motion.div>
  );
});

export default RouletteWheel;
