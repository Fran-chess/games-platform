/**
 * PrizePhase - Selección de premio: tres cartas, una sola con premio.
 * Dibuja el estado del store; la secuencia (elegir, revelar, resultado) la conduce memoStore.
 * @module PrizePhase
 */

'use client';

import type { CSSProperties } from 'react';
import { MassiveConfetti } from '@games-platform/ui';
import {
  useMemoStore,
  usePrizeCards,
  usePrizeStage,
  useSelectedPrizeId,
  useShowConfetti,
} from '@/store/memoStore';
import { PRIZE_FLIP_MS } from '@/services/game/memoService';
import { EndPanel } from './EndPanel';

/** Giro más lento que el de las cartas del tablero: es el momento de suspenso */
const PRIZE_GRID_STYLE = { '--flip-ms': `${PRIZE_FLIP_MS}ms`, '--card-radius': '1.5rem' } as CSSProperties;

/** En la tablet (1280×800) el confetti completo de MassiveConfetti es más de lo que hace falta */
const CONFETTI_DENSITY = 0.6;

function PrizeChoice() {
  const prizeCards = usePrizeCards();
  const selectedPrizeId = useSelectedPrizeId();
  const prizeStage = usePrizeStage();
  const hasChosen = selectedPrizeId !== null;

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="enter-up text-7xl lg:text-8xl font-black tracking-tight mb-16 bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
        ¡Felicitaciones!
      </h1>

      <div className="grid grid-cols-3 gap-20 md:gap-28 w-full max-w-[85vw]" style={PRIZE_GRID_STYLE}>
        {prizeCards.map((card, index) => {
          const isSelected = selectedPrizeId === card.id;
          const isShownAsWinner = prizeStage === 'winner-shown' && card.hasPrize;
          const isFaceUp = isSelected || isShownAsWinner;
          const isDimmed = hasChosen && !isFaceUp;

          return (
            <div
              key={card.id}
              className="enter-up flex flex-col items-center gap-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-full aspect-[2/3]">
                <button
                  type="button"
                  data-testid="prize-card"
                  className={`flip-card prize-card ${isFaceUp ? 'scale-105' : ''} ${isDimmed ? 'opacity-40' : ''}`}
                  data-flipped={isFaceUp}
                  disabled={hasChosen}
                  aria-label="Carta de premio"
                  onClick={() => useMemoStore.getState().pickPrizeCard(card.id)}
                >
                  <span className="flip-card__inner">
                    {/* Dorso */}
                    <span className="flip-card__face bg-white/10 ring-2 ring-inset ring-cyan-400/50 shadow-lg p-8">
                      <img src="/images/8.svg" alt="" className="w-full h-full object-contain" draggable={false} />
                    </span>

                    {/* Frente */}
                    {card.hasPrize ? (
                      <span className="flip-card__face flip-card__face--front bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 ring-2 ring-inset ring-emerald-300/60 shadow-lg p-8">
                        <img src="/images/13.svg" alt="¡Ganaste!" className="w-[90%] h-[90%] object-contain" draggable={false} />
                      </span>
                    ) : (
                      <span className="flip-card__face flip-card__face--front flex-col gap-6 bg-gradient-to-br from-cyan-100 via-blue-100 to-teal-100 ring-2 ring-inset ring-cyan-400/70 shadow-lg p-8">
                        <img src="/images/8.svg" alt="" className="w-28 h-28 object-contain" draggable={false} />
                        <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight text-center">
                          Seguí
                          <br />
                          participando
                        </span>
                        <span className="text-4xl">💪</span>
                      </span>
                    )}
                  </span>
                </button>
              </div>

              <p
                className={`text-sm font-bold tracking-wide transition-colors duration-200 ${
                  isSelected
                    ? 'text-cyan-200'
                    : isShownAsWinner
                      ? 'text-emerald-300'
                      : hasChosen
                        ? 'text-white/40'
                        : 'text-white'
                }`}
              >
                {isSelected ? 'Revelando...' : isShownAsWinner ? 'Aquí estaba el premio' : 'Tócala para revelar'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PrizePhase() {
  const prizeStage = usePrizeStage();
  const showConfetti = useShowConfetti();
  const hasPrize = useMemoStore(
    (state) => state.prizeCards.find((card) => card.id === state.selectedPrizeId)?.hasPrize ?? false
  );

  return (
    <div className="h-full p-8 lg:p-12 flex flex-col items-center justify-center bg-black/40">
      {prizeStage === 'result' ? (
        <div data-testid="prize-result" className="w-full flex justify-center">
          <EndPanel hasPrize={hasPrize} />
        </div>
      ) : (
        <PrizeChoice />
      )}

      {showConfetti && <MassiveConfetti show density={CONFETTI_DENSITY} />}
    </div>
  );
}
