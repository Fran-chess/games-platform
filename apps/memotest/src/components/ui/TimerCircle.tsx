/**
 * Componente de Timer Circular
 * Muestra los segundos restantes dentro de un anillo que se vacía,
 * sobre un disco oscuro para que el número se lea sobre cualquier fondo.
 */

import { memo } from 'react';

interface TimerCircleProps {
  /** Segundos restantes */
  seconds: number;
  /** Segundos totales de la cuenta */
  totalSeconds: number;
  /** Si el timer está en estado urgente */
  isUrgent: boolean;
}

/** Diámetro en píxeles: entra en el HUD (112 px de alto) con margen */
const SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

/** Tamaño de fuente del número como fracción del diámetro (dos dígitos entran con margen) */
const FONT_SIZE = SIZE * 0.42;

const TimerCircle = memo(function TimerCircle({ seconds, totalSeconds, isUrgent }: TimerCircleProps) {
  const offset = CIRCUMFERENCE * (1 - seconds / totalSeconds);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg className="-rotate-90" width={SIZE} height={SIZE} aria-hidden="true">
        {/* Disco de fondo: separa el número del degradado */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="rgba(15, 23, 42, 0.65)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Anillo de progreso: avance lineal, un segundo por paso. Solo transiciona el
            stroke-dashoffset: el repintado queda limitado a este SVG. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={isUrgent ? '#ef4444' : '#67e8f9'}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>

      <span
        className={`absolute inset-0 flex items-center justify-center font-black tabular-nums leading-none ${
          isUrgent ? 'text-red-400' : 'text-white'
        }`}
        style={{ fontSize: FONT_SIZE }}
      >
        {seconds}
      </span>
    </div>
  );
});

export default TimerCircle;
