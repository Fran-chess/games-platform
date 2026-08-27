/**
 * Componente de Timer Circular
 * Muestra un contador visual con progreso circular sobre un disco oscuro,
 * para que el número se lea sobre cualquier zona del degradado de fondo.
 */

import { memo } from 'react';

interface TimerCircleProps {
  /** Segundos actuales */
  seconds: number;
  /** Segundos iniciales/totales */
  initialSeconds: number;
  /** Si el timer está en estado urgente */
  isUrgent: boolean;
  /** Diámetro del círculo en píxeles; la tipografía escala con él */
  size?: number;
  /** Grosor del trazo en píxeles */
  strokeWidth?: number;
}

/** Tamaño de fuente del número como fracción del diámetro (dos dígitos entran con margen) */
const FONT_SIZE_RATIO = 0.42;

/**
 * Componente visual de timer circular con animación
 */
const TimerCircle = memo(({
  seconds,
  initialSeconds,
  isUrgent,
  size = 100,
  strokeWidth = 6,
}: TimerCircleProps) => {
  // Cálculos del círculo
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (seconds / initialSeconds) * circumference;

  return (
    <div className={`relative ${isUrgent ? 'animate-pulse' : ''}`} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        {/* Disco de fondo: separa el número del degradado */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(15, 23, 42, 0.65)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />

        {/* Círculo de progreso: avance lineal, un segundo por paso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isUrgent ? '#ef4444' : '#10b981'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>

      {/* Número central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`font-black tabular-nums leading-none drop-shadow-md ${
            isUrgent ? 'text-red-400' : 'text-white'
          }`}
          style={{ fontSize: size * FONT_SIZE_RATIO }}
        >
          {seconds}
        </span>
      </div>
    </div>
  );
});

TimerCircle.displayName = 'TimerCircle';

export default TimerCircle;
