/**
 * MemoTest Game Store - Optimizado para rendimiento
 * Estado normalizado + selectores granulares + sin immer
 * @module memoStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { memoService, type MemoCard, type PrizeCard } from '@/services/game/memoService';
import { clockService } from '@/services/game/clockService';

// ============= TYPES & INTERFACES =============

/**
 * Estados posibles del juego
 */
export type GameState =
  | 'waiting'      // Pantalla de espera
  | 'shuffling'    // Mezclando cartas (animación)
  | 'memorizing'   // Mostrando cartas para memorizar
  | 'playing'      // Jugando activamente
  | 'success'      // Encontró los 2 pares requeridos
  | 'failed'       // Falló (sin movimientos o sin tiempo)
  | 'prize';       // Fase de selección de premio

/**
 * Estadísticas del juego
 */
export interface GameStats {
  movesUsed: number;
  matchesFound: number;
  timeElapsed: number;
  score: number;
  bestScore: number | null;
}

/**
 * Estado normalizado: cartas por ID + orden
 */
export interface MemoState {
  // Estado del juego
  gameState: GameState;
  cardsById: Record<string, MemoCard>;
  cardOrder: string[];
  selectedCards: string[];
  prizeCards: PrizeCard[];
  shakeCards: Set<string>; // IDs de cartas en shake animation

  // Estadísticas
  stats: GameStats;

  // Timer centralizado
  timeLeft: number;

  // UI States
  isProcessing: boolean;
  showConfetti: boolean;
  soundEnabled: boolean;

  // Callbacks de audio (inyectados desde componentes)
  audioCallbacks: {
    onMatch?: () => void;
    onError?: () => void;
    onVictory?: () => void;
    onDefeat?: () => void;
    onTick?: () => void;
    onPhaseStart?: () => void;
  };

  // Phase sub-state (para MemorizationPhase state machine)
  memorizationPhase: 'shuffling' | 'memorizing' | 'hiding' | null;

  // Timers internos del store (para limpiar correctamente)
  phaseTransitionTimers: Set<NodeJS.Timeout>;
}

/**
 * Acciones disponibles
 */
export interface MemoActions {
  // Gestión del juego
  initGame: () => void;
  startShuffling: () => void;
  startMemorizing: () => void;
  startPlaying: () => void;
  resetGame: () => void;
  restartGame: () => void;

  // Mecánica del juego
  flipCard: (cardId: string) => void;
  handleMatchCheck: (firstCardId: string, secondCardId: string) => void;
  handleNoMatch: () => void;
  clearShake: (cardId: string) => void;

  // Fase de premio
  initializePrizePhase: () => void;
  selectPrizeCard: (cardId: string) => void;

  // UI
  setShowConfetti: (show: boolean) => void;
  toggleSound: () => void;

  // Stats & Timer
  updateTimeElapsed: (time: number) => void;
  setTimeLeft: (time: number) => void;
  checkGameEnd: (timeRemaining: number) => void;

  // Clock control
  startClock: (seconds: number) => void;
  stopClock: () => void;

  // Audio callbacks (inyección)
  setAudioCallbacks: (callbacks: MemoState['audioCallbacks']) => void;

  // State machine actions
  clearPhaseTimers: () => void;
  transitionToMemorizing: () => void;
  transitionToHiding: () => void;
  transitionToPlaying: () => void;
  transitionToPrize: () => void;
}

export type MemoStore = MemoState & MemoActions;

// ============= CONSTANTS =============

const INITIAL_STATS: GameStats = {
  movesUsed: 0,
  matchesFound: 0,
  timeElapsed: 0,
  score: 0,
  bestScore: null,
};

// ============= HELPERS =============

/**
 * Convierte array de cartas a estado normalizado
 */
function normalizeCards(cards: MemoCard[]): { cardsById: Record<string, MemoCard>; cardOrder: string[] } {
  const cardsById: Record<string, MemoCard> = {};
  const cardOrder: string[] = [];

  cards.forEach(card => {
    cardsById[card.id] = card;
    cardOrder.push(card.id);
  });

  return { cardsById, cardOrder };
}

// ============= STORE =============

