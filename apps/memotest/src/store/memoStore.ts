/**
 * MemoTest Game Store
 * El store conduce la partida completa: fases, reloj, sonidos y tiempos de espera.
 * Los componentes solo dibujan el estado y avisan los toques.
 * @module memoStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  CONFETTI_MS,
  GAME_CONFIG,
  IDLE_RETURN_MS,
  MISMATCH_HOLD_MS,
  PRIZE_REVEAL_MS,
  PRIZE_STEP_MS,
  RESOLVE_DELAY_MS,
  SUCCESS_HOLD_MS,
  createCards,
  createPrizeCards,
  evaluateRound,
  type CardIconId,
  type MemoCard,
  type PrizeCard,
} from '@/services/game/memoService';
import { clockService } from '@/services/game/clockService';
import { audioService } from '@/services/audio/audioService';
import { screenTransition } from '@/utils/screenTransition';

// ============= TYPES =============

/**
 * Fases del juego
 */
export type GameState =
  | 'waiting'      // Pantalla de espera
  | 'ready'        // Tablero con las cartas boca abajo, antes de mostrarlas
  | 'memorizing'   // Cartas a la vista para memorizar
  | 'playing'      // Jugando
  | 'success'      // Encontró los pares requeridos; el tablero queda a la vista un momento
  | 'failed'       // Pantalla de derrota (sin intentos o sin tiempo)
  | 'prize';       // Selección de premio

/**
 * Pasos de la selección de premio
 */
type PrizeStage =
  | 'choosing'      // Esperando que el jugador elija una carta
  | 'revealing'     // La carta elegida se está dando vuelta
  | 'winner-shown'  // La elegida no tenía premio: se muestra dónde estaba
  | 'result';       // Mensaje final

interface MemoState {
  gameState: GameState;

  // Tablero (normalizado: cartas por id + orden)
  cardsById: Record<string, MemoCard>;
  cardOrder: string[];
  selectedCards: string[];
  /** Par errado que está a la vista antes de taparse */
  mismatchedCards: string[];
  /** El tablero no acepta toques: fuera de la fase de juego o mientras se resuelve un par */
  isBoardLocked: boolean;
  movesUsed: number;
  matchesFound: number;
  timeLeft: number;

  // Premio
  prizeCards: PrizeCard[];
  selectedPrizeId: string | null;
  prizeStage: PrizeStage;
  showConfetti: boolean;
}

interface MemoActions {
  /** Empieza una partida nueva, desde la pantalla de espera o desde una pantalla final */
  startGame: () => void;
  flipCard: (cardId: string) => void;
  pickPrizeCard: (cardId: string) => void;
  /** Avisa que hubo un toque en una pantalla final: posterga la vuelta por inactividad */
  keepAlive: () => void;
  /** Vuelve a la pantalla de espera */
  resetGame: () => void;
}

type MemoStore = MemoState & MemoActions;

const INITIAL_STATE: MemoState = {
  gameState: 'waiting',
  cardsById: {},
  cardOrder: [],
  selectedCards: [],
  mismatchedCards: [],
  isBoardLocked: true,
  movesUsed: 0,
  matchesFound: 0,
  timeLeft: 0,
  prizeCards: [],
  selectedPrizeId: null,
  prizeStage: 'choosing',
  showConfetti: false,
};

// ============= TIMERS =============
// Viven fuera del state: no son datos que alguien dibuje, y así cualquier cambio de partida
// puede cancelar lo que quedó pendiente de la anterior.

const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function schedule(callback: () => void, ms: number): void {
  const timer = setTimeout(() => {
    pendingTimers.delete(timer);
    callback();
  }, ms);
  pendingTimers.add(timer);
}

