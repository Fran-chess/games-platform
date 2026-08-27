// src/types/index.ts

export interface PrizeFeedback {
  answeredCorrectly: boolean | null;
  explanation: string;
  correctOption: string;
  prizeName: string;
}

export interface AnswerOption {
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  options: AnswerOption[];
  prize?: string;
  explanation?: string;
}

export type GameState = 'waiting' | 'roulette' | 'question' | 'prize';

export interface WheelSegment {
  text: string;
  color: string;
  questions: Question[];
}

export interface GameStore {
  gameState: GameState;
  currentQuestion: Question | null;
  lastSpinResultIndex: number | null;
  lastSpinSegment: WheelSegment | null;
  recentSpinSegments: number[];
  questions: Question[];
  /** Ids de preguntas ya mostradas (cronológico). Sobrevive al cierre de la app. */
  askedQuestionIds: string[];
  prizeFeedback: PrizeFeedback;
  showConfetti: boolean;

  setGameState: (state: GameState) => void;
  setCurrentQuestion: (question: Question | null) => void;
  /** Elige la pregunta a mostrar para el segmento ganador, sin repetir las ya hechas */
  drawQuestion: (segment: WheelSegment) => void;
  setLastSpinResultIndex: (index: number | null) => void;
  setLastSpinSegment: (segment: WheelSegment | null) => void;
  addRecentSpinSegment: (segmentIndex: number) => void;
  resetCurrentGame: () => void;
  resetCurrentGameData: () => void;
  setPrizeFeedback: (feedback: PrizeFeedback) => void;
  resetPrizeFeedback: () => void;
  setShowConfetti: (value: boolean) => void;
  setQuestions: (questions: Question[]) => void;
  moveToNext: () => void;
}

// Interface para props de componentes
export interface RouletteWheelProps {
  questions: Question[];
}