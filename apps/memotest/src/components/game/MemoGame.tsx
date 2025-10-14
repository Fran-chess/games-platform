/**
 * MemoGame Component - Orquestador Principal
 * Maneja el flujo completo del juego de MemoTest
 * @module MemoGame
 */

'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameState, useShowConfetti, useMemoStore } from '@/store/memoStore';
import { MemorizationPhase } from './MemorizationPhase';
import { PlayingPhase } from './PlayingPhase';
import { PrizePhase } from './PrizePhase';
import { DefeatModal } from './DefeatModal';
import { MassiveConfetti } from '@games-platform/ui';
import { useMemoAudio } from '@/hooks/useMemoAudio';

export function MemoGame() {
  const gameState = useGameState();
  const showConfetti = useShowConfetti();
  const { initGame, startShuffling, initializePrizePhase } = useMemoStore();

  const {
    playPhaseStart,
    playVictory,
    playDefeat,
  } = useMemoAudio();

  // Inicializar juego al montar - SIEMPRE iniciar cuando se monta el componente
  useEffect(() => {
    initGame();
    // Pequeño delay antes de empezar shuffling
    const timer = setTimeout(() => {
      startShuffling();
      playPhaseStart();
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Solo ejecutar al montar, sin dependencias

  // Manejar transición a fase de premio cuando gana
  useEffect(() => {
    if (gameState === 'success') {
      playVictory();
      // Delay antes de mostrar premio
      const timer = setTimeout(() => {
        initializePrizePhase();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState, initializePrizePhase, playVictory]);

  // Reproducir sonido de derrota
  useEffect(() => {
    if (gameState === 'failed') {
      playDefeat();
    }
  }, [gameState, playDefeat]);

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Fase de shuffling y memorización */}
        {(gameState === 'shuffling' || gameState === 'memorizing') && (
          <MemorizationPhase key="memorization" />
        )}

        {/* Fase de juego activo */}
        {gameState === 'playing' && (
          <PlayingPhase key="playing" />
        )}

        {/* Fase de premio */}
        {gameState === 'prize' && (
          <PrizePhase key="prize" />
        )}
      </AnimatePresence>

      {/* Modal de derrota */}
      <AnimatePresence>
        {gameState === 'failed' && (
          <DefeatModal key="defeat" reason="max_moves" />
        )}
      </AnimatePresence>

      {/* Confetti para victoria */}
      {showConfetti && gameState === 'success' && (
        <MassiveConfetti
          show={showConfetti}
          windowSize={{
            width: typeof window !== 'undefined' ? window.innerWidth : 1920,
            height: typeof window !== 'undefined' ? window.innerHeight : 1080
          }}
        />
      )}
    </div>
  );
}