/**
 * MemoTest Game Store
 * Arquitectura profesional con patrón Redux-like
 * @module memoStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============= TYPES & INTERFACES =============

/**
 * Representa una carta del juego
 */
export interface Card {
  id: string;
  value: string;
  icon?: string;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

/**
 * Estados posibles del juego
 */
export type GameState = 'idle' | 'waiting' | 'playing' | 'paused' | 'completed';

/**
 * Estadísticas del juego
 */
export interface GameStats {
  moves: number;
  matches: number;
  timeElapsed: number;
  bestTime: number | null;
  perfectGame: boolean;
}

/**
 * Configuración del juego
 */
export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  cardPairs: number;
  flipBackDelay: number;
  theme: 'medical' | 'default';
}

/**
 * Estado principal del store
 */
export interface MemoState {
  // Estado del juego
  gameState: GameState;
  cards: Card[];
  selectedCards: string[];

  // Estadísticas
  stats: GameStats;

  // Configuración
  config: GameConfig;

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
  startGame: () => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // Mecánica del juego
  flipCard: (cardId: string) => void;
  checkMatch: () => void;

  // Configuración
  setDifficulty: (difficulty: GameConfig['difficulty']) => void;
  toggleSound: () => void;

  // UI
  setShowConfetti: (show: boolean) => void;

  // Stats
  updateTimeElapsed: (time: number) => void;
}

export type MemoStore = MemoState & MemoActions;

// ============= CONSTANTS =============

const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'easy',
  cardPairs: 4,
  flipBackDelay: 1000,
  theme: 'medical'
};

const INITIAL_STATS: GameStats = {
  moves: 0,
  matches: 0,
  timeElapsed: 0,
  bestTime: null,
  perfectGame: true
};

// ============= HELPERS =============

/**
 * Genera las cartas para el juego
 */
const generateCards = (pairs: number, theme: string): Card[] => {
  // Iconos médicos para el tema de enfermería
  const medicalIcons = [
    '💉', '🩺', '💊', '🏥',
    '🚑', '🩹', '🧬', '🔬',
    '🦠', '🧪', '⚕️', '🩻'
  ];

  const defaultIcons = [
    '🎯', '🎨', '🎭', '🎪',
    '🎫', '🎬', '🎮', '🎯'
  ];

  const icons = theme === 'medical' ? medicalIcons : defaultIcons;
  const selectedIcons = icons.slice(0, pairs);

  // Crear pares de cartas
  const cards: Card[] = [];
  selectedIcons.forEach((icon, index) => {
    // Crear dos cartas idénticas
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: `card-${index}-${i}`,
        value: `value-${index}`,
        icon,
        isFlipped: false,
        isMatched: false,
        position: 0
      });
    }
  });

  // Mezclar las cartas usando Fisher-Yates
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Asignar posiciones
  return cards.map((card, index) => ({
    ...card,
    position: index
  }));
};

// ============= STORE =============

export const useMemoStore = create<MemoStore>()(
  devtools(
    immer((set, get) => ({
      // Estado inicial
      gameState: 'idle',
      cards: [],
      selectedCards: [],
      stats: INITIAL_STATS,
      config: DEFAULT_CONFIG,
      isProcessing: false,
      showConfetti: false,
      soundEnabled: true,

      // ============= ACTIONS =============

      initGame: () => {
        set((state) => {
          const cards = generateCards(state.config.cardPairs, state.config.theme);
          state.cards = cards;
          state.gameState = 'waiting';
          state.selectedCards = [];
          state.stats = { ...INITIAL_STATS };
          state.showConfetti = false;
        });
      },

      startGame: () => {
        set((state) => {
          state.gameState = 'playing';
        });
      },

      resetGame: () => {
        set((state) => {
          state.gameState = 'idle';
          state.cards = [];
          state.selectedCards = [];
          state.stats = INITIAL_STATS;
          state.showConfetti = false;
        });
      },

      pauseGame: () => {
        set((state) => {
          if (state.gameState === 'playing') {
            state.gameState = 'paused';
          }
        });
      },

      resumeGame: () => {
        set((state) => {
          if (state.gameState === 'paused') {
            state.gameState = 'playing';
          }
        });
      },

      flipCard: (cardId: string) => {
        const state = get();

        // No permitir voltear si:
        // - El juego no está activo
        // - Ya hay 2 cartas seleccionadas
        // - Se está procesando una jugada
        // - La carta ya está emparejada
        if (
          state.gameState !== 'playing' ||
          state.selectedCards.length >= 2 ||
          state.isProcessing ||
          state.cards.find(c => c.id === cardId)?.isMatched
        ) {
          return;
        }

        set((state) => {
          const card = state.cards.find(c => c.id === cardId);
          if (!card || card.isFlipped) return;

          // Voltear la carta
          card.isFlipped = true;
          state.selectedCards.push(cardId);

          // Si es la primera carta, solo incrementar movimientos
          if (state.selectedCards.length === 1) {
            state.stats.moves++;
          }

          // Si hay 2 cartas, verificar match
          if (state.selectedCards.length === 2) {
            state.isProcessing = true;
            // La verificación se hace en checkMatch
            setTimeout(() => get().checkMatch(), 600);
          }
        });
      },

      checkMatch: () => {
        set((state) => {
          const [firstId, secondId] = state.selectedCards;
          const firstCard = state.cards.find(c => c.id === firstId);
          const secondCard = state.cards.find(c => c.id === secondId);

          if (!firstCard || !secondCard) return;

          if (firstCard.value === secondCard.value) {
            // ¡Match encontrado!
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            state.stats.matches++;

            // Verificar si el juego terminó
            const allMatched = state.cards.every(c => c.isMatched);
            if (allMatched) {
              state.gameState = 'completed';
              state.showConfetti = true;

              // Actualizar mejor tiempo
              if (!state.stats.bestTime || state.stats.timeElapsed < state.stats.bestTime) {
                state.stats.bestTime = state.stats.timeElapsed;
              }
            }
          } else {
            // No hay match, voltear las cartas después del delay
            state.stats.perfectGame = false;
            setTimeout(() => {
              set((state) => {
                state.cards.forEach(card => {
                  if (state.selectedCards.includes(card.id)) {
                    card.isFlipped = false;
                  }
                });
                state.selectedCards = [];
                state.isProcessing = false;
              });
            }, state.config.flipBackDelay);
            return; // Salir temprano para no resetear isProcessing
          }

          state.selectedCards = [];
          state.isProcessing = false;
        });
      },

      setDifficulty: (difficulty) => {
        set((state) => {
          state.config.difficulty = difficulty;
          state.config.cardPairs =
            difficulty === 'easy' ? 4 :
            difficulty === 'medium' ? 6 :
            8;
        });
      },

      toggleSound: () => {
        set((state) => {
          state.soundEnabled = !state.soundEnabled;
        });
      },

      setShowConfetti: (show) => {
        set((state) => {
          state.showConfetti = show;
        });
      },

      updateTimeElapsed: (time) => {
        set((state) => {
          state.stats.timeElapsed = time;
        });
      }
    })),
    {
      name: 'memo-store',
    }
  )
);