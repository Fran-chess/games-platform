/**
 * MemoGame Component
 * Componente principal del juego con grid responsivo
 * @module MemoGame
 */

'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemoStore } from '@/store/memoStore';
import { MemoCard } from './MemoCard';
import { Button } from '@games-platform/ui';
import { useTimer } from '@games-platform/game-core';
import { MassiveConfetti } from '@games-platform/ui';

export function MemoGame() {
  const {
    gameState,
    cards,
    stats,
    config,
    showConfetti,
    isProcessing,
    flipCard,
    startGame,
    resetGame,
    pauseGame,
    resumeGame,
    updateTimeElapsed,
    setShowConfetti
  } = useMemoStore();

  // Timer hook
  const { timeLeft, isRunning, start, pause, reset } = useTimer({
    initialTime: 120, // 2 minutos
    onComplete: () => {
      // Manejar fin del tiempo
      if (gameState === 'playing') {
        pauseGame();
      }
    },
    autoStart: false
  });

  // Actualizar tiempo transcurrido
  useEffect(() => {
    if (gameState === 'playing' && isRunning) {
      updateTimeElapsed(120 - timeLeft);
    }
  }, [timeLeft, gameState, isRunning, updateTimeElapsed]);

  // Manejar estados del juego
  useEffect(() => {
    if (gameState === 'playing' && !isRunning) {
      start();
    } else if (gameState === 'paused' && isRunning) {
      pause();
    } else if (gameState === 'completed' && isRunning) {
      pause();
    }
  }, [gameState, isRunning, start, pause]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!isProcessing) {
      flipCard(cardId);
    }
  }, [flipCard, isProcessing]);

  const handleRestart = () => {
    resetGame();
    reset();
    setShowConfetti(false);
  };

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular puntaje
  const calculateScore = () => {
    if (stats.moves === 0) return 0;
    const efficiency = (stats.matches / (stats.moves / 2)) * 100;
    const timeBonus = Math.max(0, 100 - stats.timeElapsed);
    return Math.round(efficiency + timeBonus);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      {/* Header con estadísticas */}
      <motion.div
        className="max-w-6xl mx-auto mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-ultra-legible">
                MemoTest Enfermería
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                Encuentra todos los pares de instrumentos médicos
              </p>
            </div>

            <div className="flex gap-4 sm:gap-6">
              <div className="text-center bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-white/70">Tiempo</p>
                <p className="text-xl sm:text-2xl font-bold text-cyan-300">
                  {formatTime(timeLeft)}
                </p>
              </div>

              <div className="text-center bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-white/70">Movimientos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {stats.moves}
                </p>
              </div>

              <div className="text-center bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-white/70">Pares</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">
                  {stats.matches}/{config.cardPairs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid de cartas */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className={`
          grid gap-3 sm:gap-4 md:gap-5
          ${config.cardPairs === 4 ? 'grid-cols-4 grid-rows-2' :
            config.cardPairs === 6 ? 'grid-cols-4 grid-rows-3' :
            'grid-cols-4 grid-rows-4'}
          aspect-[2/1]
        `}>
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className="relative w-full h-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 0.3,
                  delay: card.position * 0.05
                }}
                layout
              >
                <MemoCard
                  card={card}
                  onClick={handleCardClick}
                  disabled={isProcessing || gameState !== 'playing'}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Controles del juego */}
      <motion.div
        className="max-w-4xl mx-auto mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex justify-center gap-4">
          {gameState === 'playing' && (
            <Button
              variant="secondary"
              size="lg"
              onClick={pauseGame}
            >
              Pausar
            </Button>
          )}

          {gameState === 'paused' && (
            <Button
              variant="primary"
              size="lg"
              onClick={resumeGame}
            >
              Continuar
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={handleRestart}
          >
            Reiniciar
          </Button>
        </div>
      </motion.div>

      {/* Modal de victoria */}
      <AnimatePresence>
        {gameState === 'completed' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  🏆
                </motion.div>

                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  ¡Felicitaciones!
                </h2>

                <p className="text-gray-600 mb-6">
                  Has completado el MemoTest
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo:</span>
                    <span className="font-bold text-gray-800">
                      {formatTime(stats.timeElapsed)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Movimientos:</span>
                    <span className="font-bold text-gray-800">
                      {stats.moves}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntaje:</span>
                    <span className="font-bold text-2xl text-green-600">
                      {calculateScore()}
                    </span>
                  </div>
                  {stats.perfectGame && (
                    <motion.div
                      className="mt-4 p-2 bg-yellow-100 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-yellow-800 font-bold">
                        ⭐ ¡Juego Perfecto!
                      </span>
                    </motion.div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleRestart}
                >
                  Jugar de Nuevo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      {showConfetti && (
        <MassiveConfetti
          show={showConfetti}
          windowSize={{
            width: window.innerWidth,
            height: window.innerHeight
          }}
        />
      )}
    </div>
  );
}