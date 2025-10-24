/**
 * CardsGrid Component - Aislado y optimizado
 * NO se suscribe al timer ni stats, solo re-renderiza cuando cambian las cards
 * @module CardsGrid
 */

'use client';

import { memo, useCallback } from 'react';
import { MemoCard } from './MemoCard';
import { useCardOrder, useIsProcessing, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';

interface CardsGridProps {
  onCardClick: (cardId: string) => void;
  disabled?: boolean;
}

/**
 * Grid aislado - NO observa timer/stats
 * Solo re-renderiza cuando:
 * - cardOrder cambia (nunca durante gameplay)
 * - isProcessing cambia (al voltear 2 cards)
 * - Una card individual cambia (flip/match)
 */
const CardsGridComponent = ({ onCardClick, disabled = false }: CardsGridProps) => {
  const cardOrder = useCardOrder();
  const isProcessing = useIsProcessing();

  // Calcular movesLeft desde el store sin crear suscripción reactiva
  const movesLeft = useMemoStore((state) => {
    const config = memoService.getConfig();
    return config.maxMoves - state.stats.movesUsed;
  });

  const isDisabled = disabled || isProcessing || movesLeft === 0;

  return (
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