/** Cancela todo lo pendiente: pasos de la partida, reloj y vuelta por inactividad */
function cancelPending(): void {
  pendingTimers.forEach(clearTimeout);
  pendingTimers.clear();
  clearTimeout(idleTimer);
  clockService.stop();
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// ============= STORE =============

export const useMemoStore = create<MemoStore>()(
  devtools(
    (set, get) => {
      /** Todas las cartas boca arriba o boca abajo */
      const withAllCardsFlipped = (isFlipped: boolean): Record<string, MemoCard> =>
        Object.fromEntries(
          Object.entries(get().cardsById).map(([id, card]) => [id, { ...card, isFlipped }])
        );

      /** Si nadie toca la pantalla final, el juego vuelve a la espera para el próximo jugador */
      const armIdleReturn = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => get().resetGame(), IDLE_RETURN_MS);
      };

      const beginMemorizing = () => {
        set({ gameState: 'memorizing', cardsById: withAllCardsFlipped(true) });

        clockService.start(GAME_CONFIG.memorizationTime, (timeLeft) => {
          set({ timeLeft });
          if (timeLeft === 0) {
            beginPlaying();
          }
        });
      };

      const beginPlaying = () => {
        set({ gameState: 'playing', cardsById: withAllCardsFlipped(false), isBoardLocked: false });

        clockService.start(GAME_CONFIG.gameTime, (timeLeft) => {
          set({ timeLeft });
          if (timeLeft === 0) {
            enterFailed();
          } else if (timeLeft <= GAME_CONFIG.tickTime) {
            audioService.playTick();
          }
        });
      };

      const enterPrize = () => {
        screenTransition(() =>
          set({ gameState: 'prize', prizeCards: createPrizeCards() })
        );
        armIdleReturn();
      };

      const enterFailed = () => {
        cancelPending();
        audioService.playDefeat();
        screenTransition(() => set({ gameState: 'failed', isBoardLocked: true }));
        armIdleReturn();
      };

      /**
       * Resuelve el par recién dado vuelta. El resultado de la partida se decide acá mismo:
       * si terminó, el tablero queda bloqueado desde este instante y solo falta cambiar de pantalla.
       */
      const resolvePair = () => {
        const state = get();
        const [firstId, secondId] = state.selectedCards;
        const first = state.cardsById[firstId];
        const second = state.cardsById[secondId];

        const isMatch = first.icon === second.icon;
        const matchesFound = state.matchesFound + (isMatch ? 1 : 0);
        const outcome = evaluateRound(matchesFound, state.movesUsed);

        if (outcome !== 'playing') {
          clockService.stop();
        }

        if (isMatch) {
          set({
            cardsById: {
              ...state.cardsById,
              [firstId]: { ...first, isMatched: true },
              [secondId]: { ...second, isMatched: true },
            },
            matchesFound,
            selectedCards: [],
            isBoardLocked: outcome !== 'playing',
            gameState: outcome === 'won' ? 'success' : state.gameState,
          });

          if (outcome === 'won') {
            audioService.playVictory();
            schedule(enterPrize, SUCCESS_HOLD_MS);
          } else {
            audioService.playMatch();
            if (outcome === 'lost') {
              schedule(enterFailed, MISMATCH_HOLD_MS);
            }
          }
          return;
        }

        audioService.playError();
        set({ mismatchedCards: [firstId, secondId] });

        schedule(() => {
          if (outcome === 'lost') {
            enterFailed();
            return;
          }

          const { cardsById } = get();
          set({
            cardsById: {
              ...cardsById,
              [firstId]: { ...cardsById[firstId], isFlipped: false },
              [secondId]: { ...cardsById[secondId], isFlipped: false },
            },
            selectedCards: [],
            mismatchedCards: [],
            isBoardLocked: false,
          });
        }, MISMATCH_HOLD_MS);
      };

      return {
        ...INITIAL_STATE,

        startGame: () => {
          cancelPending();
          audioService.playStart();

          const cards = createCards();
          screenTransition(() =>
            set({
              ...INITIAL_STATE,
              gameState: 'ready',
              cardsById: Object.fromEntries(cards.map((card) => [card.id, card])),
              cardOrder: cards.map((card) => card.id),
              // El anillo del reloj aparece lleno cuando empieza la memorización
              timeLeft: GAME_CONFIG.memorizationTime,
            })
          );

          schedule(beginMemorizing, GAME_CONFIG.readyTime * 1000);
        },

        flipCard: (cardId) => {
          const state = get();
          const card = state.cardsById[cardId];

          if (state.gameState !== 'playing' || state.isBoardLocked) return;
          if (!card || card.isFlipped || card.isMatched) return;

          audioService.playFlip();

          const selectedCards = [...state.selectedCards, cardId];
          const isSecondCard = selectedCards.length === 2;

          set({
            cardsById: { ...state.cardsById, [cardId]: { ...card, isFlipped: true } },
            selectedCards,
            isBoardLocked: isSecondCard,
            movesUsed: state.movesUsed + (isSecondCard ? 1 : 0),
          });

          if (isSecondCard) {
            schedule(resolvePair, RESOLVE_DELAY_MS);
          }
        },

        pickPrizeCard: (cardId) => {
          const state = get();
          const card = state.prizeCards.find((prizeCard) => prizeCard.id === cardId);

          if (state.gameState !== 'prize' || state.prizeStage !== 'choosing' || !card) return;

          audioService.playPrizeSelect();
          vibrate(30);
          set({ selectedPrizeId: cardId, prizeStage: 'revealing' });
          armIdleReturn();

          const showResult = (showConfetti: boolean) => {
            set({ prizeStage: 'result', showConfetti });
            // La cuenta de inactividad arranca cuando el jugador ve el resultado
            armIdleReturn();
          };

          if (card.hasPrize) {
            schedule(() => {
              audioService.playPrizeWin();
              vibrate([50, 50, 50]);
              showResult(true);
              schedule(() => set({ showConfetti: false }), CONFETTI_MS);
            }, PRIZE_REVEAL_MS);
          } else {
            schedule(() => {
              set({ prizeStage: 'winner-shown' });
              schedule(() => showResult(false), PRIZE_STEP_MS);
            }, PRIZE_REVEAL_MS + PRIZE_STEP_MS);
          }
        },

        keepAlive: () => {
          const { gameState } = get();
          if (gameState === 'prize' || gameState === 'failed') {
            armIdleReturn();
          }
        },

        resetGame: () => {
          cancelPending();
          screenTransition(() => set(INITIAL_STATE));
        },
      };
    },
    {
      name: 'memo-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============= SELECTORES =============
// Cada uno devuelve un valor primitivo o una referencia estable: un componente solo se vuelve
// a dibujar cuando cambia exactamente lo que lee.

export const useGameState = () => useMemoStore((state) => state.gameState);
export const useCardOrder = () => useMemoStore((state) => state.cardOrder);
export const useIsBoardLocked = () => useMemoStore((state) => state.isBoardLocked);
export const useTimeLeft = () => useMemoStore((state) => state.timeLeft);
export const useMovesUsed = () => useMemoStore((state) => state.movesUsed);
export const useMatchesFound = () => useMemoStore((state) => state.matchesFound);

export const useCardIcon = (cardId: string): CardIconId | undefined =>
  useMemoStore((state) => state.cardsById[cardId]?.icon);

export const useCardFlipped = (cardId: string) =>
  useMemoStore((state) => state.cardsById[cardId]?.isFlipped ?? false);

export const useCardMatched = (cardId: string) =>
  useMemoStore((state) => state.cardsById[cardId]?.isMatched ?? false);

export const useCardMismatched = (cardId: string) =>
  useMemoStore((state) => state.mismatchedCards.includes(cardId));

export const usePrizeCards = () => useMemoStore((state) => state.prizeCards);
export const useSelectedPrizeId = () => useMemoStore((state) => state.selectedPrizeId);
export const usePrizeStage = () => useMemoStore((state) => state.prizeStage);
export const useShowConfetti = () => useMemoStore((state) => state.showConfetti);
