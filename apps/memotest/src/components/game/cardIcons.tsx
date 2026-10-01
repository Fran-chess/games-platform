/**
 * Íconos de las cartas: set "Cuidados Paliativos".
 * Dibujos de línea propios sobre un viewBox de 48. Toman el color de `currentColor`, así el
 * estilo de la carta se define por CSS sin tocar los trazos. Cada ícono tiene una silueta
 * distinta del resto (hay un solo corazón en todo el set) para que el juego sea justo.
 * Son SVG estáticos: se rasterizan una vez con la carta, sin requests ni dependencias.
 */

import type { ReactNode } from 'react';
import type { CardIconId } from '@/services/game/memoService';

const ICON_SHAPES: Record<CardIconId, ReactNode> = {
  // Cuidado compasivo, abordaje ético
  'manos-corazon': (
    <>
      <path d="M24 25c-6-4-11-8-11-13a5.5 5.5 0 0 1 11-1.5A5.5 5.5 0 0 1 35 12c0 5-5 9-11 13z" />
      <path d="M5 28c2 8 8 13 17 14" />
      <path d="M43 28c-2 8-8 13-17 14" />
      <path d="M5 28c4-1 8 1 10 5" />
      <path d="M43 28c-4-1-8 1-10 5" />
    </>
  ),
  // Cuidado domiciliario
  casa: (
    <>
      <path d="M6 22 24 7l18 15" />
      <path d="M10 19v21h28V19" />
      <path d="M15 40V29h7v11" />
      <rect x="27" y="27" width="7" height="7" rx="1" />
    </>
  ),
  // Símbolo de los cuidados paliativos; transiciones
  mariposa: (
    <>
      <path d="M24 15v20" />
      <path d="M24 15c-1.5-4-3.5-6-6-7" />
      <path d="M24 15c1.5-4 3.5-6 6-7" />
      <path d="M24 19C19 9 6 8 6 17c0 7 9 9 18 7" />
      <path d="M24 19c5-10 18-11 18-2 0 7-9 9-18 7" />
      <path d="M24 24c-8 1-13 5-12 11 1 5 9 5 12-3" />
      <path d="M24 24c8 1 13 5 12 11-1 5-9 5-12-3" />
    </>
  ),
  // Acompañamiento de familia y cuidador
  familia: (
    <>
      <circle cx="17" cy="13" r="5" />
      <path d="M8 41v-9a9 9 0 0 1 18 0v9" />
      <circle cx="36" cy="21" r="4" />
      <path d="M30 41v-6a6 6 0 0 1 12 0v6" />
    </>
  ),
  // Trayectorias de la enfermedad
  camino: (
    <>
      <path d="M31 18c-3.5-3.5-5.5-6.5-5.5-9.5a5.5 5.5 0 0 1 11 0c0 3-2 6-5.5 9.5z" />
      <circle cx="31" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M31 24c0 7-20 3-20 10.5 0 6 13 6.5 28 6.5" strokeDasharray="4 5" />
    </>
  ),
  // Manejo de síntomas y del dolor
  capsula: (
    <>
      <g transform="rotate(-45 22 24)">
        <rect x="6" y="17" width="32" height="14" rx="7" />
        <path d="M22 17v14" />
      </g>
      <path d="M38 29c-2.5 3-4 5.5-4 7.5a4 4 0 0 0 8 0c0-2-1.5-4.5-4-7.5z" />
    </>
  ),
  // Equipo interdisciplinario
  estetoscopio: (
    <>
      <path d="M12 6v11a8 8 0 0 0 16 0V6" />
      <path d="M9.5 6h5" />
      <path d="M25.5 6h5" />
      <path d="M20 25v8a7 7 0 0 0 14 0v-2" />
      <circle cx="34" cy="26" r="5" />
    </>
  ),
  // Innovación, telemedicina
  'tablet-salud': (
    <>
      <rect x="4" y="9" width="40" height="30" rx="4" />
      <path d="M9 24h7l3-7 5 14 4-10 2 3h5" />
      <circle cx="39.5" cy="24" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  // Calidad de vida, bienestar
  girasol: (
    <>
      <circle cx="24" cy="17" r="5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse key={angle} cx="24" cy="7.5" rx="2.6" ry="4" transform={`rotate(${angle} 24 17)`} />
      ))}
      <path d="M24 31v14" />
      <path d="M24 41c1-4 5-6 10-5-1 4-5 6-10 5z" />
    </>
  ),
};

interface CardIconProps {
  id: CardIconId;
  className?: string;
}

export function CardIcon({ id, className }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_SHAPES[id]}
    </svg>
  );
}
