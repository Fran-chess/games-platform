"use client";

import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import RouletteWheel from "@/components/game/RouletteWheel";
import QuestionDisplay from "@/components/game/QuestionDisplay";
import PrizeModal from "@/components/game/PrizeModal";
import RouletteLayout from "@/components/game/RouletteLayout";
import WaitingScreen from "@/components/tv/screens/WaitingScreen";

export default function GamePage() {
  // Estado local
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Refs para evitar requests múltiples
  const loadingQuestionsRef = useRef(false);
  
  // Zustand (GameStore)
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const lastSpinResultIndex = useGameStore((state) => state.lastSpinResultIndex);
  const lastSpinSegment = useGameStore((state) => state.lastSpinSegment);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  
  // Refs para funciones
  const setQuestionsRef = useRef(setQuestions);
  const setGameStateRef = useRef(setGameState);
  const setCurrentQuestionRef = useRef(setCurrentQuestion);
  const questionsRef = useRef(questions);
  
  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    setQuestionsRef.current = setQuestions;
    setGameStateRef.current = setGameState;
    setCurrentQuestionRef.current = setCurrentQuestion;
    questionsRef.current = questions;
  }, [setQuestions, setGameState, setCurrentQuestion, questions]);
  
  // Cargar preguntas al inicio desde el archivo JSON
  useEffect(() => {
    if (!loadingQuestionsRef.current && (!questions || questions.length === 0)) {
      const loadQuestions = async () => {
        try {
          loadingQuestionsRef.current = true;
          // Importar directamente el archivo JSON
          const questionsData = await import('@/data/questions.json');
          setQuestionsRef.current(questionsData.default || []);
        } finally {
          setIsLoading(false);
          setTimeout(() => {
            loadingQuestionsRef.current = false;
          }, 500);
        }
      };

      loadQuestions();
    } else {
      setIsLoading(false);
    }
  }, [questions]);
  
  // Al girar la ruleta, mostrar una pregunta aleatoria del segmento ganador
  useEffect(() => {
    if (lastSpinSegment && lastSpinSegment.questions && lastSpinSegment.questions.length > 0) {
      // Seleccionar una pregunta aleatoria del segmento ganador
      const segmentQuestions = lastSpinSegment.questions;
      const randomIndex = Math.floor(Math.random() * segmentQuestions.length);
      const questionToSet = segmentQuestions[randomIndex];

      // Añadir un delay para una transición más suave
      setTimeout(() => {
        setCurrentQuestionRef.current(questionToSet);
        setGameStateRef.current("question");
      }, 800); // 800ms de delay para transición suave
    }
  }, [lastSpinSegment]);
  
  // Referencia al componente de la ruleta
  const rouletteRef = useRef<{ spin: () => void }>(null);
  
  const handleSpin = () => {
    if (rouletteRef.current && !isSpinning) {
      rouletteRef.current.spin();
    }
  };
  
  // Función para manejar el cambio de estado del spinning
  const handleSpinStateChange = (spinning: boolean) => {
    setIsSpinning(spinning);
  };
  
  // Loading
  if (isLoading) {
    return (
      <RouletteLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-white text-xl"
        >
          Preparando el juego...
        </motion.div>
      </RouletteLayout>
    );
  }
  
  // Pantalla de espera - WaitingScreen
  if (gameState === 'waiting') {
    return <WaitingScreen />;
  }
  
  // Vista de la ruleta - Sin botón inferior, solo el central
  if (gameState === "roulette") {
    return (
      <RouletteLayout>
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <RouletteWheel
            questions={questions}
            ref={rouletteRef}
            onSpinStateChange={handleSpinStateChange}
            onCenterButtonClick={handleSpin}
            isSpinning={isSpinning}
          />
        </motion.div>
      </RouletteLayout>
    );
  }

  // Vista de pregunta con transición suave
  if (gameState === "question" && currentQuestion) {
    return (
      <RouletteLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
          className="w-full h-full"
        >
          <QuestionDisplay question={currentQuestion} />
        </motion.div>
      </RouletteLayout>
    );
  }
  
  // Vista de premio
  if (gameState === "prize") {
    return (
      <RouletteLayout>
        <PrizeModal />
      </RouletteLayout>
    );
  }
  
  // Estado por defecto
  return (
    <RouletteLayout>
      <div className="text-white text-center">
        <p>Estado del juego no reconocido: {gameState}</p>
      </div>
    </RouletteLayout>
  );
}