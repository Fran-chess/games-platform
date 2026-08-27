/**
 * Lógica de la ruleta: estado del giro, animación y resolución del ganador
 *
 * La animación vive fuera del ciclo de render de React: el estado por frame
 * se guarda en refs y el loop de requestAnimationFrame llama a `render` con
 * el frame calculado. React solo interviene al empezar y terminar el giro,
 * a través de `phase`.
 */

import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Question, WheelSegment } from '@/types';
import { audioService } from '@/services/audio/audioService';
import type { FrameState } from '@/services/roulette/canvasRenderer';
import {
  type SpinPlan,
  WINNER_GLOW_CONFIG,
  createRouletteSegments,
  createSpinPlan,
  getSpinFrame,
  getWinnerGlowIntensity,
  pickWinnerIndex,
  calculateWinningSegment,
  normalizeAngle,
  triggerVibration,
} from '@/utils/roulette';

/**
 * Fase del giro. Tras `resolved` no se vuelve a `idle`: la página cambia de vista
 * con el resultado y la ruleta se monta de nuevo en el próximo turno.
 */
type SpinPhase = 'idle' | 'spinning' | 'resolved';

/**
 * Configuración del hook
 */
interface UseRouletteLogicConfig {
  questions: Question[];
  /** Dibuja un frame. Se invoca desde el loop de animación. */
  render: (frame: FrameState) => void;
}

/**
 * Retorno del hook
 */
interface UseRouletteLogicReturn {
  segments: WheelSegment[];
  phase: SpinPhase;
  /** Inicia un giro. No hace nada si la ruleta no está en reposo o no hay segmentos. */
  startSpin: () => void;
  /** Frame actual, para redibujar fuera del loop (por ejemplo tras un resize) */
  getFrame: () => FrameState;
}

/**
 * Hook para manejar toda la lógica de la ruleta
 */
export function useRouletteLogic({ questions, render }: UseRouletteLogicConfig): UseRouletteLogicReturn {
  const segments = useMemo(() => createRouletteSegments(questions), [questions]);
  const [phase, setPhase] = useState<SpinPhase>('idle');

  // Estado de animación (fuera de React)
  const angleRef = useRef(0);
  const planRef = useRef<SpinPlan | null>(null);
  const glowStartRef = useRef<number | null>(null);
  const winnerRef = useRef<number | null>(null);
  const frameRequestRef = useRef<number | null>(null);

  // Últimas versiones de props y segmentos, para que el loop nunca use closures viejas
  const renderRef = useRef(render);
  const segmentsRef = useRef(segments);

  useEffect(() => {
    renderRef.current = render;
  }, [render]);

  useEffect(() => {
    segmentsRef.current = segments;
    // El índice ganador deja de tener sentido si cambian los segmentos
    winnerRef.current = null;
  }, [segments]);

  const buildFrame = useCallback((now: number): FrameState => ({
    angleDeg: angleRef.current,
    winnerSegment: winnerRef.current,
    glowIntensity: glowStartRef.current === null
      ? 0
      : getWinnerGlowIntensity(now - glowStartRef.current),
  }), []);

  const getFrame = useCallback(() => buildFrame(performance.now()), [buildFrame]);

  /**
   * Cierra el giro: fija el ángulo final, resuelve el ganador y lo publica en el store
   */
  const completeSpin = useCallback((plan: SpinPlan, now: number) => {
    const currentSegments = segmentsRef.current;

    angleRef.current = normalizeAngle(plan.targetAngle);
    planRef.current = null;

    const winnerIndex = calculateWinningSegment(angleRef.current, currentSegments.length);
    winnerRef.current = winnerIndex;
    glowStartRef.current = now;

    audioService.stopWheelSpinSound();
    triggerVibration([100, 50, 100, 50, 200]);

    const store = useGameStore.getState();
    store.setLastSpinResultIndex(winnerIndex);
    store.setLastSpinSegment(currentSegments[winnerIndex]);
    store.addRecentSpinSegment(winnerIndex);

    setPhase('resolved');
  }, []);

  /**
   * Un paso del loop de animación. Se reprograma mientras haya giro o resplandor activos.
   */
  const tick = useCallback((now: number) => {
    const plan = planRef.current;
    if (plan) {
      const spinFrame = getSpinFrame(plan, now);
      angleRef.current = spinFrame.angle;
      if (spinFrame.done) completeSpin(plan, now);
    }

    if (glowStartRef.current !== null && now - glowStartRef.current >= WINNER_GLOW_CONFIG.DURATION_MS) {
      glowStartRef.current = null;
    }

    renderRef.current(buildFrame(now));

    const isAnimating = planRef.current !== null || glowStartRef.current !== null;
    frameRequestRef.current = isAnimating ? requestAnimationFrame(tick) : null;
  }, [buildFrame, completeSpin]);

  const startSpin = useCallback(() => {
    const currentSegments = segmentsRef.current;
    // Solo desde reposo: ni durante el giro ni mientras se muestra el resultado
    // (un toque en esa ventana relanzaría el giro y cancelaría la pregunta pendiente)
    if (planRef.current !== null || winnerRef.current !== null || currentSegments.length === 0) return;

    const now = performance.now();
    const store = useGameStore.getState();
    const winnerIndex = pickWinnerIndex(currentSegments.length, store.recentSpinSegments);

    // Invalidar el resultado anterior: los segmentos son objetos estables (memoizados),
    // así que si vuelve a salir la misma categoría el store debe ver un cambio real.
    store.setLastSpinResultIndex(null);
    store.setLastSpinSegment(null);

    planRef.current = createSpinPlan(angleRef.current, currentSegments.length, winnerIndex, now);
    glowStartRef.current = null;

    setPhase('spinning');
    audioService.playWheelSpinSound();
    triggerVibration([50, 30, 20]);

    if (frameRequestRef.current === null) {
      frameRequestRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  // Limpieza al desmontar: cortar el loop y el sonido si el giro quedó a medias
  useEffect(() => {
    return () => {
      if (frameRequestRef.current !== null) {
        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }
      if (planRef.current !== null) {
        planRef.current = null;
        audioService.stopWheelSpinSound();
      }
    };
  }, []);

  return {
    segments,
    phase,
    startSpin,
    getFrame,
  };
}
