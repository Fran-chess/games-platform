/**
 * MemoGame - Elige qué pantalla mostrar según la fase del juego.
 * La secuencia de la partida la conduce el store (memoStore): acá no hay timers ni efectos.
 * @module MemoGame
 */

'use client';

import { useGameState, useMemoStore } from '@/store/memoStore';
import { audioService } from '@/services/audio/audioService';
import { WaitingScreen } from './WaitingScreen';
import { GameBoard } from './GameBoard';
import { PrizePhase } from './PrizePhase';
import { DefeatScreen } from './DefeatScreen';

function handleStart() {
  // El toque inicial es el gesto de usuario que el navegador exige para habilitar el audio
  audioService.unlock();
  useMemoStore.getState().startGame();
}

function handlePointerDown() {
  useMemoStore.getState().keepAlive();
}

export function MemoGame() {
  const gameState = useGameState();

  if (gameState === 'waiting') {
    return <WaitingScreen onStart={handleStart} />;
  }

  return (
    <div
      data-testid="game"
      data-phase={gameState}
      className="h-full"
      onPointerDown={handlePointerDown}
    >
      {gameState === 'prize' ? (
        <PrizePhase />
      ) : gameState === 'failed' ? (
        <DefeatScreen />
      ) : (
        <GameBoard phase={gameState} />
      )}
    </div>
  );
}
