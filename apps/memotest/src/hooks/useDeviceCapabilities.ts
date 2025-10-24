/**
 * Hook para detectar capacidad de hardware y adaptar features
 * Degrada efectos en dispositivos de baja gama
 */

import { useMemo } from 'react';

export interface DeviceCapabilities {
  isLowEnd: boolean;
  shouldReduceEffects: boolean;
  shouldReduceAnimations: boolean;
  confettiPieces: number;
}

export function useDeviceCapabilities(): DeviceCapabilities {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isLowEnd: false,
        shouldReduceEffects: false,
        shouldReduceAnimations: false,
        confettiPieces: 150,
      };
    }

    // Detectar prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detectar hardware limitado
    const nav = navigator as any;
    const deviceMemory = nav.deviceMemory || 8; // GB, default 8 si no disponible
    const hardwareConcurrency = nav.hardwareConcurrency || 4; // Cores, default 4

    // Dispositivo de baja gama: ≤4GB RAM o ≤4 cores
    const isLowEnd = deviceMemory <= 4 || hardwareConcurrency <= 4;

    // Reducir efectos si: low-end O prefers-reduced-motion
    const shouldReduceEffects = isLowEnd || prefersReducedMotion;

    return {
      isLowEnd,
      shouldReduceEffects,
      shouldReduceAnimations: prefersReducedMotion,
      // Confetti: Low-end: 50, Mid: 100, High: 150
      confettiPieces: isLowEnd ? 50 : 100,
    };
  }, []);
}
