/**
 * Componente de Visualización de Preguntas
 * Versión refactorizada y modularizada
 */

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import TimerCircle from "@/components/ui/TimerCircle";
import { useTimer } from "@/hooks/useTimer";
import { useQuestionLogic } from "@/hooks/useQuestionLogic";
import { audioService, SoundType } from "@/services/audio/audioService";
import type { Question, AnswerOption } from "@/types";

/**
 * Props del componente
 */
interface QuestionDisplayProps {
  question: Question;
  onAnswered?: (result: {
    correct: boolean;
    option: AnswerOption | null;
    timeUp?: boolean;
  }) => void;
}

/**
 * Mapeo de índices a letras para las opciones
 */
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

/**
 * Componente QuestionDisplay
 * Muestra una pregunta con opciones y temporizador
 *
 * @component
 * @example
 * ```tsx
 * <QuestionDisplay
 *   question={currentQuestion}
 *   onAnswered={(result) => console.log(result)}
 * />
 * ```
 */
export default function QuestionDisplay({
  question,
  onAnswered,
}: QuestionDisplayProps) {
  // Timer con hook personalizado
  const timer = useTimer({
    initialSeconds: 30,
    onTimeUp: () => handleTimeUp(),
    urgentThreshold: 5,
    autoStart: true,
  });

  // Lógica de preguntas con hook personalizado
  const {
    selectedAnswer,
    isAnswered,
    answerState,
    handleAnswer: processAnswer,
    handleTimeUp: processTimeUp,
    getOptionStyle,
  } = useQuestionLogic({
    question,
    onAnswered,
  });

  // Manejadores con efectos de sonido
  const handleTimeUp = async () => {
    audioService.playSound(SoundType.TIMEOUT);
    await processTimeUp();
  };

  const handleAnswer = async (option: AnswerOption) => {
    audioService.playSound(SoundType.SELECT);
    await processAnswer(option);

    // Reproducir sonido según resultado
    setTimeout(() => {
      if (option.correct) {
        audioService.playVictorySound();
      } else {
        audioService.playDefeatSound();
      }
    }, 400);
  };

  // Efecto de sonido para contador urgente
  useEffect(() => {
    if (timer.isUrgent && timer.seconds > 0 && !isAnswered) {
      audioService.playSound(SoundType.COUNTDOWN);
    }
  }, [timer.seconds, timer.isUrgent, isAnswered]);

  // Resume audio context al montar
  useEffect(() => {
    audioService.resumeContext();
  }, []);

  /**
   * Obtiene el estilo mejorado del botón según el estado
   */
  const getEnhancedOptionStyle = (option: AnswerOption): string => {
    const baseStyle = getOptionStyle(option);

    if (!isAnswered) {
      return `${baseStyle} bg-slate-800/90 hover:bg-slate-700/90
              border-slate-600 hover:border-blue-500
              focus:ring-4 focus:ring-blue-500/50 focus:outline-none`;
    }

    if (answerState === "revealed") {
      if (option.correct) {
        return "bg-green-600/90 border-green-400";
      }
      if (selectedAnswer === option && !option.correct) {
        return "bg-red-600/90 border-red-400";
      }
      return `${baseStyle} opacity-60`;
    }

    return baseStyle;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center p-4 relative"
    >
      {/* Timer - Reubicado arriba a la derecha, más pequeño */}
      <div
        className="absolute top-4 right-4 z-10 scale-75 sm:scale-90"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Tiempo restante: ${timer.seconds} segundos`}
      >
        <TimerCircle
          seconds={timer.seconds}
          initialSeconds={30}
          isUrgent={timer.isUrgent}
        />
      </div>

      <div className="w-full max-w-5xl">
        {/* Card con glassmorphism para mejor legibilidad */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">

          {/* Categoría y Pregunta - Alineado a la izquierda */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            {/* Categoría - Menos prominente */}
            <p className="text-yellow-400/80 font-medium text-sm sm:text-base lg:text-lg mb-3 text-left">
              {question.category}
            </p>
            {/* Pregunta - Más prominente */}
            <h2 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-left leading-tight">
              {question.text}
            </h2>
          </motion.div>

          {/* Opciones de Respuesta */}
          <div className="grid gap-3 grid-cols-1 sm:gap-4 lg:grid-cols-2 lg:gap-4">
            {question.options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <button
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  aria-label={`Opción ${OPTION_LABELS[index]}: ${option.text}`}
                  className={`
                    w-full font-medium text-white
                    rounded-xl transition-all duration-500 transform
                    shadow-lg border-2
                    min-h-[64px] p-4 sm:p-5 lg:p-6
                    text-base sm:text-lg lg:text-xl
                    ${getEnhancedOptionStyle(option)}
                    ${!isAnswered && "hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl"}
                    ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}
                    flex items-center gap-3 text-left
                  `}
                >
                  {/* Badge con letra A/B/C/D */}
                  <span className={`
                    flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11
                    rounded-full flex items-center justify-center
                    font-bold text-white text-sm sm:text-base
                    transition-colors duration-300
                    ${
                      answerState === "revealed" && option.correct
                        ? "bg-green-500"
                        : answerState === "revealed" && selectedAnswer === option && !option.correct
                        ? "bg-red-500"
                        : "bg-blue-600"
                    }
                  `}>
                    {/* Icono de resultado o letra */}
                    {answerState === "revealed" && option.correct ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-lg"
                      >
                        ✓
                      </motion.span>
                    ) : answerState === "revealed" && selectedAnswer === option && !option.correct ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-lg"
                      >
                        ✗
                      </motion.span>
                    ) : (
                      OPTION_LABELS[index]
                    )}
                  </span>

                  {/* Texto de la opción */}
                  <span className="flex-1">
                    {option.text}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Mensaje de Feedback */}
          {answerState === "revealed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 text-center"
            >
              {selectedAnswer?.correct ? (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-green-400 text-xl sm:text-2xl lg:text-3xl"
                >
                  ¡Correcto! 🎉
                </motion.p>
              ) : (
                <div>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-red-400 mb-2 text-xl sm:text-2xl lg:text-3xl"
                  >
                    {timer.seconds === 0 ? "¡Tiempo agotado!" : "Incorrecto"}
                  </motion.p>
                  {question.explanation && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/80 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto"
                    >
                      {question.explanation}
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}