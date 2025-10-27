/**
 * CardsGrid Component - Ultra-optimizado para tablets
 * NO se suscribe al timer, solo a cardOrder e isProcessing
 * @module CardsGrid
 */

'use client';

import { memo } from 'react';
import { MemoCard } from './MemoCard';
import { useCardOrder, useIsProcessing, useMovesUsed } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';

interface CardsGridProps {
  onCardClick: (cardId: string) => void;
  disabled?: boolean;
}

/**
 * Grid ultra-aislado - NO observa timer
 * Solo re-renderiza cuando:
 * - cardOrder cambia (nunca durante gameplay)
 * - isProcessing cambia (al voltear 2 cards)
 * - movesUsed cambia (al hacer un movimiento)
 * - Una card individual cambia (flip/match)
 */
const CardsGridComponent = ({ onCardClick, disabled = false }: CardsGridProps) => {
  const cardOrder = useCardOrder();
  const isProcessing = useIsProcessing();
  const movesUsed = useMovesUsed();

  // Calcular movesLeft (solo cambia cuando se hace un movimiento)
  const config = memoService.getConfig();
  const movesLeft = config.maxMoves - movesUsed;

  const isDisabled = disabled || isProcessing || movesLeft === 0;

  return (
    <div
      className="grid grid-cols-6 grid-rows-2 auto-rows-fr gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10 w-full place-items-center transform-gpu"
      style={{ contain: 'layout paint style' }}
    >
      {cardOrder.map((cardId) => (
        <div
          key={cardId}
          className="relative w-full aspect-[3/4] transform-gpu"
          style={{ contain: 'layout style' }}
        >
          <MemoCard
            cardId={cardId}
            onClick={onCardClick}
            disabled={isDisabled}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Comparador: solo re-renderizar si cambia disabled o onCardClick
 * cardOrder y isProcessing se observan internamente
 */
const areEqual = (prev: CardsGridProps, next: CardsGridProps) => {
  return prev.disabled === next.disabled && prev.onCardClick === next.onCardClick;
};

export const CardsGrid = memo(CardsGridComponent, areEqual);
