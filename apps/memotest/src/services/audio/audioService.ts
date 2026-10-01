/**
 * Sonidos del juego, sintetizados con Web Audio: no hay archivos que descargar.
 * Las notas se programan con el reloj del AudioContext, sin timers de JavaScript.
 */

interface Tone {
  /** Frecuencia en Hz */
  frequency: number;
  /** Duración en ms */
  duration: number;
  /** Volumen entre 0 y 1 */
  volume: number;
  type?: OscillatorType;
  /** Decae durante toda la nota (sonido de campana) en vez de sostenerse */
  decay?: boolean;
}

/** Rampa de salida de las notas sostenidas: cortar el oscilador en seco produce un "click" */
const RELEASE_SECONDS = 0.015;

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      // Sin audio el juego sigue siendo jugable
      return null;
    }
  }
  return audioContext;
}

/**
 * Programa una nota. `delayMs` la atrasa respecto de ahora, para encadenar melodías.
 */
function playTone({ frequency, duration, volume, type = 'sine', decay = false }: Tone, delayMs = 0): void {
  const context = getContext();
  if (!context) return;

  const start = context.currentTime + delayMs / 1000;
  const end = start + duration / 1000;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, start);
  if (decay) {
    gain.gain.exponentialRampToValueAtTime(0.01, end);
  } else {
    gain.gain.setValueAtTime(volume, Math.max(start, end - RELEASE_SECONDS));
    gain.gain.linearRampToValueAtTime(0, end);
  }

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };

  oscillator.start(start);
  oscillator.stop(end);
}

/**
 * Notas en secuencia: cada una dura `noteMs` y la siguiente empieza `gapMs` después
 */
function playMelody(frequencies: number[], noteMs: number, gapMs: number): void {
  frequencies.forEach((frequency, index) => {
    playTone({ frequency, duration: noteMs, volume: 0.3, decay: true }, index * (noteMs + gapMs));
  });
}

export const audioService = {
  /**
   * Habilita el audio. Hay que llamarlo desde un toque del usuario:
   * el navegador deja el AudioContext suspendido hasta que hay un gesto.
   */
  unlock(): void {
    const context = getContext();
    if (context?.state === 'suspended') {
      void context.resume();
    }
  },

  /** Inicio de partida */
  playStart: () => playTone({ frequency: 1200, duration: 200, volume: 0.4 }),

  /** Carta dada vuelta */
  playFlip: () => playTone({ frequency: 600, duration: 50, volume: 0.3 }),

  /** Par acertado */
  playMatch: () => playTone({ frequency: 880, duration: 150, volume: 0.4, decay: true }),

  /** Par errado */
  playError: () => playTone({ frequency: 300, duration: 200, volume: 0.3, type: 'square' }),

  /** Últimos segundos del reloj */
  playTick: () => playTone({ frequency: 800, duration: 20, volume: 0.3 }),

  /** Partida ganada: Do, Mi, Sol, Do ascendente */
  playVictory: () => playMelody([523, 659, 784, 1047], 150, 50),

  /** Partida perdida: La, Sol#, Sol, Fa descendente */
  playDefeat: () => playMelody([440, 415, 392, 349], 200, 30),

  /** Carta de premio elegida */
  playPrizeSelect: () => playTone({ frequency: 1200, duration: 200, volume: 0.5, decay: true }),

  /** Premio ganado: Do, Mi, Sol, Do, Mi */
  playPrizeWin: () => playMelody([523, 659, 784, 1047, 1319], 120, 40),
};
