/**
 * Hook personalizado para gestionar audio del MemoTest
 * @module useMemoAudio
 */

import { useCallback, useEffect } from 'react';
import { audioService, SoundType } from '@/services/audio/audioService';
import { useSoundEnabled } from '@/store/memoStore';

export function useMemoAudio() {
  const soundEnabled = useSoundEnabled();

  // Inicializar contexto de audio en la primera interacción
  useEffect(() => {
    const initAudio = async () => {
      await audioService.resumeContext();
    };

    // Escuchar primer click/touch del usuario
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Sonido de flip (voltear carta)
  const playFlip = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playSound(SoundType.SELECT);
  }, [soundEnabled]);

  // Sonido de match exitoso
  const playMatch = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playCustomSound({
      frequency: 880,
      duration: 150,
      volume: 0.4,
      type: 'sine',
      fadeOut: true,
    });
  }, [soundEnabled]);

  // Sonido de error (sin match)
  const playError = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playSound(SoundType.ERROR);
  }, [soundEnabled]);

  // Sonido de victoria
  const playVictory = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playVictorySound();
  }, [soundEnabled]);

  // Sonido de derrota
  const playDefeat = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playDefeatSound();
  }, [soundEnabled]);

  // Sonido de countdown (últimos segundos)
  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playSound(SoundType.TICK);
  }, [soundEnabled]);

  // Sonido de selección de premio
  const playPrizeSelect = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playCustomSound({
      frequency: 1200,
      duration: 200,
      volume: 0.5,
      type: 'sine',
      fadeOut: true,
    });
  }, [soundEnabled]);

  // Sonido de premio ganado
  const playPrizeWin = useCallback(() => {
    if (!soundEnabled) return;
    // Melodía especial para premio
    const notes = [523, 659, 784, 1047, 1319]; // C, E, G, C, E (octava superior)
    audioService.playMelody(notes, 120, 40);
  }, [soundEnabled]);

  // Sonido de inicio de fase
  const playPhaseStart = useCallback(() => {
    if (!soundEnabled) return;
    audioService.playSound(SoundType.SUCCESS);
  }, [soundEnabled]);

  return {
    playFlip,
    playMatch,
    playError,
    playVictory,
    playDefeat,
    playTick,
    playPrizeSelect,
    playPrizeWin,
    playPhaseStart,
  };
}