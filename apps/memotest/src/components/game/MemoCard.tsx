/**
 * MemoCard Component
 * Carta interactiva con animaciones 3D profesionales
 * @module MemoCard
 */

'use client';

import { motion } from 'framer-motion';
import { Card as CardType } from '@/store/memoStore';
import { memo } from 'react';

interface MemoCardProps {
  card: CardType;
  onClick: (id: string) => void;
  disabled?: boolean;
}

/**
 * Componente Card con animaciones fluidas y diseño profesional
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
      className="relative w-full h-full preserve-3d cursor-pointer"
      onClick={handleClick}
      whileHover={!disabled && !card.isFlipped ? { scale: 1.05 } : {}}
      whileTap={!disabled && !card.isFlipped ? { scale: 0.95 } : {}}
      initial={false}
      animate={{
        rotateY: card.isFlipped || card.isMatched ? 180 : 0,
        scale: card.isMatched ? 0.85 : 1,
      }}
      transition={{
        rotateY: {
          duration: 0.6,
          ease: "easeInOut"
        },
        scale: {
          duration: 0.3,
          ease: "easeOut"
        }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
    >
      {/* Parte trasera de la carta */}
      <motion.div
        className={`
          absolute inset-0 rounded-xl backface-hidden
          bg-gradient-to-br from-cyan-500 to-blue-600
          shadow-2xl border-2 border-cyan-400/50
          flex items-center justify-center
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        style={{
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="text-white/30 text-6xl font-bold">
          ⚕️
        </div>
        <div className="absolute inset-0 bg-white/10 rounded-xl backdrop-blur-sm" />
      </motion.div>

      {/* Parte frontal de la carta */}
      <motion.div
        className={`
          absolute inset-0 rounded-xl backface-hidden
          ${card.isMatched
            ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300'
            : 'bg-gradient-to-br from-white to-gray-100 border-white/50'
          }
          shadow-2xl border-2
          flex items-center justify-center
          transition-all duration-300
        `}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
        animate={{
          scale: card.isMatched ? [1, 1.2, 1] : 1,
        }}
        transition={{
          scale: {
            duration: 0.5,
            ease: "easeOut"
          }
        }}
      >
        <motion.span
          className="text-6xl select-none"
          animate={card.isMatched ? {
            rotate: [0, 10, -10, 10, 0],
          } : {}}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
        >
          {card.icon}
        </motion.span>

        {card.isMatched && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-xl" />
            <motion.div
              className="absolute top-2 right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 500,
                damping: 15
              }}
            >
              <span className="text-2xl">✓</span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});

// Añadir estilos globales necesarios para preserve-3d
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .preserve-3d {
      transform-style: preserve-3d;
    }
    .backface-hidden {
      backface-visibility: hidden;
    }
  `;
  document.head.appendChild(style);
}