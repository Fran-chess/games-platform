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
      className="relative w-full h-full cursor-pointer"
      onClick={handleClick}
      whileTap={!disabled && !card.isFlipped && !card.isMatched ? { scale: 0.98 } : {}}
      initial={false}
      animate={{
        scale: card.isMatched ? 0.95 : 1,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut'
      }}
    >
      {/* Parte trasera de la carta - Logo institucional DarSalud */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-white/15 backdrop-blur-sm
          shadow-xl border-4 border-cyan-400/60
          flex items-center justify-center
          overflow-hidden
          transition-opacity duration-200
          ${disabled ? 'opacity-50' : ''}
          ${card.isFlipped || card.isMatched ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
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
      </div>

      {/* Parte frontal de la carta - Glassmorphism profesional */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          border-4
          flex items-center justify-center
          overflow-hidden
          transition-all duration-200
          ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${card.isMatched
            ? 'bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-emerald-600/95 border-emerald-300/70 shadow-[0_8px_32px_rgba(16,185,129,0.4)]'
            : 'bg-white/95 backdrop-blur-md border-cyan-400/40 shadow-[0_4px_24px_rgba(4,53,163,0.2)]'
          }
        `}
      >
        {/* Borde interno sutil */}
        <div className={`absolute inset-3 rounded-xl border pointer-events-none transition-colors duration-300 ${
          card.isMatched ? 'border-white/30' : 'border-cyan-300/20'
        }`} />

        {/* Contenido de la carta - Ícono con marco circular */}
        <div className={`relative z-10 flex items-center justify-center w-32 h-32 rounded-full transition-all duration-200 ${
          card.isMatched
            ? 'bg-white/20 border-2 border-white/40'
            : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300/50'
        }`}>
          <span className={`text-7xl select-none ${card.isMatched ? 'filter drop-shadow-lg' : ''}`}>
            {card.icon}
          </span>
        </div>

        {/* Brillo superior para profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none" />

        {/* Overlay de match exitoso */}
        {card.isMatched && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none animate-fadeIn">
            {/* Checkmark simplificado */}
            <div className="absolute top-4 right-4 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-2 border-emerald-200 animate-scaleIn">
              <span className="text-3xl text-emerald-600 font-bold">✓</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});