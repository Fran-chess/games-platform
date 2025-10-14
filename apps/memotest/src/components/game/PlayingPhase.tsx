/**
 * PlayingPhase Component
 * Fase activa del juego donde el usuario encuentra pares
 * @module PlayingPhase
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { useCards, useStats, useIsProcessing, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';
import { useMemoAudio } from '@/hooks/useMemoAudio';

export function PlayingPhase() {
  const cards = useCards();
  const stats = useStats();
  const isProcessing = useIsProcessing();
  const { flipCard, handleMatchCheck, handleNoMatch, checkGameEnd, initializePrizePhase } = useMemoStore();

  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const config = memoService.getConfig();
  const { playFlip, playMatch, playError, playTick } = useMemoAudio();

  // Timer principal del juego
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Verificar fin de juego cuando cambia el tiempo
  useEffect(() => {
    if (timeLeft === 0) {
      checkGameEnd(0);
    }
  }, [timeLeft, checkGameEnd]);

  // Verificar match cuando hay 2 cartas seleccionadas
  useEffect(() => {
    const flippedCards = cards.filter(c => c.isFlipped && !c.isMatched);

    if (flippedCards.length === 2 && isProcessing) {
      const [first, second] = flippedCards;

      // Delay para ver ambas cartas
      const timer = setTimeout(() => {
        const match = memoService.checkMatch(first, second);

        if (match) {
          // Match exitoso
          playMatch();
          handleMatchCheck(first, second);

          // Verificar si ganó (encontró los 2 pares requeridos)
          setTimeout(() => {
            if (stats.matchesFound + 1 >= config.requiredPairs) {
              checkGameEnd(timeLeft);
            }
          }, 100);
        } else {
          // No match - shake animation
          playError();
          const cardElements = document.querySelectorAll(`[data-card-id="${first.id}"], [data-card-id="${second.id}"]`);
          cardElements.forEach(el => el.classList.add('animate-shake'));

          setTimeout(() => {
            cardElements.forEach(el => el.classList.remove('animate-shake'));
            handleNoMatch();
          }, 800);
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [cards, isProcessing, handleMatchCheck, handleNoMatch, stats.matchesFound, config.requiredPairs, timeLeft, checkGameEnd]);

  // Verificar derrota por movimientos
  useEffect(() => {
    if (stats.movesUsed >= config.maxMoves && stats.matchesFound < config.requiredPairs && !isProcessing) {
      checkGameEnd(timeLeft);
    }
  }, [stats.movesUsed, stats.matchesFound, config.maxMoves, config.requiredPairs, timeLeft, checkGameEnd, isProcessing]);

  const handleCardClick = useCallback((cardId: string) => {
    playFlip();
    flipCard(cardId);
  }, [flipCard, playFlip]);

  // Tick en los últimos 10 segundos
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      playTick();
    }
  }, [timeLeft, playTick]);

  // Formatear tiempo
  const formatTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Calcular movimientos restantes
  const movesLeft = useMemo(() => config.maxMoves - stats.movesUsed, [config.maxMoves, stats.movesUsed]);

  // Color del badge de movimientos
  const movesColor = useMemo(() => {
    if (movesLeft === 0) return 'bg-red-500/20 text-red-300 border-red-400/50';
    if (movesLeft === 1) return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
    return 'bg-green-500/20 text-green-300 border-green-400/50';
  }, [movesLeft]);

  return (
    <div className="h-screen p-8 lg:p-12 flex flex-col">
      {/* Status Bar HUD profesional con iconos */}
      <motion.div
        className="max-w-[92vw] mx-auto mb-6 w-full"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="relative bg-white/15 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(4,53,163,0.3)] p-4 border-2 border-cyan-400/40 overflow-hidden">
          {/* Efecto de brillo superior */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Borde interno decorativo */}
          <div className="absolute inset-2 rounded-xl border border-white/10 pointer-events-none" />

          <div className="relative z-10 flex justify-center items-center gap-6">
            {/* Timer con ícono ⏱️ */}
            <motion.div
              className="flex items-center gap-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl px-4 py-3 border-2 border-cyan-400/50 shadow-lg min-w-[140px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative w-10 h-10 shrink-0">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-md" />
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    fill="rgba(255,255,255,0.15)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                  />
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
                      filter: 'drop-shadow(0 0 4px rgba(103, 232, 249, 0.6))',
                      strokeDasharray: '88',
                      strokeDashoffset: 0,
                    }}
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs text-cyan-200/80 font-semibold flex items-center gap-1">
                  <span>⏱️</span> Tiempo
                </p>
                <p className={`text-lg font-black tracking-tight ${timeLeft <= 30 ? 'text-red-400' : 'text-cyan-300'} drop-shadow-md`}>
                  {formatTime}
                </p>
              </div>
            </motion.div>

            {/* Movimientos con ícono 🔄 */}
            <motion.div
              className={`text-center rounded-xl px-4 py-3 border-2 backdrop-blur-sm shadow-lg min-w-[140px] transition-all duration-300 ${movesColor}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-xs font-semibold flex items-center justify-center gap-1 opacity-90">
                <span>🔄</span> Movimientos
              </p>
              <p className="text-lg font-black tracking-tight mt-0.5 drop-shadow-md">
                {movesLeft}/{config.maxMoves}
              </p>
            </motion.div>

            {/* Pares encontrados con ícono 🎯 */}
            <motion.div
              className="text-center bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl px-4 py-3 border-2 border-purple-400/50 shadow-lg min-w-[140px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-xs text-purple-200/80 font-semibold flex items-center justify-center gap-1">
                <span>🎯</span> Pares
              </p>
              <p className="text-lg font-black text-purple-300 tracking-tight mt-0.5 drop-shadow-md">
                {stats.matchesFound}/{config.requiredPairs}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Grid de cartas con mejor espaciado */}
      <motion.div
        className="max-w-[92vw] mx-auto flex-1 flex items-center justify-center w-full"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="grid grid-cols-6 grid-rows-2 auto-rows-fr gap-6 w-full place-items-center">
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className="relative w-full aspect-[3/4]"
                data-card-id={card.id}
                initial={{ opacity: 0, scale: 0, rotate: 180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 0.4,
                  type: 'spring',
                  stiffness: 320,
                  damping: 24,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                layout
              >
                <MemoCard
                  card={card}
                  onClick={handleCardClick}
                  disabled={isProcessing || movesLeft === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}