export const useMemoStore = create<MemoStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        gameState: 'waiting' as GameState,
        cardsById: {},
        cardOrder: [],
        selectedCards: [],
        prizeCards: [],
        shakeCards: new Set<string>(),
        stats: INITIAL_STATS,
        timeLeft: 0,
        isProcessing: false,
        showConfetti: false,
        soundEnabled: true,
        audioCallbacks: {},
        memorizationPhase: null,
        phaseTransitionTimers: new Set<NodeJS.Timeout>(),

        // ============= ACTIONS =============

        initGame: () => {
          const cards = memoService.generateCards('medical');
          const { cardsById, cardOrder } = normalizeCards(cards);
          const currentBest = get().stats.bestScore;

          set({
            cardsById,
            cardOrder,
            gameState: 'waiting',
            selectedCards: [],
            prizeCards: [],
            shakeCards: new Set(),
            stats: { ...INITIAL_STATS, bestScore: currentBest },
            showConfetti: false,
            isProcessing: false,
          });
        },

        startShuffling: () => {
          const cards = memoService.generateCards('medical');
          const { cardsById, cardOrder } = normalizeCards(cards);

          set({
            gameState: 'shuffling',
            cardsById,
            cardOrder,
          });
        },

        startMemorizing: () => {
          const state = get();
          const newCardsById = { ...state.cardsById };

          // Voltear todas las cartas
          state.cardOrder.forEach(id => {
            newCardsById[id] = { ...newCardsById[id], isFlipped: true };
          });

          set({
            gameState: 'memorizing',
            cardsById: newCardsById,
          });
        },

        startPlaying: () => {
          const state = get();
          const newCardsById = { ...state.cardsById };

          // Ocultar todas las cartas
          state.cardOrder.forEach(id => {
            newCardsById[id] = { ...newCardsById[id], isFlipped: false };
          });

          set({
            gameState: 'playing',
            cardsById: newCardsById,
          });
        },

        resetGame: () => {
          const currentBest = get().stats.bestScore;

          set({
            gameState: 'waiting',
            cardsById: {},
            cardOrder: [],
            selectedCards: [],
            prizeCards: [],
            shakeCards: new Set(),
            stats: { ...INITIAL_STATS, bestScore: currentBest },
            showConfetti: false,
            isProcessing: false,
          });
        },

        restartGame: () => {
          const cards = memoService.generateCards('medical');
          const { cardsById, cardOrder } = normalizeCards(cards);
          const currentBest = get().stats.bestScore;

          set({
            stats: { ...INITIAL_STATS, bestScore: currentBest },
            selectedCards: [],
            prizeCards: [],
            shakeCards: new Set(),
            showConfetti: false,
            isProcessing: false,
            gameState: 'shuffling',
            cardsById,
            cardOrder,
          });
        },

        flipCard: (cardId: string) => {
          const state = get();

          // Validaciones
          if (
            state.gameState !== 'playing' ||
            state.selectedCards.length >= 2 ||
            state.isProcessing
          ) {
            return;
          }

          const card = state.cardsById[cardId];
          if (!card || card.isFlipped || card.isMatched) {
            return;
          }

          const newSelectedCards = [...state.selectedCards, cardId];
          const newCardsById = {
            ...state.cardsById,
            [cardId]: { ...card, isFlipped: true }
          };

          const updates: Partial<MemoState> = {
            cardsById: newCardsById,
            selectedCards: newSelectedCards,
          };

          // Si hay 2 cartas seleccionadas, procesar match automáticamente
          if (newSelectedCards.length === 2) {
            updates.isProcessing = true;
            const newMovesUsed = state.stats.movesUsed + 1;
            updates.stats = {
              ...state.stats,
              movesUsed: newMovesUsed
            };

            set(updates);

            // Procesar match check después de 600ms (animación de flip)
            setTimeout(() => {
              const currentState = get();
              const [firstId, secondId] = newSelectedCards;
              const card1 = currentState.cardsById[firstId];
              const card2 = currentState.cardsById[secondId];

              if (!card1 || !card2) return;

              const isMatch = memoService.checkMatch(card1, card2);

              if (isMatch) {
                currentState.audioCallbacks.onMatch?.();
                get().handleMatchCheck(firstId, secondId);

                // Check victoria después de actualizar match
                setTimeout(() => {
                  const config = memoService.getConfig();
                  const latestState = get();
                  if (latestState.stats.matchesFound >= config.requiredPairs) {
                    get().checkGameEnd(latestState.timeLeft);
                  }
                }, 100);
              } else {
                currentState.audioCallbacks.onError?.();
                get().handleNoMatch();

                // Check derrota después de cada error (incluye derrota anticipada)
                setTimeout(() => {
                  get().checkGameEnd(get().timeLeft);
                }, 1000);
              }
            }, 600);

            return;
          }

          set(updates);
        },

        handleMatchCheck: (firstCardId: string, secondCardId: string) => {
          const state = get();
          const card1 = state.cardsById[firstCardId];
          const card2 = state.cardsById[secondCardId];

          if (!card1 || !card2) return;

          set({
            cardsById: {
              ...state.cardsById,
              [firstCardId]: { ...card1, isMatched: true },
              [secondCardId]: { ...card2, isMatched: true },
            },
            stats: {
              ...state.stats,
              matchesFound: state.stats.matchesFound + 1,
            },
            selectedCards: [],
            isProcessing: false,
          });
        },

        handleNoMatch: () => {
          const state = get();
          const newCardsById = { ...state.cardsById };
          const newShakeCards = new Set(state.selectedCards);

          // Voltear las cartas de vuelta
          state.selectedCards.forEach(id => {
            const card = newCardsById[id];
            if (card) {
              newCardsById[id] = { ...card, isFlipped: false };
            }
          });

          set({
            cardsById: newCardsById,
            selectedCards: [],
            isProcessing: false,
            shakeCards: newShakeCards,
          });
        },

        clearShake: (cardId: string) => {
          const state = get();
          const newShakeCards = new Set(state.shakeCards);
          newShakeCards.delete(cardId);
          set({ shakeCards: newShakeCards });
        },

        initializePrizePhase: () => {
          set({
            gameState: 'prize',
            prizeCards: memoService.generatePrizeCards(),
            showConfetti: true,
          });
        },

        selectPrizeCard: (cardId: string) => {
          const state = get();
          const cardIndex = state.prizeCards.findIndex(c => c.id === cardId);
          if (cardIndex === -1) return;

          const card = state.prizeCards[cardIndex];
          const newPrizeCards = [...state.prizeCards];
          newPrizeCards[cardIndex] = { ...card, isRevealed: true };

          set({
            prizeCards: newPrizeCards,
            showConfetti: card.hasPrize,
          });
        },

        setShowConfetti: (show) => {
          set({ showConfetti: show });
        },

        toggleSound: () => {
          const state = get();
          set({ soundEnabled: !state.soundEnabled });
        },

        updateTimeElapsed: (time) => {
          const state = get();
          set({
            stats: { ...state.stats, timeElapsed: time }
          });
        },

        checkGameEnd: (timeRemaining: number) => {
          const state = get();
          const config = memoService.getConfig();

          const validation = memoService.validateGameState(
            state.stats.matchesFound,
            state.stats.movesUsed,
            timeRemaining
          );

          if (validation.hasWon) {
            clockService.stop();
            const score = memoService.calculateScore(
              state.stats.movesUsed,
              state.stats.timeElapsed
            );

            set({
              gameState: 'success',
              stats: {
                ...state.stats,
                score,
                bestScore: !state.stats.bestScore || score > state.stats.bestScore
                  ? score
                  : state.stats.bestScore
              }
            });

            // Trigger audio callback
            state.audioCallbacks.onVictory?.();
          } else if (validation.hasFailed) {
            clockService.stop();
            set({ gameState: 'failed' });

            // Trigger audio callback
            state.audioCallbacks.onDefeat?.();
          }
        },

        // Clock control
        startClock: (seconds: number) => {
          clockService.start(seconds, (timeLeft) => {
            const state = get();
            set({ timeLeft });

            // Tick audio en últimos 10 segundos
            if (timeLeft <= 10 && timeLeft > 0) {
              state.audioCallbacks.onTick?.();
            }

            // Check cuando llega a 0
            if (timeLeft === 0) {
              // Si estamos en memorizing, transicionar a hiding
              if (state.memorizationPhase === 'memorizing') {
                get().transitionToHiding();
              } else {
                // Si estamos en playing, check game end
                get().checkGameEnd(0);
              }
            }
          });
        },

        stopClock: () => {
          clockService.stop();
        },

        setTimeLeft: (time: number) => {
          set({ timeLeft: time });
        },

        setAudioCallbacks: (callbacks: MemoState['audioCallbacks']) => {
          set({ audioCallbacks: callbacks });
        },

        // ============= STATE MACHINE =============

        clearPhaseTimers: () => {
          const state = get();
          state.phaseTransitionTimers.forEach(timer => clearTimeout(timer));
          set({ phaseTransitionTimers: new Set() });
        },

        transitionToMemorizing: () => {
          get().clearPhaseTimers();
          const config = memoService.getConfig();

          // Transición shuffling → memorizing después de shuffleAnimationTime
          const timer = setTimeout(() => {
            get().startMemorizing();
            get().startClock(config.memorizationTime);
            set({ memorizationPhase: 'memorizing' });

            // Transición automática a hiding cuando timeLeft === 0
            // (manejado por el clock callback)
          }, config.shuffleAnimationTime * 1000);

          const timers = get().phaseTransitionTimers;
          timers.add(timer);
          set({ memorizationPhase: 'shuffling', phaseTransitionTimers: timers });
        },

        transitionToHiding: () => {
          get().clearPhaseTimers();
          get().stopClock();

          // Transición directa: memorizing → playing (sin fase hiding intermedia)
          get().transitionToPlaying();
        },

        transitionToPlaying: () => {
          get().clearPhaseTimers();
          get().startPlaying();
          set({ memorizationPhase: null });
        },

        transitionToPrize: () => {
          get().clearPhaseTimers();

          // Transición success → prize después de 1.5s
          const timer = setTimeout(() => {
            get().initializePrizePhase();
          }, 1500);

          const timers = get().phaseTransitionTimers;
          timers.add(timer);
          set({ phaseTransitionTimers: timers });
        },
      }),
      {
        name: 'memo-storage',
        partialize: (state) => ({
          // Solo persistir mejores puntajes y configuración (no timeLeft, no selectedCards, no isProcessing)
          stats: {
            ...INITIAL_STATS,
            bestScore: state.stats.bestScore,
          },
          soundEnabled: state.soundEnabled,
        }),
        // Throttle: limitar writes a localStorage a 1 cada 2 segundos
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          ...persistedState,
        }),
      }
    ),
    {
      name: 'memo-store',
      enabled: process.env.NODE_ENV === 'development', // Solo devtools en dev
    }
  )
);

