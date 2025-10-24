/**
 * MemoCard Component - Máxima optimización
 * Selectores primitivos + Comparador personalizado + Shake React
 * @module MemoCard
 */

'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
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
 * Card hiper-optimizado - Selectores primitivos + Comparador
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

  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick(cardId);
    }
  };

  return (
    <motion.div
      className="relative w-full h-full cursor-pointer"
      onClick={handleClick}
      whileTap={!disabled && !isFlipped && !isMatched ? { scale: 0.96 } : {}}
      initial={false}
      animate={{
        scale: isMatched ? 0.95 : 1,
        x: isShaking ? [0, -4, 4, -4, 4, 0] : 0,
      }}
      transition={{
        scale: { duration: 0.2, ease: 'easeOut' },
        x: { duration: 0.4, ease: 'easeInOut' },
      }}
      onAnimationComplete={(definition: any) => {
        // Limpiar shake al terminar animación (sin setTimeout)
        if (definition.x === 0 && isShaking) {
          const { clearShake } = useMemoStore.getState();
          clearShake(cardId);
        }
      }}
      style={{
        // will-change just-in-time: solo durante flip/shake
        willChange: (isFlipped !== isMatched || isShaking) ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)', // Force GPU layer
      }}
    >
      {/* Parte trasera de la carta - Logo institucional DarSalud */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-white/10 backdrop-blur-md
          shadow-lg border-2 border-cyan-400/50
          flex items-center justify-center
          overflow-hidden
          transition-opacity duration-150
          ${disabled ? 'opacity-50' : ''}
          ${isFlipped || isMatched ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <div className="relative z-10 w-[70%] h-[70%] flex items-center justify-center">
          <img
            src="/images/8.svg"
            alt="DarSalud Logo"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-2xl pointer-events-none" />
      </div>

      {/* Parte frontal de la carta */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          border-2
          flex items-center justify-center
          overflow-hidden
          transition-opacity duration-150
          ${isFlipped || isMatched ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${isMatched
            ? 'bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-emerald-600/95 border-emerald-300/60 shadow-lg'
            : 'bg-white/95 backdrop-blur-md border-cyan-400/40 shadow-md'
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