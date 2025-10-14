/**
 * MemoCard Component - Rediseñado para tablets
 * Carta interactiva con animaciones 3D profesionales
 * @module MemoCard
 */

'use client';

import { motion } from 'framer-motion';
import type { MemoCard as MemoCardType } from '@/services/game/memoService';
import { memo } from 'react';

interface MemoCardProps {
  card: MemoCardType;
  onClick: (id: string) => void;
  disabled?: boolean;
}

/**
 * Componente Card optimizado para tablets (sin hover)
 * Usa memo para optimizar re-renders
 */
export const MemoCard = memo(function MemoCard({
  card,
  onClick,
  disabled = false
}: MemoCardProps) {
  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick(card.id);
    }
  };

  return (
    <motion.div
      className="relative w-full h-full cursor-pointer preserve-3d"
      onClick={handleClick}
      whileTap={!disabled && !card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
      initial={false}
      animate={{
        rotateY: card.isFlipped || card.isMatched ? 180 : 0,
        scale: card.isMatched ? 0.9 : 1,
      }}
      transition={{
        rotateY: {
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        },
        scale: {
          duration: 0.3,
          ease: 'easeOut'
        }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
    >
      {/* Parte trasera de la carta - Logo institucional DarSalud */}
      <motion.div
        className={`
          absolute inset-0 rounded-2xl
          bg-white/15 backdrop-blur-sm
          shadow-xl border-4 border-cyan-400/60
          flex items-center justify-center
          backface-hidden overflow-hidden
          ${disabled ? 'opacity-50' : ''}
        `}
        style={{
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Logo DarSalud centrado */}
        <div className="relative z-10 w-[70%] h-[70%] flex items-center justify-center">
          <img
            src="/images/8.svg"
            alt="DarSalud Logo"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Brillo sutil para elegancia */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-2xl pointer-events-none" />

        {/* Borde interno decorativo */}
        <div className="absolute inset-2 rounded-xl border border-white/20 pointer-events-none" />
      </motion.div>

      {/* Parte frontal de la carta - Glassmorphism profesional */}
      <motion.div
        className={`
          absolute inset-0 rounded-2xl
          border-4
          flex items-center justify-center
          backface-hidden overflow-hidden
          transition-all duration-300
          ${card.isMatched
            ? 'bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-emerald-600/95 border-emerald-300/70 shadow-[0_8px_32px_rgba(16,185,129,0.4)]'
            : 'bg-white/95 backdrop-blur-md border-cyan-400/40 shadow-[0_4px_24px_rgba(4,53,163,0.2)]'
          }
        `}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        {/* Borde interno sutil */}
        <div className={`absolute inset-3 rounded-xl border pointer-events-none transition-colors duration-300 ${
          card.isMatched ? 'border-white/30' : 'border-cyan-300/20'
        }`} />

        {/* Contenido de la carta - Ícono con marco circular */}
        <div className={`relative z-10 flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${
          card.isMatched
            ? 'bg-white/20 border-2 border-white/40'
            : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300/50'
        }`}>
          <motion.span
            className={`text-7xl select-none ${card.isMatched ? 'filter drop-shadow-lg' : ''}`}
            animate={card.isMatched ? {
              scale: [1, 1.15, 1],
              rotate: [0, -8, 8, 0],
            } : {}}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1] // easeOutBack
            }}
          >
            {card.icon}
          </motion.span>
        </div>

        {/* Brillo superior para profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none" />

        {/* Overlay de match exitoso */}
        {card.isMatched && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Glow pulsante */}
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-2xl"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Checkmark con animación mejorada */}
            <motion.div
              className="absolute top-4 right-4 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-2 border-emerald-200"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 500,
                damping: 18
              }}
            >
              <span className="text-3xl text-emerald-600 font-bold">✓</span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});