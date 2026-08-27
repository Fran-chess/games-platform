/**
 * Física del giro de la ruleta
 *
 * Modelo basado en tiempo real (milisegundos), independiente de la tasa de
 * refresco del dispositivo: el giro dura lo mismo a 60 Hz, a 90 Hz o con
 * frames perdidos. El segmento ganador se decide antes de girar y la rueda
 * se anima hasta dejarlo bajo el puntero, así lo que se ve y la pregunta
 * que se muestra nunca se contradicen.
 */

/**
 * Configuración del giro
 */
export const SPIN_CONFIG = {
  /** Duración del giro en ms. Alineada con la duración del audio wheel-spin.mp3 (~2.4 s) */
  DURATION_MS: 2400,
  /** Vueltas completas mínimas antes de detenerse */
  MIN_ROTATIONS: 3,
  /** Vueltas completas máximas antes de detenerse */
  MAX_ROTATIONS: 5,
  /**
   * Fracción del ancho del segmento (centrada) dentro de la cual puede caer el puntero.
   * 0.6 → el puntero cae a ±30 % del centro del segmento, nunca sobre un borde.
   */
  LANDING_SPREAD: 0.6,
} as const;

/**
 * Configuración del resplandor del segmento ganador
 */
export const WINNER_GLOW_CONFIG = {
  /** Duración total (subida y bajada) en ms */
  DURATION_MS: 700,
  /** Intensidad máxima (0 a 1). El realce es solo contorno y halo, nunca un velo sobre el título */
  MAX_INTENSITY: 0.85,
} as const;

/**
 * Plan de un giro: todo lo necesario para calcular el ángulo en cualquier instante
 */
export interface SpinPlan {
  /** Marca de tiempo (performance.now) en la que empezó el giro */
  startTime: number;
  /** Ángulo de la rueda al iniciar, en grados */
  startAngle: number;
  /** Ángulo absoluto de llegada, en grados (incluye las vueltas completas) */
  targetAngle: number;
  /** Duración del giro en ms */
  durationMs: number;
  /** Índice del segmento que quedará bajo el puntero */
  winnerIndex: number;
}

/**
 * Curva de velocidad del giro: ease-out cúbico.
 * Arranca a velocidad máxima (como una rueda empujada) y frena de forma
 * continua hasta detenerse, sin saltos de velocidad.
 *
 * @param t - Tiempo normalizado (0 a 1)
 * @returns Progreso normalizado (0 a 1)
 */
