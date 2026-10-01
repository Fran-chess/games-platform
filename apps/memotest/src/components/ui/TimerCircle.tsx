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
  /** Diámetro del círculo en píxeles; la tipografía escala con él */
  size?: number;
  /** Grosor del trazo en píxeles */
  strokeWidth?: number;
}

/** Tamaño de fuente del número como fracción del diámetro (dos dígitos entran con margen) */
const FONT_SIZE_RATIO = 0.42;

const TimerCircle = memo(function TimerCircle({
  seconds,
  totalSeconds,
  isUrgent,
  size = 100,
  strokeWidth = 6,
}: TimerCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference * (1 - seconds / totalSeconds);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        {/* Disco de fondo: separa el número del degradado */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(15, 23, 42, 0.65)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />

        {/* Anillo de progreso: avance lineal, un segundo por paso. Solo transiciona el
            stroke-dashoffset: el repintado queda limitado a este SVG. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isUrgent ? '#ef4444' : '#67e8f9'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>

      <span
        className={`absolute inset-0 flex items-center justify-center font-black tabular-nums leading-none ${
          isUrgent ? 'text-red-400' : 'text-white'
        }`}
        style={{ fontSize: size * FONT_SIZE_RATIO }}
      >
        {seconds}
      </span>
    </div>
  );
});

export default TimerCircle;
