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

  // Refs para evitar requests múltiples
  const loadingQuestionsRef = useRef(false);
  
  // Zustand (GameStore). Las acciones son referencias estables: se usan directo en los efectos
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const lastSpinSegment = useGameStore((state) => state.lastSpinSegment);
  const drawQuestion = useGameStore((state) => state.drawQuestion);
  const questions = useGameStore((state) => state.questions);
  const setQuestions = useGameStore((state) => state.setQuestions);
  const currentQuestion = useGameStore((state) => state.currentQuestion);

  // Cargar preguntas al inicio desde el archivo JSON
  useEffect(() => {
    if (!loadingQuestionsRef.current && (!questions || questions.length === 0)) {
      const loadQuestions = async () => {
        try {
          loadingQuestionsRef.current = true;
          // Importar directamente el archivo JSON
          const questionsData = await import('@/data/questions.json');
          setQuestions(questionsData.default || []);
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
  }, [questions, setQuestions]);

  // Al girar la ruleta, mostrar una pregunta del segmento ganador sin repetir las ya hechas
  useEffect(() => {
    if (!lastSpinSegment || lastSpinSegment.questions.length === 0) return;

    // Delay para que se vea el resplandor del segmento ganador antes de la transición.
    // La pregunta se elige recién acá: si el giro se cancela antes, no se gasta del pool.
    const timer = setTimeout(() => {
      drawQuestion(lastSpinSegment);
      setGameState("question");
    }, 800);

    return () => clearTimeout(timer);
  }, [lastSpinSegment, drawQuestion, setGameState]);

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
  
  // Vista de la ruleta: el giro se dispara desde el botón central del propio componente
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
          <RouletteWheel questions={questions} />
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