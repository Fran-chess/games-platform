/**
 * PlayingPhase Component - Ultra-optimizado
 * HUD memoizado + Grid desacoplado del timer + Exit coordinado
 * @module PlayingPhase
 */

'use client';

import { useEffect, useCallback, useMemo, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CardsGrid } from './CardsGrid';
import { useMovesUsed, useMatchesFound, useTimeLeft, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';
import { useMemoAudio } from '@/hooks/useMemoAudio';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { phaseTransition, phaseTransitionReduced } from '@/utils/transitions';

/**
 * HUD aislado y memoizado - Solo re-renderiza cuando cambian stats o tiempo
 * Evita que el re-render se propague al grid de cards
 */
const GameHUD = memo(function GameHUD({ timeLeft }: { timeLeft: number }) {
  const movesUsed = useMovesUsed();
  const matchesFound = useMatchesFound();
  const config = memoService.getConfig();
  const { shouldReduceEffects } = useDeviceCapabilities();

  const formatTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const movesLeft = useMemo(() => config.maxMoves - movesUsed, [config.maxMoves, movesUsed]);

  const movesColor = useMemo(() => {
    if (movesLeft === 0) return 'bg-red-500/20 text-red-300 border-red-400/50';
    if (movesLeft === 1) return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
    return 'bg-green-500/20 text-green-300 border-green-400/50';
  }, [movesLeft]);

  return (
    <motion.div
      className="max-w-[92vw] mx-auto mb-6 w-full"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="relative bg-black/20 backdrop-blur-[2px] rounded-2xl shadow-xl p-4 ring-1 ring-white/15 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex justify-center items-center gap-6">
          {/* Timer */}
          <motion.div className="flex items-center gap-3 bg-gradient-to-br from-cyan-500/15 to-blue-600/15 rounded-xl px-4 py-3 border border-cyan-400/40 min-w-[140px]">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="rgb(103, 232, 249)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{ pathLength: timeLeft / 120 }}
                  transition={{ duration: 1, ease: 'linear' }}
                  style={{
                    // Reducir drop-shadow en low-end devices
                    filter: shouldReduceEffects ? 'none' : 'drop-shadow(0 0 4px rgba(103, 232, 249, 0.6))',
                    strokeDasharray: '88',
                    strokeDashoffset: 0,
                  }}
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs text-white/90 font-medium flex items-center gap-1">
                <span>⏱️</span> Tiempo
              </p>
              <p className={`text-lg font-black tracking-wide ${timeLeft <= 30 ? 'text-red-300' : 'text-white'}`}>
                {formatTime}
              </p>
            </div>
          </motion.div>

          {/* Movimientos */}
          <motion.div className={`text-center rounded-xl px-4 py-3 border min-w-[140px] transition-colors duration-300 ${movesColor}`}>
            <p className="text-xs text-white/90 font-medium flex items-center justify-center gap-1">
              <span>🔄</span> Movimientos
            </p>
            <p className="text-lg font-black tracking-wide text-white mt-0.5">
              {movesLeft}/{config.maxMoves}
            </p>
          </motion.div>

          {/* Pares encontrados */}
          <motion.div className="text-center bg-gradient-to-br from-purple-500/15 to-indigo-600/15 rounded-xl px-4 py-3 border border-purple-400/40 min-w-[140px]">
            <p className="text-xs text-white/90 font-medium flex items-center justify-center gap-1">
              <span>🎯</span> Pares
            </p>
            <p className="text-lg font-black text-white tracking-wide mt-0.5">
              {matchesFound}/{config.requiredPairs}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

export function PlayingPhase() {
  const timeLeft = useTimeLeft(); // Del store, actualizado por Clock a 1 Hz
  const { flipCard, startClock, stopClock, setAudioCallbacks } = useMemoStore();

  const { playFlip, playMatch, playError, playTick } = useMemoAudio();
  const prefersReducedMotion = useReducedMotion();
  const { shouldReduceEffects } = useDeviceCapabilities();

  // Seleccionar transición según device capabilities
  const transition = (prefersReducedMotion || shouldReduceEffects)
    ? phaseTransitionReduced
    : phaseTransition;

  // Inyectar callbacks de audio al montar, iniciar clock
  useEffect(() => {
    setAudioCallbacks({
      onMatch: playMatch,
      onError: playError,
      onTick: playTick,
    });

    startClock(120);

    return () => {
      stopClock();
    };
  }, [startClock, stopClock, setAudioCallbacks, playMatch, playError, playTick]);

  const handleCardClick = useCallback((cardId: string) => {
    playFlip();
    flipCard(cardId);
  }, [flipCard, playFlip]);

  return (
    <motion.div
      className="h-screen p-8 lg:p-12 flex flex-col"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={transition}
      layout={false}
    >
      {/* HUD aislado y memoizado - Re-renders NO se propagan al grid */}
      <GameHUD timeLeft={timeLeft} />

      {/* Grid de cartas - Completamente aislado, NO observa timer ni stats */}
      <GridWrapper onCardClick={handleCardClick} />
    </motion.div>
  );
}

/**
 * Wrapper memoizado para evitar re-renders del grid por cambios del timer
 */
const GridWrapper = memo(function GridWrapper({
  onCardClick
}: {
  onCardClick: (cardId: string) => void
}) {
  return (
    <div className="max-w-[92vw] mx-auto flex-1 flex items-center justify-center w-full">
      <CardsGrid onCardClick={onCardClick} />
    </div>
  );
});