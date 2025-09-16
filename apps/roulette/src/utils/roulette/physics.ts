/**
 * Física y animación de la ruleta
 * Maneja el comportamiento del giro, velocidad y desaceleración
 */

/**
 * Configuración de física de la ruleta
 */
export const PHYSICS_CONFIG = {
  /** Velocidad inicial mínima del giro (grados/frame) */
  MIN_INITIAL_VELOCITY: 15,
  /** Velocidad inicial máxima del giro (grados/frame) */
  MAX_INITIAL_VELOCITY: 25,
  /** Factor de desaceleración (fricción) */
  DECELERATION_FACTOR: 0.985,
  /** Velocidad mínima antes de detener (grados/frame) */
  MIN_VELOCITY_THRESHOLD: 0.5,
  /** Duración mínima del giro en frames */
  MIN_SPIN_DURATION: 120,
  /** Duración máxima del giro en frames */
  MAX_SPIN_DURATION: 180,
  /** FPS objetivo para la animación */
  TARGET_FPS: 60,
} as const;

/**
 * Configuración de sonido de la ruleta
 */
export const SOUND_CONFIG = {
  /** Volumen del tick */
  TICK_VOLUME: 0.3,
  /** Frecuencia del tick en Hz */
  TICK_FREQUENCY: 800,
  /** Duración del tick en ms */
  TICK_DURATION: 20,
  /** Velocidad mínima para reproducir sonido */
  MIN_SOUND_VELOCITY: 2,
} as const;

/**
 * Estado del giro de la ruleta
 */
export interface SpinState {
  isSpinning: boolean;
  currentAngle: number;
  velocity: number;
  targetAngle: number;
  spinDuration: number;
  elapsedFrames: number;
  initialAngle?: number;
}

/**
 * Función de easing personalizada para simular la física real de una ruleta
 * Combina aceleración inicial con desaceleración progresiva más suave
 *
 * @param t - Valor normalizado de tiempo (0 a 1)
 * @returns Valor de progreso con easing aplicado (0 a 1)
 */
export function customEasingFunction(t: number): number {
  if (t < 0.2) {
    // Aceleración inicial más suave
    return 5 * t * t;
  } else if (t < 0.7) {
    // Velocidad constante en el medio
    return 0.2 + (t - 0.2) * 1.4;
  } else {
    // Desaceleración más gradual usando ease-out quint
    const adjustedT = (t - 0.7) / 0.3; // Normalizar el último 30%
    return 0.9 + 0.1 * (1 - Math.pow(1 - adjustedT, 5));
  }
}

/**
 * Calcula la velocidad inicial aleatoria para el giro
 *
 * @returns Velocidad inicial en grados por frame
 */
export function calculateInitialVelocity(): number {
  const range = PHYSICS_CONFIG.MAX_INITIAL_VELOCITY - PHYSICS_CONFIG.MIN_INITIAL_VELOCITY;
  return PHYSICS_CONFIG.MIN_INITIAL_VELOCITY + Math.random() * range;
}

/**
 * Calcula el ángulo de destino aleatorio para el giro de la ruleta
 *
 * @param minRotations - Número mínimo de rotaciones completas
 * @param maxRotations - Número máximo de rotaciones completas
 * @returns Ángulo de destino en grados
 */
export function calculateTargetAngle(
  minRotations: number = 3,
  maxRotations: number = 5
): number {
  // Número de rotaciones completas aleatorias
  const rotations = minRotations + Math.random() * (maxRotations - minRotations);

  // Ángulo final aleatorio (0-360 grados)
  const finalAngle = Math.random() * 360;

  // Total: rotaciones completas + ángulo final aleatorio
  return rotations * 360 + finalAngle;
}

/**
 * Calcula la duración del giro basada en el ángulo objetivo
 *
 * @param targetAngle - Ángulo de destino en grados
 * @returns Duración en frames
 */
export function calculateSpinDuration(targetAngle: number): number {
  const normalizedAngle = targetAngle / 360;
  const baseDuration = PHYSICS_CONFIG.MIN_SPIN_DURATION;
  const variableDuration = (PHYSICS_CONFIG.MAX_SPIN_DURATION - PHYSICS_CONFIG.MIN_SPIN_DURATION) *
    (normalizedAngle / 10); // Ajustar según las rotaciones

  return Math.min(
    baseDuration + variableDuration,
    PHYSICS_CONFIG.MAX_SPIN_DURATION
  );
}

