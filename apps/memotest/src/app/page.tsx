/**
 * MemoTest Main Page
 * Flujo: WaitingScreen -> Game
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoGame } from '@/components/game/MemoGame';
import WaitingScreen from '@/components/tv/screens/WaitingScreen';
import { useGameState } from '@/store/memoStore';

export default function Home() {
  const [showWaiting, setShowWaiting] = useState(true);
  const gameState = useGameState();
  const previousGameState = useRef<string>('waiting');
  const isInitialMount = useRef(true);

  const handleStartGame = () => {
    setShowWaiting(false);
  };

  // Detectar cuando el usuario clickea "Volver al Inicio" desde el juego
  useEffect(() => {
    // Ignorar el primer mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousGameState.current = gameState;
      return;
    }

    // Solo volver a waiting si:
    // - El estado cambió a 'waiting'
    // - El estado anterior NO era 'waiting' (venía de otra fase como 'failed' o 'prize')
    // - NO estamos mostrando la pantalla de espera

    if (
      gameState === 'waiting' &&
      previousGameState.current !== 'waiting' &&
      !showWaiting
    ) {
      // El usuario clickeó "Volver al Inicio"
      setShowWaiting(true);
    }

    // Actualizar el estado anterior
    previousGameState.current = gameState;
  }, [gameState, showWaiting]);

  return (
    <main className="relative h-screen w-screen overflow-hidden landscape:block portrait:hidden">
      <AnimatePresence mode="wait">
        {showWaiting ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50"
          >
            <div
              onClick={handleStartGame}
              className="h-full cursor-pointer"
            >
              <WaitingScreen />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <MemoGame />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje cuando está en orientación portrait */}
      <div className="landscape:hidden portrait:flex absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex-col items-center justify-center text-center p-8 z-[100]">
        <motion.svg
          className="w-24 h-24 mb-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{
            rotate: [0, 90, 90, 0],
            scale: [1, 1.1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </motion.svg>
        <h2 className="text-4xl font-bold mb-4 text-white">Rota tu dispositivo</h2>
        <p className="text-xl text-blue-200">Este juego solo funciona en modo horizontal</p>
      </div>
    </main>
  );
}