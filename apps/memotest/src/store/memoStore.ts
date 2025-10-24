/**
 * MemoTest Game Store - Optimizado para rendimiento
 * Estado normalizado + selectores granulares + sin immer
 * @module memoStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { memoService, type MemoCard, type PrizeCard } from '@/services/game/memoService';

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

  // UI States
  isProcessing: boolean;
  showConfetti: boolean;
  soundEnabled: boolean;
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

  // Stats
  updateTimeElapsed: (time: number) => void;
  checkGameEnd: (timeRemaining: number) => void;
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
        isProcessing: false,
        showConfetti: false,
        soundEnabled: true,

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

          // Si hay 2 cartas seleccionadas, marcar como procesando
          if (newSelectedCards.length === 2) {
            updates.isProcessing = true;
            updates.stats = {
              ...state.stats,
              movesUsed: state.stats.movesUsed + 1
            };
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
          } else if (validation.hasFailed) {
            set({ gameState: 'failed' });
          }
        },
      }),
      {
        name: 'memo-storage',
        partialize: (state) => ({
          // Solo persistir mejores puntajes y configuración
          stats: {
            ...INITIAL_STATS,
            bestScore: state.stats.bestScore,
          },
          soundEnabled: state.soundEnabled,
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
export const useIsProcessing = () => useMemoStore((state) => state.isProcessing);
export const useSoundEnabled = () => useMemoStore((state) => state.soundEnabled);
export const useShowConfetti = () => useMemoStore((state) => state.showConfetti);

/**
 * Selectores primitivos para el HUD (sin crear objetos nuevos)
 */
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