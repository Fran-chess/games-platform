/**
 * MemorizationPhase Component - Optimizado
 * Animaciones livianas + Timer optimizado
 * @module MemorizationPhase
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { useCardOrder, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';

export function MemorizationPhase() {
  const cardOrder = useCardOrder();
  const { startMemorizing, startPlaying } = useMemoStore();
  const [phase, setPhase] = useState<'shuffling' | 'memorizing' | 'hiding'>('shuffling');
  const [timeLeft, setTimeLeft] = useState(0);
  const timeRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  const config = memoService.getConfig();

  // Fase de shuffling
  useEffect(() => {
    if (phase === 'shuffling') {
      const timer = setTimeout(() => {
        setPhase('memorizing');
        startMemorizing();
        timeRef.current = config.memorizationTime;
        setTimeLeft(config.memorizationTime);
        lastTickRef.current = Date.now();
      }, config.shuffleAnimationTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [phase, config, startMemorizing]);

  // Timer con rAF
  useEffect(() => {
    if (phase !== 'memorizing' || timeLeft === 0) return;

    let rafId: number;

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;

      if (delta >= 1000) {
        lastTickRef.current = now;
        timeRef.current = Math.max(0, timeRef.current - 1);
        setTimeLeft(timeRef.current);

        if (timeRef.current === 0) {
          setPhase('hiding');
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phase, timeLeft]);

  // Fase de hiding
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
      {/* Header HUD compacto */}
      <motion.div
        className="max-w-[92vw] mx-auto mb-3 w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-4 md:p-5 border border-cyan-400/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex justify-between items-center gap-3">
            {/* Instrucciones compactas */}
            <div className="text-left flex-1">
              {phase === 'shuffling' && (
                <motion.div
                  key="shuffling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">Mezclando cartas...</h2>
                  <p className="text-sm lg:text-base text-white/80 mt-1 font-medium">Preparando el juego</p>
                </motion.div>
              )}

              {phase === 'memorizing' && (
                <motion.div
                  key="memorizing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-cyan-300 tracking-tight leading-tight">
                    ¡Memoriza las cartas!
                  </h2>
                  <p className="text-sm lg:text-base text-white/85 mt-1 font-medium">
                    Recuerda la posición de cada símbolo
                  </p>
                </motion.div>
              )}

              {phase === 'hiding' && (
                <motion.div
                  key="hiding"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight leading-tight">
                    ¡A jugar!
                  </h2>
                  <p className="text-sm lg:text-base text-white/85 mt-1 font-medium">
                    Encuentra los 2 pares
                  </p>
                </motion.div>
              )}
            </div>

            {/* Timer circular compacto */}
            {phase === 'memorizing' && (
              <motion.div
                className="relative flex items-center justify-center shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <svg className="w-24 h-24 lg:w-28 lg:h-28 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgb(103, 232, 249)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 1 }}
                    animate={{
                      pathLength: timeLeft / config.memorizationTime,
                    }}
                    transition={{ duration: 1, ease: 'linear' }}
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(103, 232, 249, 0.6))',
                      strokeDasharray: '283',
                      strokeDashoffset: 0,
                    }}
                  />
                </svg>

                {/* Número central compacto */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={timeLeft <= 3 ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.4, repeat: timeLeft <= 3 ? Infinity : 0 }}
                >
                  <span className={`text-3xl lg:text-4xl font-black tracking-tight ${
                    timeLeft <= 3 ? 'text-red-400' : 'text-cyan-300'
                  }`}>
                    {timeLeft}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Grid de cartas optimizado */}
      <motion.div
        className="max-w-[92vw] mx-auto flex-1 flex items-center justify-center w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className="grid grid-cols-6 grid-rows-2 auto-rows-fr gap-6 w-full place-items-center"
          style={{ contain: 'layout paint', perspective: '1200px' }}
        >
          {cardOrder.map((cardId) => (
            <div
              key={cardId}
              className="relative w-full aspect-[3/4]"
            >
              <MemoCard
                cardId={cardId}
                onClick={handleDummyClick}
                disabled={true}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}