// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Question,
  GameStore,
  GameState,
} from '@/types';
import { pickNextQuestion } from '@/utils/questionRotation';

/**
 * Versión del progreso persistido (preguntas ya mostradas).
 * Subirla cuando cambie el set de preguntas de un evento a otro: los ids se
 * reutilizan y el historial del evento anterior dejaría de tener sentido.
 */
const PROGRESS_VERSION = 2;

// --- STORE SIMPLIFICADO PARA EL JUEGO ---
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Estados principales del juego
      gameState: 'waiting' as GameState,
      currentQuestion: null,
      lastSpinResultIndex: null,
      lastSpinSegment: null,
      recentSpinSegments: [],
      questions: [],
      askedQuestionIds: [],
      showConfetti: false,

      // Estado para feedback del premio
      prizeFeedback: {
        answeredCorrectly: null,
        explanation: "",
        correctOption: "",
        prizeName: "",
      },

      // --- ACCIONES PRINCIPALES DEL JUEGO ---
      setGameState: (newState: GameState) => set({ gameState: newState }),

      setQuestions: (questionsArray: Question[]) => set((state) => {
        const knownIds = new Set(questionsArray.map((question) => question.id));
        return {
          questions: questionsArray,
          // Ids que ya no existen en el set no aportan nada al historial
          askedQuestionIds: state.askedQuestionIds.filter((id) => knownIds.has(id)),
        };
      }),

      setCurrentQuestion: (question) => set({ currentQuestion: question }),

      drawQuestion: (segment) => set((state) => {
        const draw = pickNextQuestion(segment.questions, state.askedQuestionIds);
        return draw ? { currentQuestion: draw.question, askedQuestionIds: draw.askedIds } : {};
      }),

      setLastSpinResultIndex: (index) => set({ lastSpinResultIndex: index }),

      setLastSpinSegment: (segment) => set({ lastSpinSegment: segment }),

      // Función para actualizar historial de segmentos
      addRecentSpinSegment: (segmentIndex: number) => set((state) => {
        const maxHistoryLength = 3; // Recordar últimos 3 giros
        const newHistory = [...state.recentSpinSegments, segmentIndex];

        // Mantener solo los últimos N giros
        if (newHistory.length > maxHistoryLength) {
          newHistory.shift(); // Remover el más antiguo
        }

        return { recentSpinSegments: newHistory };
      }),

      // Resetear datos de la ronda actual
      resetCurrentGameData: () => set({
        currentQuestion: null,
        lastSpinResultIndex: null,
        lastSpinSegment: null,
        recentSpinSegments: [],
        gameState: 'waiting' as GameState,
      }),

      // Funciones para gestionar el feedback del premio
      setPrizeFeedback: (feedback) => set({ prizeFeedback: feedback }),

      setShowConfetti: (value: boolean) => set({ showConfetti: value }),

      resetPrizeFeedback: () => set({
        prizeFeedback: {
          answeredCorrectly: null,
          explanation: "",
          correctOption: "",
          prizeName: ""
        }
      }),

      // Resetear el juego a estado inicial (el historial de preguntas es del evento, no de la ronda)
      resetCurrentGame: () => {
        set({
          gameState: 'waiting' as GameState,
          currentQuestion: null,
          lastSpinResultIndex: null,
          lastSpinSegment: null,
          recentSpinSegments: [],
          showConfetti: false,
          prizeFeedback: {
            answeredCorrectly: null,
            explanation: "",
            correctOption: "",
            prizeName: ""
          },
        });
      },

      // Mover al siguiente estado del juego
      moveToNext: () => {
        const { gameState } = get();

        // Si estamos en ruleta o pregunta o premio, volver a waiting
        if (gameState === 'roulette' || gameState === 'question' || gameState === 'prize') {
          get().resetCurrentGame();
        } else {
          // Si estamos en waiting, ir a ruleta
          set({ gameState: 'roulette' as GameState });
        }
      },
    }),
    {
      name: 'darsalud-roulette-progress',
      version: PROGRESS_VERSION,
      // Solo el historial de preguntas sobrevive a cerrar la app; el resto es estado de la ronda
      partialize: (state) => ({ askedQuestionIds: state.askedQuestionIds }),
      // Cambio de versión = otro evento: se arranca con el historial vacío
      migrate: () => ({ askedQuestionIds: [] }),
    }
  )
);
