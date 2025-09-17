/**
 * MemoTest Main Page
 * Mantiene el flujo WaitingScreen -> Game
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemoStore } from '@/store/memoStore';
import { MemoGame } from '@/components/game/MemoGame';
import WaitingScreen from '@/components/tv/screens/WaitingScreen';

export default function Home() {
  const [showWaiting, setShowWaiting] = useState(true);
  const { initGame, startGame, gameState } = useMemoStore();

  // Inicializar el juego al montar
  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleStartGame = () => {
    setShowWaiting(false);
    startGame();
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
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
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <MemoGame />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}