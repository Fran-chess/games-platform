/**
 * EndPanel - Mensaje final y acciones, compartido por Premio y Derrota.
 * @module EndPanel
 */

'use client';

import { useMemoStore } from '@/store/memoStore';

interface EndPanelProps {
  /** El jugador ganó el premio: cambia el logo y el mensaje */
  hasPrize: boolean;
}

function handlePlayAgain() {
  useMemoStore.getState().startGame();
}

function handleBackToStart() {
  useMemoStore.getState().resetGame();
}

export function EndPanel({ hasPrize }: EndPanelProps) {
  return (
    <div className="enter-up w-full max-w-3xl rounded-3xl bg-slate-900/50 ring-1 ring-white/25 shadow-lg p-12 flex flex-col items-center text-center gap-8">
      <img
        src={hasPrize ? '/images/13.svg' : '/images/8.svg'}
        alt="DarSalud"
        className="w-28 h-28 object-contain"
        draggable={false}
      />

      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white tracking-tight">
          {hasPrize ? '¡Felicitaciones!' : '¡Gracias por jugar!'}
        </h1>

        <p className="text-xl font-semibold text-white/90 max-w-xl">
          {hasPrize
            ? 'Ganaste un premio. Acércate al stand de DarSalud para reclamarlo.'
            : 'Te agradecemos por participar en esta actividad de DarSalud.'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 w-full">
        <button
          type="button"
          data-testid="play-again"
          onClick={handlePlayAgain}
          className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-10 py-4 rounded-2xl text-xl font-black shadow-lg border border-white/30 min-h-[60px] flex-1 max-w-xs transition-transform duration-100 active:scale-95"
        >
          🔄 Jugar de Nuevo
        </button>

        <button
          type="button"
          data-testid="back-to-start"
          onClick={handleBackToStart}
          className="text-white px-10 py-4 rounded-2xl text-xl font-bold border border-white/50 min-h-[60px] flex-1 max-w-xs transition-transform duration-100 active:scale-95"
        >
          🏠 Volver al Inicio
        </button>
      </div>
    </div>
  );
}
