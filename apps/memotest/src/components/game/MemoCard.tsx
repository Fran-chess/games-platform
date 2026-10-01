/**
 * MemoCard - Carta del tablero.
 * El giro, la sacudida y el toque son CSS (clases .flip-card y .memo-card en globals.css):
 * solo transform, resuelto por el compositor. La carta se suscribe únicamente a su propio
 * estado, así un toque vuelve a dibujar una sola carta.
 * @module MemoCard
 */

'use client';

import { memo } from 'react';
import {
  useCardFlipped,
  useCardIcon,
  useCardMatched,
  useCardMismatched,
  useMemoStore,
} from '@/store/memoStore';
import { CardIcon } from './cardIcons';

interface MemoCardProps {
  cardId: string;
}

export const MemoCard = memo(function MemoCard({ cardId }: MemoCardProps) {
  const isFlipped = useCardFlipped(cardId);
  const isMatched = useCardMatched(cardId);
  const isMismatched = useCardMismatched(cardId);
  const icon = useCardIcon(cardId);

  const state = isMatched ? 'matched' : isFlipped ? 'flipped' : 'hidden';

  return (
    <button
      type="button"
      className="flip-card memo-card aspect-[3/4]"
      data-testid="memo-card"
      data-state={state}
      data-flipped={state !== 'hidden'}
      data-mismatch={isMismatched}
      data-icon={icon}
      aria-label={state === 'hidden' ? 'Carta boca abajo' : `Carta: ${icon}`}
      onClick={() => useMemoStore.getState().flipCard(cardId)}
    >
      <span className="flip-card__inner">
        {/* Dorso: logo institucional */}
        <span className="flip-card__face bg-white/10 ring-1 ring-inset ring-white/20 shadow-md">
          <img src="/images/8.svg" alt="" className="w-[70%] h-[70%] object-contain opacity-80" />
        </span>

        {/* Frente: ícono. Sobre el degradado verde de la carta emparejada va en verde muy oscuro
            (contraste 4:1 o más en todo el degradado); el blanco y el azul de marca bajan
            de 3:1 en alguno de sus extremos. */}
        <span
          className={`flip-card__face flip-card__face--front shadow-md ${
            isMatched
              ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-emerald-950'
              : 'bg-white text-[#0435A3]'
          }`}
        >
          {icon && <CardIcon id={icon} className="w-[78%] h-auto" />}

          {isMatched && (
            <span className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-emerald-600 shadow-md">
              ✓
            </span>
          )}
        </span>
      </span>
    </button>
  );
});
