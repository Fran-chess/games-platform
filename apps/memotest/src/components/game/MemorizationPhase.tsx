/**
 * MemorizationPhase Component
 * Fase de mezcla y memorización de cartas
 * @module MemorizationPhase
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { useCards, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';

export function MemorizationPhase() {
  const cards = useCards();
  const { startMemorizing, startPlaying } = useMemoStore();
  const [phase, setPhase] = useState<'shuffling' | 'memorizing' | 'hiding'>('shuffling');
  const [timeLeft, setTimeLeft] = useState(0);

  const config = memoService.getConfig();

  // Fase de shuffling (2 segundos)
  useEffect(() => {
    if (phase === 'shuffling') {
      const timer = setTimeout(() => {
        setPhase('memorizing');
        startMemorizing();
        setTimeLeft(config.memorizationTime);
      }, config.shuffleAnimationTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [phase, config, startMemorizing]);

  // Fase de memorización (8 segundos con countdown)
  useEffect(() => {
    if (phase === 'memorizing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase('hiding');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, timeLeft]);

  // Fase de hiding (voltear cards y empezar juego)
  useEffect(() => {
    if (phase === 'hiding') {
      const timer = setTimeout(() => {
        startPlaying();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [phase, startPlaying]);

  const handleDummyClick = useCallback(() => {
    // No hacer nada durante memorización
  }, []);

  return (
    <div className="h-screen p-8 lg:p-12 flex flex-col">
      {/* Header HUD profesional con glassmorphism */}
      <motion.div
        className="max-w-[92vw] mx-auto mb-6 w-full"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="relative bg-white/15 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(4,53,163,0.3)] p-6 md:p-8 border-2 border-cyan-400/40 overflow-hidden">
          {/* Efecto de brillo superior */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Borde interno decorativo */}
          <div className="absolute inset-2 rounded-xl border border-white/10 pointer-events-none" />

          <div className="relative z-10 flex justify-between items-center gap-4">
            {/* Instrucciones mejoradas */}
            <div className="text-left flex-1">
              <AnimatePresence mode="wait">
                {phase === 'shuffling' && (
                  <motion.div
                    key="shuffling"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">Mezclando cartas...</h2>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/80 mt-2 font-medium">Preparando el juego</p>
                  </motion.div>
                )}

                {phase === 'memorizing' && (
                  <motion.div
                    key="memorizing"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-cyan-300 tracking-tight drop-shadow-lg">
                      ¡Memoriza las cartas!
                    </h2>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/90 mt-2 font-medium">
                      Recuerda la posición de cada símbolo
                    </p>
                  </motion.div>
                )}

                {phase === 'hiding' && (
                  <motion.div
                    key="hiding"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-emerald-400 tracking-tight drop-shadow-lg">
                      ¡A jugar!
                    </h2>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/90 mt-2 font-medium">
                      Encuentra los 2 pares
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timer circular mejorado con ring turquesa animado */}
            {phase === 'memorizing' && (
              <motion.div
                className="relative flex items-center justify-center shrink-0"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.2 }}
              >
                {/* Glow effect exterior */}
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl" />

                <svg className="w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  {/* Background circle con borde */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="rgba(255,255,255,0.1)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  {/* Progress ring - turquesa animado */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient-timer)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ pathLength: 1 }}
                    animate={{
                      pathLength: timeLeft / config.memorizationTime,
                    }}
                    transition={{ duration: 1, ease: 'linear' }}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(103, 232, 249, 0.8))',
                      strokeDasharray: '283',
                      strokeDashoffset: 0,
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient-timer" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(103, 232, 249)" />
                      <stop offset="100%" stopColor="rgb(34, 211, 238)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Número central mejorado */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={timeLeft <= 3 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
                >
                  <span className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight ${
                    timeLeft <= 3 ? 'text-red-400' : 'text-cyan-300'
                  } drop-shadow-lg`}>
                    {timeLeft}
                  </span>
                </motion.div>
              </motion.div>
            )}
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
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className="relative w-full aspect-[3/4]"
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: phase === 'shuffling' ? index * 0.08 : 0,
                  type: 'spring',
                  stiffness: 260,
                  damping: 22,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                whileTap={{ scale: 0.98 }}
              >
                <MemoCard
                  card={card}
                  onClick={handleDummyClick}
                  disabled={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}