/**
 * MemorizationPhase Component - Optimizado
 * Animaciones livianas + Timer optimizado
 * @module MemorizationPhase
 */

'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MemoCard } from './MemoCard';
import { useCardOrder, useTimeLeft, useMemorizationPhase, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';

export function MemorizationPhase() {
  const cardOrder = useCardOrder();
  const timeLeft = useTimeLeft(); // Del store, actualizado por Clock a 1 Hz
  const phase = useMemorizationPhase(); // Del store state machine
  const { transitionToMemorizing } = useMemoStore();

  const config = memoService.getConfig();

  // Iniciar state machine al montar
  useEffect(() => {
    transitionToMemorizing();
  }, [transitionToMemorizing]);

  const handleDummyClick = useCallback(() => {
    // No hacer nada durante memorización
  }, []);

  return (
    <div className="h-screen p-8 lg:p-12 flex flex-col">
      {/* Header HUD compacto */}
      <div className="max-w-[92vw] mx-auto mb-3 w-full">
        <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-4 md:p-5 border border-cyan-400/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex justify-between items-center gap-3">
            {/* Instrucciones compactas */}
            <div className={`flex-1 ${phase === 'shuffling' ? 'text-center' : 'text-left'}`}>
              {phase === 'shuffling' && (
                <div key="shuffling">
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">Mezclando cartas...</h2>
                  <p className="text-sm lg:text-base text-white/80 mt-1 font-medium">Preparando el juego</p>
                </div>
              )}

              {phase === 'memorizing' && (
                <div key="memorizing">
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-cyan-300 tracking-tight leading-tight">
                    ¡Memoriza las cartas!
                  </h2>
                  <p className="text-sm lg:text-base text-white/85 mt-1 font-medium">
                    Recuerda la posición de cada símbolo
                  </p>
                </div>
              )}
            </div>

            {/* Timer circular compacto */}
            {phase === 'memorizing' && (
              <div className="relative flex items-center justify-center shrink-0 w-24 h-24 lg:w-28 lg:h-28">
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgb(103, 232, 249)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: '283',
                      strokeDashoffset: 0,
                    }}
                  />
                </svg>

                {/* Número central compacto */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl lg:text-4xl font-black tracking-tight ${
                    timeLeft <= 3 ? 'text-red-400' : 'text-cyan-300'
                  }`}>
                    {timeLeft}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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