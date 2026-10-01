/**
 * Reglas del MemoTest: configuración, tiempos y lógica pura de la partida.
 * Todo lo que define cómo se juega está en este archivo.
 */

/**
 * Íconos disponibles para las cartas (set "Cuidados Paliativos").
 * Cada partida sortea `totalPairs` de ellos. Los dibujos están en components/game/cardIcons.tsx.
 */
const CARD_ICON_IDS = [
  'manos-corazon',
  'casa',
  'mariposa',
  'familia',
  'camino',
  'capsula',
  'estetoscopio',
  'tablet-salud',
  'girasol',
] as const;

export type CardIconId = (typeof CARD_ICON_IDS)[number];

export interface MemoCard {
  id: string;
  /** Dos cartas forman par cuando tienen el mismo ícono */
  icon: CardIconId;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface PrizeCard {
  id: string;
  hasPrize: boolean;
}

type RoundOutcome = 'playing' | 'won' | 'lost';

export const GAME_CONFIG = {
  /** Pares en el tablero (12 cartas en una grilla de 6×2) */
  totalPairs: 6,
  /** Pares que hay que encontrar para ganar */
  requiredPairs: 2,
  /** Intentos disponibles: con 2 pares requeridos, tolera un error */
  maxMoves: 3,
  /** Segundos con las cartas boca abajo antes de mostrarlas */
  readyTime: 1,
  /** Segundos con las cartas a la vista */
  memorizationTime: 5,
  /** Segundos para jugar. Tres intentos llevan menos de 15 s: con 30 s el reloj aprieta sin apurar */
  gameTime: 30,
  /** Segundos restantes desde los que el reloj se muestra en rojo */
  urgentTime: 10,
  /** Segundos restantes desde los que suena el tick */
  tickTime: 5,
} as const;

/** Duración del giro de una carta. El CSS la recibe como --flip-ms (ver GameBoard). */
export const FLIP_MS = 300;

/** Espera tras el segundo toque antes de resolver el par: el giro tiene que haber terminado */
export const RESOLVE_DELAY_MS = FLIP_MS + 100;

/** Tiempo que un par errado queda a la vista antes de taparse: el error tiene que enseñar */
export const MISMATCH_HOLD_MS = 900;

/** Tiempo que el tablero ganado queda a la vista antes de pasar al premio */
export const SUCCESS_HOLD_MS = 1500;

/** Duración del giro de las cartas de premio (--flip-ms en PrizePhase) */
export const PRIZE_FLIP_MS = 800;

/** Espera entre elegir una carta de premio y mostrar qué había: el giro más una pausa */
export const PRIZE_REVEAL_MS = PRIZE_FLIP_MS + 400;

/** Pausa entre los pasos de la revelación cuando la carta elegida no tenía premio */
export const PRIZE_STEP_MS = 1500;

/** Duración del confetti al ganar el premio */
export const CONFETTI_MS = 4000;

/** Inactividad en Premio o Derrota tras la que el juego vuelve solo a la pantalla de espera */
export const IDLE_RETURN_MS = 20000;

/**
 * Devuelve una copia mezclada (Fisher-Yates)
 */
function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Cartas de una partida: sortea los íconos, arma los pares y los mezcla.
 * El orden del array es el orden en el tablero.
 */
export function createCards(): MemoCard[] {
  const icons = shuffle(CARD_ICON_IDS).slice(0, GAME_CONFIG.totalPairs);

  const cards = icons.flatMap((icon) =>
    [0, 1].map((copy): MemoCard => ({
      id: `card-${icon}-${copy}`,
      icon,
      isFlipped: false,
      isMatched: false,
    }))
  );

  return shuffle(cards);
}

/**
 * Tres cartas de premio, una sola ganadora, en orden aleatorio
 */
export function createPrizeCards(): PrizeCard[] {
  return shuffle([
    { id: 'prize-0', hasPrize: true },
    { id: 'prize-1', hasPrize: false },
    { id: 'prize-2', hasPrize: false },
  ]);
}

/**
 * Estado de la partida después de resolver un intento.
 * El tiempo agotado se trata aparte: lo decide el reloj.
 */
export function evaluateRound(matchesFound: number, movesUsed: number): RoundOutcome {
  if (matchesFound >= GAME_CONFIG.requiredPairs) {
    return 'won';
  }

  // Derrota anticipada: ni acertando todos los intentos que quedan se llega a los pares requeridos.
  // Cubre también el caso de intentos agotados (movesLeft = 0).
  const movesLeft = GAME_CONFIG.maxMoves - movesUsed;
  if (matchesFound + movesLeft < GAME_CONFIG.requiredPairs) {
    return 'lost';
  }

  return 'playing';
}
