/**
 * MemoTest Game Store - Refactorizado
 * Arquitectura optimizada con separación de responsabilidades
 * @module memoStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
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
 * Estado principal del store
 */
export interface MemoState {
  // Estado del juego
  gameState: GameState;
  cards: MemoCard[];
  selectedCards: string[];
  prizeCards: PrizeCard[];

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
  handleMatchCheck: (firstCard: MemoCard, secondCard: MemoCard) => void;
  handleNoMatch: () => void;

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

// ============= STORE =============

export const useMemoStore = create<MemoStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Estado inicial
        gameState: 'waiting' as GameState,
        cards: [],
        selectedCards: [],
        prizeCards: [],
        stats: INITIAL_STATS,
        isProcessing: false,
        showConfetti: false,
        soundEnabled: true,

        // ============= ACTIONS =============

        initGame: () => {
          set((state) => {
            state.cards = memoService.generateCards('medical');
            state.gameState = 'waiting';
            state.selectedCards = [];
            state.prizeCards = [];
            state.stats = { ...INITIAL_STATS, bestScore: state.stats.bestScore };
            state.showConfetti = false;
            state.isProcessing = false;
          });
        },

        startShuffling: () => {
          set((state) => {
            state.gameState = 'shuffling';
            // Re-generar y mezclar cards
            state.cards = memoService.generateCards('medical');
          });
        },

        startMemorizing: () => {
          set((state) => {
            state.gameState = 'memorizing';
            // Voltear todas las cartas para memorización
            state.cards.forEach(card => {
              card.isFlipped = true;
            });
          });
        },

        startPlaying: () => {
          set((state) => {
            state.gameState = 'playing';
            // Ocultar todas las cartas
            state.cards.forEach(card => {
              card.isFlipped = false;
            });
          });
        },

        resetGame: () => {
          set((state) => {
            state.gameState = 'waiting';
            state.cards = [];
            state.selectedCards = [];
            state.prizeCards = [];
            state.stats = { ...INITIAL_STATS, bestScore: state.stats.bestScore };
            state.showConfetti = false;
            state.isProcessing = false;
          });
        },

        restartGame: () => {
          set((state) => {
            // Resetear stats y estado sin pasar por 'waiting'
            state.stats = { ...INITIAL_STATS, bestScore: state.stats.bestScore };
            state.selectedCards = [];
            state.prizeCards = [];
            state.showConfetti = false;
            state.isProcessing = false;

            // Ir directamente a 'shuffling' con nuevas cartas
            state.gameState = 'shuffling';
            state.cards = memoService.generateCards('medical');
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

          const card = state.cards.find(c => c.id === cardId);
          if (!card || card.isFlipped || card.isMatched) {
            return;
          }

          set((state) => {
            const card = state.cards.find(c => c.id === cardId);
            if (!card) return;

            // Voltear la carta
            card.isFlipped = true;
            state.selectedCards.push(cardId);

            // Si hay 2 cartas seleccionadas, marcar como procesando
            if (state.selectedCards.length === 2) {
              state.isProcessing = true;
              // Incrementar movimientos
              state.stats.movesUsed++;
            }
          });
        },

        handleMatchCheck: (firstCard: MemoCard, secondCard: MemoCard) => {
          set((state) => {
            const card1 = state.cards.find(c => c.id === firstCard.id);
            const card2 = state.cards.find(c => c.id === secondCard.id);

            if (!card1 || !card2) return;

            // Marcar como emparejadas
            card1.isMatched = true;
            card2.isMatched = true;
            state.stats.matchesFound++;

            // Resetear selección
            state.selectedCards = [];
            state.isProcessing = false;
          });
        },

        handleNoMatch: () => {
          set((state) => {
            // Voltear las cartas de vuelta
            state.cards.forEach(card => {
              if (state.selectedCards.includes(card.id)) {
                card.isFlipped = false;
              }
            });

            state.selectedCards = [];
            state.isProcessing = false;
          });
        },

        initializePrizePhase: () => {
          set((state) => {
            state.gameState = 'prize';
            state.prizeCards = memoService.generatePrizeCards();
            state.showConfetti = true;
          });
        },

        selectPrizeCard: (cardId: string) => {
          set((state) => {
            const card = state.prizeCards.find(c => c.id === cardId);
            if (!card) return;

            card.isRevealed = true;

            // Si ganó premio, mostrar confetti masivo
            if (card.hasPrize) {
              state.showConfetti = true;
            }
          });
        },

        setShowConfetti: (show) => {
          set((state) => {
            state.showConfetti = show;
          });
        },

        toggleSound: () => {
          set((state) => {
            state.soundEnabled = !state.soundEnabled;
          });
        },

        updateTimeElapsed: (time) => {
          set((state) => {
            state.stats.timeElapsed = time;
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

          set((draft) => {
            if (validation.hasWon) {
              // Victoria - pasar a fase de premio
              draft.gameState = 'success';

              // Calcular puntaje
              const score = memoService.calculateScore(
                draft.stats.movesUsed,
                draft.stats.timeElapsed
              );
              draft.stats.score = score;

              // Actualizar mejor puntaje
              if (!draft.stats.bestScore || score > draft.stats.bestScore) {
                draft.stats.bestScore = score;
              }
            } else if (validation.hasFailed) {
              // Derrota
              draft.gameState = 'failed';
            }
          });
        },
      })),
      {
        name: 'memo-storage',
        partialize: (state) => ({
          stats: {
            ...state.stats,
            movesUsed: 0,
            matchesFound: 0,
            timeElapsed: 0,
            score: 0,
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

// ============= SELECTORS =============

export const useGameState = () => useMemoStore((state) => state.gameState);
export const useCards = () => useMemoStore((state) => state.cards);
export const useStats = () => useMemoStore((state) => state.stats);
export const useIsProcessing = () => useMemoStore((state) => state.isProcessing);
export const usePrizeCards = () => useMemoStore((state) => state.prizeCards);
export const useShowConfetti = () => useMemoStore((state) => state.showConfetti);
export const useSoundEnabled = () => useMemoStore((state) => state.soundEnabled);