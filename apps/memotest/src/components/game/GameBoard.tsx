/**
 * GameBoard - Tablero único de la partida.
 * Vive desde que arranca la partida hasta que termina: las 12 cartas se montan una sola vez
 * y entre fases solo cambia el HUD. El HUD tiene altura fija para que el tablero no se mueva.
 * @module GameBoard
 */

'use client';

import { memo, useEffect, type CSSProperties } from 'react';
import { preloadConfetti } from '@games-platform/ui';
import TimerCircle from '@/components/ui/TimerCircle';
import {
  useCardOrder,
  useIsBoardLocked,
  useMatchesFound,
  useMovesUsed,
  useTimeLeft,
  type GameState,
} from '@/store/memoStore';
import { FLIP_MS, GAME_CONFIG } from '@/services/game/memoService';
import { MemoCard } from './MemoCard';

/** Fases en las que el tablero está en pantalla */
type BoardPhase = Extract<GameState, 'ready' | 'memorizing' | 'playing' | 'success'>;

interface PhaseProps {
  phase: BoardPhase;
}

/** El CSS del giro toma su duración de acá: la misma constante que usa el store para esperar */
const BOARD_STYLE = { '--flip-ms': `${FLIP_MS}ms` } as CSSProperties;

const HUD_TEXT: Record<BoardPhase, { title: string; subtitle: string }> = {
  ready: {
    title: '¡Atención!',
    subtitle: 'Vas a ver las cartas por unos segundos',
  },
  memorizing: {
    title: '¡Memoriza las cartas!',
    subtitle: 'Recuerda la posición de cada símbolo',
  },
  playing: {
    title: `Encuentra ${GAME_CONFIG.requiredPairs} pares`,
    subtitle: `Tienes ${GAME_CONFIG.maxMoves} intentos`,
  },
  success: {
    title: '¡Lo lograste!',
    subtitle: 'Ahora elige tu premio',
  },
};

/**
 * Reloj del HUD. Es el único componente suscripto al tiempo: el tick de cada segundo
 * no vuelve a dibujar nada más.
 */
function HudTimer({ phase }: PhaseProps) {
  const timeLeft = useTimeLeft();
  const isMemorizing = phase === 'ready' || phase === 'memorizing';

  return (
    <TimerCircle
      seconds={timeLeft}
      totalSeconds={isMemorizing ? GAME_CONFIG.memorizationTime : GAME_CONFIG.gameTime}
      isUrgent={phase === 'playing' && timeLeft <= GAME_CONFIG.urgentTime}
      size={80}
    />
  );
}

function HudStat({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-[120px] rounded-xl bg-white/10 ring-1 ring-white/20 px-5 py-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/85">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function HudStats() {
  const movesLeft = GAME_CONFIG.maxMoves - useMovesUsed();
  const matchesFound = useMatchesFound();
  const movesTone = movesLeft === 0 ? 'text-red-300' : movesLeft === 1 ? 'text-amber-300' : 'text-white';

  return (
    <>
      <HudStat label="Intentos" value={`${movesLeft}/${GAME_CONFIG.maxMoves}`} tone={movesTone} />
      <HudStat label="Pares" value={`${matchesFound}/${GAME_CONFIG.requiredPairs}`} />
    </>
  );
}

function BoardHud({ phase }: PhaseProps) {
  const { title, subtitle } = HUD_TEXT[phase];

  return (
    <div className="max-w-[92vw] mx-auto mb-6 w-full h-28 shrink-0 rounded-2xl bg-slate-900/40 ring-1 ring-white/15 px-6 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">{title}</h2>
        <p className="text-base font-medium text-white/85 mt-1">{subtitle}</p>
      </div>

      <HudStats />
      <HudTimer phase={phase} />
    </div>
  );
}

/**
 * Grilla de cartas. Memoizada y sin props: no se vuelve a dibujar cuando cambia la fase,
 * y cada carta se suscribe solo a su propio estado.
 */
const CardGrid = memo(function CardGrid() {
  const cardOrder = useCardOrder();

  return (
    <div className="grid grid-cols-6 grid-rows-2 gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10 w-full">
      {cardOrder.map((cardId) => (
        <div key={cardId} className="aspect-[3/4]">
          <MemoCard cardId={cardId} />
        </div>
      ))}
    </div>
  );
});

export function GameBoard({ phase }: PhaseProps) {
  const isBoardLocked = useIsBoardLocked();

  // El confetti se descarga recién al usarse. Se pide mientras se juega para que,
  // si el jugador gana, no dependa de la red del evento en ese momento.
  useEffect(() => {
    preloadConfetti();
  }, []);

  return (
    <div
      className="game-board h-full p-8 lg:p-12 flex flex-col"
      data-locked={isBoardLocked}
      style={BOARD_STYLE}
    >
      <BoardHud phase={phase} />

      <div className="max-w-[92vw] mx-auto flex-1 flex items-center justify-center w-full">
        <CardGrid />
      </div>
    </div>
  );
}