// ============= SELECTORES GRANULARES =============

/**
 * Selectores base
 */
export const useGameState = () => useMemoStore((state) => state.gameState);
export const useMemorizationPhase = () => useMemoStore((state) => state.memorizationPhase);
export const useIsProcessing = () => useMemoStore((state) => state.isProcessing);
export const useSoundEnabled = () => useMemoStore((state) => state.soundEnabled);
export const useShowConfetti = () => useMemoStore((state) => state.showConfetti);

/**
 * Selectores primitivos para el HUD (sin crear objetos nuevos)
 */
export const useTimeLeft = () => useMemoStore((state) => state.timeLeft);
export const useMovesUsed = () => useMemoStore((state) => state.stats.movesUsed);
export const useMatchesFound = () => useMemoStore((state) => state.stats.matchesFound);

/**
 * Selector para obtener array de cartas (solo cuando sea necesario)
 */
export const useCardsList = () => useMemoStore((state) =>
  state.cardOrder.map(id => state.cardsById[id])
);

/**
 * Selectores granulares primitivos - Sin crear objetos nuevos
 */
export const useCardFlipped = (cardId: string) =>
  useMemoStore((state) => state.cardsById[cardId]?.isFlipped ?? false);

export const useCardMatched = (cardId: string) =>
  useMemoStore((state) => state.cardsById[cardId]?.isMatched ?? false);

export const useCardIcon = (cardId: string) =>
  useMemoStore((state) => state.cardsById[cardId]?.icon ?? '');

/**
 * Selector para orden de cartas
 */
export const useCardOrder = () => useMemoStore((state) => state.cardOrder);

/**
 * Selector para shake state de una carta
 */
export const useCardShake = (cardId: string) => useMemoStore((state) => state.shakeCards.has(cardId));

/**
 * Selector para prize cards
 */
export const usePrizeCards = () => useMemoStore((state) => state.prizeCards);

/**
 * Stats completos (solo para pantallas finales)
 */
export const useStats = () => useMemoStore((state) => state.stats);