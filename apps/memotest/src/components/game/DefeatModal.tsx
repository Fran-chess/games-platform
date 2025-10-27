/**
 * DefeatModal Component
 * Modal renderizado en portal con blur optimizado
 * @module DefeatModal
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useStats, useMemoStore } from '@/store/memoStore';
import { memoService } from '@/services/game/memoService';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { phaseTransition, phaseTransitionReduced } from '@/utils/transitions';

interface DefeatModalProps {
  reason?: 'max_moves' | 'time_up';
}

export function DefeatModal({ reason = 'max_moves' }: DefeatModalProps) {
  const stats = useStats();
  const { resetGame } = useMemoStore();

  const config = memoService.getConfig();
  const prefersReducedMotion = useReducedMotion();
  const { shouldReduceEffects } = useDeviceCapabilities();
  const [mounted, setMounted] = useState(false);

  // Asegurar que el portal solo se renderiza en el cliente
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Seleccionar transición según device capabilities
  const transition = (prefersReducedMotion || shouldReduceEffects)
    ? phaseTransitionReduced
    : phaseTransition;

  const handlePlayAgain = useCallback(() => {
    // Reiniciar el juego desde el principio (volver a mezclar)
    const { restartGame } = useMemoStore.getState();
    restartGame();
  }, []);

  const handleBackToStart = useCallback(() => {
    // Volver a la pantalla de espera
    resetGame();
  }, [resetGame]);

  const getMessage = () => {
    if (reason === 'time_up') {
      return {
        title: '¡Se acabó el tiempo!',
        subtitle: 'Necesitabas más tiempo para completar el desafío',
        icon: '⏰'
      };
    }
    return {
      title: '¡Casi lo logras!',
      subtitle: `Usaste todos tus ${config.maxMoves} movimientos`,
      icon: '😔'
    };
  };

  const message = getMessage();

  // No renderizar en SSR
  if (!mounted) return null;

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      {/* Backdrop - UN SOLO blur optimizado */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      />

      {/* Card principal - SIN blur adicional */}
      <motion.div
        className="relative bg-white/15 rounded-3xl shadow-[0_12px_48px_rgba(6,182,212,0.3)] p-12 max-w-3xl w-full ring-2 ring-white/30 overflow-hidden"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={transition}
        layout={false}
      >
        {/* Brillo superior */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none rounded-3xl" />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          {/* Logo institucional */}
          <motion.div
            className="w-32 h-32"
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            <img
              src="/images/8.svg"
              alt="DarSalud"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Mensaje de agradecimiento */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">
              ¡Gracias por jugar!
            </h1>

            <p className="text-2xl font-semibold text-white/90 drop-shadow-md max-w-xl">
              Te agradecemos por participar en esta actividad de DarSalud.
            </p>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            className="flex items-center justify-center gap-6 pt-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {/* Botón primario - Volver a jugar */}
            <motion.button
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-teal-500 text-white px-10 py-4 rounded-2xl text-xl font-black shadow-[0_8px_32px_rgba(6,182,212,0.4)] border-2 border-white/40 min-h-[60px] flex-1 max-w-xs"
              whileTap={{ scale: 0.96 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 12px 40px rgba(6,182,212,0.6)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              🔄 Jugar de Nuevo
            </motion.button>

            {/* Botón secundario - Volver al inicio */}
            <motion.button
              onClick={handleBackToStart}
              className="bg-transparent text-white px-10 py-4 rounded-2xl text-xl font-bold border-2 border-white/60 hover:bg-white/10 min-h-[60px] flex-1 max-w-xs"
              whileTap={{ scale: 0.96 }}
              whileHover={{
                scale: 1.02,
                borderColor: "rgba(255,255,255,0.8)",
                backgroundColor: "rgba(255,255,255,0.15)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              🏠 Volver al Inicio
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}