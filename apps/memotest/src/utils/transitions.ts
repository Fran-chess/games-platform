/**
 * Transiciones de fase - Configuración centralizada
 * Garantiza coherencia visual entre todas las pantallas del juego
 * @module transitions
 */

import { Transition } from 'framer-motion';

/**
 * Transición base para todas las fases
 * Duration: 0.35s (balance entre suave y ágil en tablets)
 * Ease: easeInOut (simetría enter/exit)
 */
export const phaseTransition: Transition = {
  duration: 0.35,
  ease: 'easeInOut',
};

/**
 * Transición reducida para accesibilidad
 * Se usa cuando prefersReducedMotion o shouldReduceEffects
 */
export const phaseTransitionReduced: Transition = {
  duration: 0.2,
  ease: 'easeInOut',
};

/**
 * Transición premium para momentos clave (victoria)
 * Usa ease-out-back para efecto celebratorio
 */
export const phaseTransitionCelebration: Transition = {
  duration: 0.5,
  ease: [0.34, 1.56, 0.64, 1], // easeOutBack
};

/**
 * Overlay de transición de página
 * Más rápido para no retrasar el contenido
 */
export const overlayTransition: Transition = {
  duration: 0.4,
  ease: 'easeInOut',
};
