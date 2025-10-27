/**
 * PrizePhase Component - Optimizado
 * Confetti controlado + Animaciones celebratorias + Exit coordinado
 * @module PrizePhase
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePrizeCards, useMemoStore } from '@/store/memoStore';
import { MassiveConfetti } from '@games-platform/ui';
import { useMemoAudio } from '@/hooks/useMemoAudio';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { phaseTransitionCelebration, phaseTransitionReduced } from '@/utils/transitions';

export function PrizePhase() {
  const prizeCards = usePrizeCards();
  const { resetGame } = useMemoStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealWinningCard, setRevealWinningCard] = useState(false);

  const selectedCard = prizeCards.find(c => c.id === selectedCardId);
  const { playPrizeSelect, playPrizeWin } = useMemoAudio();

  const prefersReducedMotion = useReducedMotion();
  const { shouldReduceEffects } = useDeviceCapabilities();

  // Transición celebratoria para victoria (o reducida si es necesario)
  const transition = (prefersReducedMotion || shouldReduceEffects)
    ? phaseTransitionReduced
    : phaseTransitionCelebration;

  const handleCardClick = useCallback((cardId: string) => {
    if (selectedCardId) return;

    playPrizeSelect();
    setSelectedCardId(cardId);

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    setTimeout(() => {
      const card = prizeCards.find(c => c.id === cardId);
      if (card?.hasPrize) {
        playPrizeWin();

        // Confetti siempre visible cuando gana
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000); // 4 segundos

        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }

        setShowResult(true);
      } else {
        setTimeout(() => {
          setRevealWinningCard(true);
          setTimeout(() => {
            setShowResult(true);
          }, 1500);
        }, 1500);
      }
    }, 1200);
  }, [selectedCardId, prizeCards, playPrizeSelect, playPrizeWin, prefersReducedMotion]);

  const handlePlayAgain = useCallback(() => {
    // Reiniciar el juego desde el principio (volver a mezclar)
    const { restartGame } = useMemoStore.getState();
    restartGame();
  }, []);

  return (
    <motion.div
      className="h-screen p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={transition}
      layout={false}
    >
      {/* Fondo con overlay optimizado */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-[92vw]">
        {!showResult ? (
          // Selección de carta
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {/* Encabezado simplificado */}
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h1 className="text-7xl lg:text-8xl font-black tracking-tight mb-4 bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
                ¡Felicitaciones!
              </h1>
            </motion.div>

            {/* Grid de 3 cartas - Animaciones simplificadas */}
            <div className="grid grid-cols-3 gap-20 md:gap-28 w-full max-w-[85vw]">
              {prizeCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative aspect-[2/3] flex flex-col items-center"
                  initial={{ opacity: 0, y: 40, scale: 0.85 }}
                  animate={{
                    opacity: (selectedCardId && selectedCardId !== card.id && !(revealWinningCard && card.hasPrize)) ? 0.4 : 1,
                    y: 0,
                    scale: (selectedCardId === card.id || (revealWinningCard && card.hasPrize)) ? 1.05 : 1,
                  }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.3,
                    ease: 'easeOut'
                  }}
                >
                  {/* Card interactiva - Sin 3D pesado */}
                  <motion.div
                    className={`
                      relative w-full h-full rounded-3xl cursor-pointer
                      flex items-center justify-center min-h-[44px] min-w-[44px]
                      ${selectedCardId && selectedCardId !== card.id && !(revealWinningCard && card.hasPrize) ? 'pointer-events-none grayscale' : ''}
                    `}
                    onClick={() => handleCardClick(card.id)}
                    whileTap={!selectedCardId ? { scale: 0.95 } : {}}
                    animate={{
                      rotateY: (selectedCardId === card.id || (revealWinningCard && card.hasPrize)) ? 180 : 0,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0.2 : 0.8,
                      ease: 'easeOut'
                    }}
                    style={{
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Parte trasera - Optimizada */}
                    <div
                      className="absolute inset-0 rounded-3xl backface-hidden overflow-hidden bg-white/10 backdrop-blur-md border-2 border-cyan-400/50 shadow-lg"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* Logo DarSalud centrado */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                          <img
                            src="/images/8.svg"
                            alt="DarSalud Logo"
                            className="w-full h-full object-contain select-none pointer-events-none"
                            draggable={false}
                          />
                        </div>

                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none" />
                    </div>

                    {/* Parte frontal - Optimizada */}
                    <div
                      className="absolute inset-0 rounded-3xl backface-hidden overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      {card.hasPrize ? (
                        // Carta GANADORA
                        <div className="relative w-full h-full bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-teal-600/95 rounded-3xl border-2 border-emerald-300/60 shadow-lg">
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center p-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                          >
                            <img
                              src="/images/13.svg"
                              alt="¡Ganaste!"
                              className="w-[90%] h-[90%] object-contain select-none pointer-events-none"
                              draggable={false}
                            />
                          </motion.div>

                          <div className="absolute inset-0 bg-white/10 rounded-3xl pointer-events-none" />
                        </div>
                      ) : (
                        // Carta PERDEDORA
                        <div className="relative w-full h-full bg-gradient-to-br from-cyan-100/95 via-blue-100/95 to-teal-100/95 rounded-3xl border-2 border-cyan-400/70 shadow-lg">
                          {/* Texto "Seguí participando" */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-6">
                            <motion.div
                              className="relative w-40 h-40"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/30" />
                              <div className="absolute inset-0 flex items-center justify-center p-8">
                                <img
                                  src="/images/8.svg"
                                  alt="DarSalud"
                                  className="w-full h-full object-contain select-none pointer-events-none"
                                  draggable={false}
                                />
                              </div>
                            </motion.div>

                            <div className="text-center">
                              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                Seguí<br />participando
                              </h3>
                            </div>

                            <div className="text-4xl">💪</div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Label */}
                  <motion.p
                    className={`mt-4 text-sm font-bold tracking-wide transition-colors duration-200 ${
                      selectedCardId === card.id
                        ? 'text-cyan-200'
                        : (revealWinningCard && card.hasPrize)
                          ? 'text-emerald-300'
                          : selectedCardId
                            ? 'text-white/40'
                            : 'text-white'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (index * 0.1) + 0.2 }}
                  >
                    {selectedCardId === card.id
                      ? 'Revelando...'
                      : (revealWinningCard && card.hasPrize)
                        ? 'Aquí estaba el premio'
                        : 'Tócala para revelar'}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          // Pantalla final optimizada
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center px-6 w-full max-w-3xl mx-auto"
          >
            {/* Card principal optimizada */}
            <motion.div
              className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-lg p-12 w-full border border-white/25 overflow-hidden"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl" />

              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center text-center gap-8">
                <motion.div
                  className="w-28 h-28"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <img
                    src={selectedCard?.hasPrize ? "/images/13.svg" : "/images/8.svg"}
                    alt="DarSalud"
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    {selectedCard?.hasPrize ? '¡Felicitaciones!' : '¡Gracias por jugar!'}
                  </h1>

                  <p className="text-xl font-semibold text-white/90 max-w-xl">
                    {selectedCard?.hasPrize
                      ? 'Ganaste un premio. Acércate al stand de DarSalud para reclamarlo.'
                      : 'Te agradecemos por participar en esta actividad de DarSalud.'
                    }
                  </p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 w-full">
                  <motion.button
                    onClick={handlePlayAgain}
                    className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-10 py-4 rounded-2xl text-xl font-black shadow-lg border border-white/30 min-h-[60px] flex-1 max-w-xs"
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    🔄 Jugar de Nuevo
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      if ('vibrate' in navigator) navigator.vibrate(20);
                      resetGame();
                    }}
                    className="bg-transparent text-white px-10 py-4 rounded-2xl text-xl font-bold border border-white/50 hover:bg-white/10 min-h-[60px] flex-1 max-w-xs backdrop-blur-sm"
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    🏠 Volver al Inicio
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Confetti cuando gana */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <MassiveConfetti
            show={true}
            windowSize={{
              width: typeof window !== 'undefined' ? window.innerWidth : 1920,
              height: typeof window !== 'undefined' ? window.innerHeight : 1080
            }}
          />
        </div>
      )}
    </motion.div>
  );
}