/**
 * Exportaciones centralizadas de utilidades de la ruleta
 */

// Colores
export {
  ROULETTE_COLORS,
  AVAILABLE_COLORS,
  CATEGORY_COLOR_MAP,
  SEGMENT_TEXT_COLORS,
  getContrastColor,
  getCategoryColor,
} from './colors';

// Segmentos
export { createRouletteSegments } from './segments';

// Física
export {
  SPIN_CONFIG,
  WINNER_GLOW_CONFIG,
  type SpinPlan,
  type SpinFrame,
  normalizeAngle,
  pickWinnerIndex,
  createSpinPlan,
  getSpinFrame,
  getWinnerGlowIntensity,
  calculateWinningSegment,
  triggerVibration,
} from './physics';