function easeSpin(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Normaliza un ángulo al rango [0, 360)
 */
export function normalizeAngle(degrees: number): number {
  const angle = degrees % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * Ángulo de rueda (0 a 360) que deja el segmento indicado bajo el puntero superior.
 * Es la operación inversa de `calculateWinningSegment`.
 *
 * @param segmentIndex - Índice del segmento objetivo
 * @param numSegments - Cantidad total de segmentos
 * @param spread - Fracción del ancho del segmento donde puede caer el puntero
 */
function angleForSegment(
  segmentIndex: number,
  numSegments: number,
  spread: number = SPIN_CONFIG.LANDING_SPREAD
): number {
  const segmentAngle = 360 / numSegments;
  const segmentCenter = (segmentIndex + 0.5) * segmentAngle;
  const offset = (Math.random() - 0.5) * segmentAngle * spread;
  return normalizeAngle(360 - segmentCenter + offset);
}

/**
 * Elige el segmento ganador de forma aleatoria, evitando que el mismo
 * segmento salga tres veces seguidas.
 *
 * @param numSegments - Cantidad total de segmentos
 * @param recentWinners - Índices ganadores recientes, del más antiguo al más reciente
 */
export function pickWinnerIndex(numSegments: number, recentWinners: number[]): number {
  const lastTwo = recentWinners.slice(-2);
  const blockedIndex =
    lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null;

  const candidates: number[] = [];
  for (let index = 0; index < numSegments; index++) {
    if (numSegments < 2 || index !== blockedIndex) candidates.push(index);
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Crea el plan de un giro que termina con `winnerIndex` bajo el puntero
 *
 * @param startAngle - Ángulo actual de la rueda, en grados
 * @param numSegments - Cantidad total de segmentos
 * @param winnerIndex - Segmento que debe quedar bajo el puntero
 * @param now - Marca de tiempo actual (performance.now)
 */
export function createSpinPlan(
  startAngle: number,
  numSegments: number,
  winnerIndex: number,
  now: number
): SpinPlan {
  const landingAngle = angleForSegment(winnerIndex, numSegments);

  // Distancia hacia adelante desde la posición actual hasta el ángulo de llegada
  let landingDelta = landingAngle - normalizeAngle(startAngle);
  if (landingDelta < 0) landingDelta += 360;

  const rotationRange = SPIN_CONFIG.MAX_ROTATIONS - SPIN_CONFIG.MIN_ROTATIONS + 1;
  const fullRotations = SPIN_CONFIG.MIN_ROTATIONS + Math.floor(Math.random() * rotationRange);

  return {
    startTime: now,
    startAngle,
    targetAngle: startAngle + fullRotations * 360 + landingDelta,
    durationMs: SPIN_CONFIG.DURATION_MS,
    winnerIndex,
  };
}

/**
 * Estado del giro en un instante dado
 */
export interface SpinFrame {
  /** Ángulo de la rueda en grados (no normalizado) */
  angle: number;
  /** Progreso temporal (0 a 1) */
  progress: number;
  /** true cuando el giro terminó */
  done: boolean;
}

/**
 * Calcula el ángulo de la rueda para un instante del giro
 *
 * @param plan - Plan del giro
 * @param now - Marca de tiempo actual (performance.now)
 */
export function getSpinFrame(plan: SpinPlan, now: number): SpinFrame {
  const progress = Math.min(1, Math.max(0, (now - plan.startTime) / plan.durationMs));
  const angle = plan.startAngle + (plan.targetAngle - plan.startAngle) * easeSpin(progress);
  return { angle, progress, done: progress >= 1 };
}

/**
 * Intensidad del resplandor del ganador en un instante dado.
 * Sube y baja con una curva senoidal para que el efecto no tenga cortes.
 *
 * @param elapsedMs - Milisegundos desde que terminó el giro
 * @returns Intensidad (0 a MAX_INTENSITY); 0 cuando el efecto terminó
 */
export function getWinnerGlowIntensity(elapsedMs: number): number {
  const t = elapsedMs / WINNER_GLOW_CONFIG.DURATION_MS;
  if (t <= 0 || t >= 1) return 0;
  return WINNER_GLOW_CONFIG.MAX_INTENSITY * Math.sin(Math.PI * t);
}

/**
 * Calcula el segmento que queda bajo el puntero superior para un ángulo de rueda.
 * Los segmentos se dibujan desde arriba (−90°) en sentido horario, y la rueda
 * rota en sentido horario; el punto bajo el puntero es el que estaba a (360 − θ).
 *
 * @param angleDeg - Ángulo de la rueda en grados
 * @param numSegments - Cantidad total de segmentos
 * @returns Índice del segmento ganador, o -1 si no hay segmentos
 */
export function calculateWinningSegment(angleDeg: number, numSegments: number): number {
  if (numSegments <= 0) return -1;

  const segmentAngle = 360 / numSegments;
  const relative = normalizeAngle(360 - normalizeAngle(angleDeg));

  // Epsilon para no caer en el sector vecino por errores de coma flotante
  const EPSILON = 1e-6;
  return Math.floor((relative + EPSILON) / segmentAngle) % numSegments;
}

/**
 * Genera vibración del dispositivo si está disponible
 *
 * @param pattern - Patrón de vibración en milisegundos
 */
export function triggerVibration(pattern: number | number[] = 50): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