/**
 * Actualiza el estado del giro para el siguiente frame
 *
 * @param state - Estado actual del giro
 * @returns Nuevo estado del giro
 */
export function updateSpinState(state: SpinState): SpinState {
  if (!state.isSpinning) return state;

  const progress = state.elapsedFrames / state.spinDuration;

  if (progress >= 1) {
    // Giro completado - normalizar ángulo final
    const finalAngle = state.targetAngle % 360;
    return {
      ...state,
      isSpinning: false,
      currentAngle: finalAngle < 0 ? finalAngle + 360 : finalAngle,
      velocity: 0,
      elapsedFrames: 0,
      initialAngle: undefined,
    };
  }

  // Aplicar easing para obtener el ángulo actual
  const easedProgress = customEasingFunction(progress);

  // Usar el ángulo inicial guardado o el actual si es el primer frame
  const initialAngle = state.initialAngle ?? state.currentAngle;
  const totalRotation = state.targetAngle - initialAngle;

  // Interpolación con easing
  const newAngle = initialAngle + totalRotation * easedProgress;

  // Calcular velocidad instantánea para efectos (como sonido)
  const deltaAngle = newAngle - state.currentAngle;
  const instantVelocity = Math.abs(deltaAngle);

  return {
    ...state,
    currentAngle: newAngle,
    velocity: instantVelocity,
    elapsedFrames: state.elapsedFrames + 1,
    initialAngle: initialAngle,
  };
}

/**
 * Determina si se debe reproducir el sonido de tick
 *
 * @param velocity - Velocidad actual
 * @param segmentAngle - Ángulo de cada segmento
 * @param lastTickAngle - Ángulo del último tick
 * @param currentAngle - Ángulo actual
 * @returns true si se debe reproducir el tick
 */
export function shouldPlayTick(
  velocity: number,
  segmentAngle: number,
  lastTickAngle: number,
  currentAngle: number
): boolean {
  if (velocity < SOUND_CONFIG.MIN_SOUND_VELOCITY) return false;

  const anglesSinceLastTick = Math.abs(currentAngle - lastTickAngle);
  return anglesSinceLastTick >= segmentAngle;
}

/**
 * Calcula el segmento ganador basado en el ángulo final
 * La flecha está arriba (270° = -90° = -π/2), así que el segmento en esa posición es el ganador
 *
 * @param finalAngle - Ángulo final de la ruleta (en grados)
 * @param numSegments - Número total de segmentos
 * @returns Índice del segmento ganador (0-based)
 */
export function calculateWinningSegment(
  finalAngle: number,
  numSegments: number
): number {
  if (numSegments === 0) return -1;

  const segmentAngle = 360 / numSegments;

  // Normalizar el ángulo para que esté entre 0 y 360
  let normalizedAngle = finalAngle % 360;
  if (normalizedAngle < 0) normalizedAngle += 360;

  // La ruleta rota en sentido horario
  // Los segmentos están numerados 0, 1, 2... en sentido horario empezando desde arriba
  // Cuando angle=0: segmento 0 está arriba
  // Cuando angle=60 (para 6 segmentos): segmento 1 está arriba
  // Cuando angle=120: segmento 2 está arriba, etc.

  // El segmento que está arriba es directamente proporcional al ángulo de rotación
  const segmentIndex = Math.round(normalizedAngle / segmentAngle) % numSegments;

  return segmentIndex;
}

/**
 * Genera vibración del dispositivo si está disponible
 *
 * @param pattern - Patrón de vibración en milisegundos
 */
export function triggerVibration(pattern: number | number[] = 50): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Crea un contexto de audio para los efectos de sonido
 *
 * @returns AudioContext o null si no está disponible
 */
export function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  try {
    return new AudioContextClass();
  } catch {
    return null;
  }
}

/**
 * Reproduce un sonido de tick usando Web Audio API
 *
 * @param audioContext - Contexto de audio
 */
export function playTickSound(audioContext: AudioContext | null): void {
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = SOUND_CONFIG.TICK_FREQUENCY;
    gainNode.gain.value = SOUND_CONFIG.TICK_VOLUME;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + SOUND_CONFIG.TICK_DURATION / 1000);
  } catch {
    // Silenciar errores de audio
  }
}