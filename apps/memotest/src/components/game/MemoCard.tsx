/**
 * MemoCard Component - Ultra-optimizado para tablets
 * CSS-first animations + Sin backdrop-blur + Containment
 * @module MemoCard
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { memo, useEffect, useRef } from 'react';
import { useCardFlipped, useCardMatched, useCardIcon, useCardShake, useMemoStore } from '@/store/memoStore';

interface MemoCardProps {
  cardId: string;
  onClick: (id: string) => void;
  disabled?: boolean;
}

/**
 * Comparador personalizado - Evita re-renders residuales
 */
function areEqual(prev: MemoCardProps, next: MemoCardProps) {
  return prev.cardId === next.cardId && prev.disabled === next.disabled;
  // onClick es estable (useCallback), no comparamos
}

/**
 * Card hiper-optimizado - CSS animations + GPU acceleration
 */
export const MemoCard = memo(function MemoCard({
  cardId,
  onClick,
  disabled = false
}: MemoCardProps) {
  // Selectores primitivos: sin crear objetos nuevos
  const isFlipped = useCardFlipped(cardId);
  const isMatched = useCardMatched(cardId);
  const icon = useCardIcon(cardId);
  const isShaking = useCardShake(cardId);
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick(cardId);
    }
  };

  // Limpiar shake con CSS animation end (sin Framer Motion callback)
  useEffect(() => {
    if (!isShaking || !cardRef.current) return;

    const handleAnimationEnd = (e: AnimationEvent) => {
      if (e.animationName === 'shake') {
        useMemoStore.getState().clearShake(cardId);
      }
    };

    const el = cardRef.current;
    el.addEventListener('animationend', handleAnimationEnd);
    return () => el.removeEventListener('animationend', handleAnimationEnd);
  }, [isShaking, cardId]);

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative w-full h-full cursor-pointer
        transform-gpu
        transition-transform duration-150 ease-out
        ${!disabled && !isFlipped && !isMatched ? 'hover:scale-[1.02] active:scale-[0.96]' : ''}
        ${isShaking ? 'animate-shake' : ''}
        ${isMatched ? 'scale-95' : ''}
      `}
      onClick={handleClick}
      initial={false}
      layout={false}
      animate={prefersReducedMotion ? {} : { scale: isMatched ? 0.95 : 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        contain: 'layout paint style',
        willChange: isShaking || (isFlipped !== isMatched) ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        perspective: '1200px', // Perspective movida al wrapper de cada card
      }}
    >
      {/* Parte trasera de la carta - Logo institucional DarSalud */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-white/5
          shadow-md
          ring-1 ring-white/10
          flex items-center justify-center
          overflow-hidden
          transition-opacity duration-150
          ${disabled ? 'opacity-50' : ''}
          ${isFlipped || isMatched ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        {/* Overlay radial para dar profundidad y resaltar el logo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Gradiente sutil de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-blue-700/15 to-cyan-800/20 pointer-events-none" />

        <div className="relative z-10 w-[70%] h-[70%] flex items-center justify-center">
          <img
            src="/images/8.svg"
            alt="DarSalud Logo"
            className="w-full h-full object-contain select-none pointer-events-none opacity-80"
            draggable={false}
          />
        </div>

        {/* Brillo superior sutil */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent rounded-2xl pointer-events-none" />
      </div>

      {/* Parte frontal de la carta */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          flex items-center justify-center
          overflow-hidden
          transition-opacity duration-150
          ${isFlipped || isMatched ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${isMatched
            ? 'bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-emerald-600/95 ring-2 ring-emerald-300/60 shadow-lg'
            : 'bg-white ring-1 ring-cyan-400/30 shadow-md'
          }
        `}
      >
        {/* Contenido de la carta - Ícono */}
        <div className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full transition-all duration-150 ${
          isMatched
            ? 'bg-white/15 border border-white/30'
            : 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-300/40'
        }`}>
          <span className="text-6xl select-none">
            {icon}
          </span>
        </div>

        {/* Brillo superior */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none" />

        {/* Checkmark para matched */}
        {isMatched && (
          <div className="absolute top-3 right-3 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-emerald-200">
            <span className="text-2xl text-emerald-600 font-bold">✓</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}, areEqual);