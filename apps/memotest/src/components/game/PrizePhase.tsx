/**
 * PrizePhase Component
 * Fase de selección de premio - 3 cartas misteriosas
 * @module PrizePhase
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrizeCards, useStats, useMemoStore } from '@/store/memoStore';
import { MassiveConfetti } from '@games-platform/ui';
import { useMemoAudio } from '@/hooks/useMemoAudio';

export function PrizePhase() {
  const prizeCards = usePrizeCards();
  const stats = useStats();
  const { resetGame } = useMemoStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCardConfetti, setShowCardConfetti] = useState(false);
  const [revealWinningCard, setRevealWinningCard] = useState(false);

  const selectedCard = prizeCards.find(c => c.id === selectedCardId);
  const { playPrizeSelect, playPrizeWin } = useMemoAudio();

  const handleCardClick = useCallback((cardId: string) => {
    if (selectedCardId) return; // Ya seleccionó una

    playPrizeSelect();
    setSelectedCardId(cardId);

    // Haptic feedback si está disponible
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    // Esperar animación y mostrar resultado
    setTimeout(() => {
      const card = prizeCards.find(c => c.id === cardId);
      if (card?.hasPrize) {
        playPrizeWin();
        // Confeti breve en el área de la card (≤900ms)
        setShowCardConfetti(true);
        setTimeout(() => setShowCardConfetti(false), 900);

        // Haptic de victoria
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }

        // Mostrar pantalla final inmediatamente si ganó
        setShowResult(true);
      } else {
        // Si perdió, revelar la card ganadora después de 1.5 segundos
        setTimeout(() => {
          setRevealWinningCard(true);

          // Mostrar pantalla final 1.5 segundos después de revelar la ganadora
          setTimeout(() => {
            setShowResult(true);
          }, 1500);
        }, 1500);
      }
    }, 1500);
  }, [selectedCardId, prizeCards, playPrizeSelect, playPrizeWin]);

  const handlePlayAgain = useCallback(() => {
    // Reiniciar el juego desde el principio (volver a mezclar)
    const { restartGame } = useMemoStore.getState();
    restartGame();
  }, []);

  return (
    <div className="h-screen p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Fondo con overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-[92vw]">
        <AnimatePresence mode="wait">
          {!showResult ? (
            // Selección de carta
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Encabezado corporativo con aura */}
              <motion.div
                className="text-center mb-24"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {/* Aura suave detrás del título */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-purple-500/40 rounded-full scale-150" />

                  <h1 className="relative text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4 bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
                    ¡Felicitaciones!
                  </h1>
                </div>

              </motion.div>

              {/* Grid de 3 cartas misteriosas mejorado */}
              <div className="grid grid-cols-3 gap-20 md:gap-28 w-full max-w-[85vw]">
                {prizeCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="relative aspect-[2/3] flex flex-col items-center"
                    initial={{ opacity: 0, y: 60, scale: 0.75, rotateY: -30 }}
                    animate={{
                      opacity: (selectedCardId && selectedCardId !== card.id && !(revealWinningCard && card.hasPrize)) ? 0.4 : 1,
                      y: 0,
                      scale: (selectedCardId === card.id || (revealWinningCard && card.hasPrize)) ? 1.08 : 1,
                      rotateY: 0
                    }}
                    transition={{
                      delay: index * 0.15,
                      type: 'spring',
                      stiffness: 240,
                      damping: 22,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                  >
                    {/* Card interactiva con animación 3D profesional */}
                    <motion.div
                      className={`
                        relative w-full h-full rounded-3xl cursor-pointer
                        flex items-center justify-center min-h-[44px] min-w-[44px]
                        ${selectedCardId && selectedCardId !== card.id && !(revealWinningCard && card.hasPrize) ? 'pointer-events-none grayscale' : ''}
                      `}
                      onClick={() => handleCardClick(card.id)}
                      whileTap={!selectedCardId ? { scale: 0.92 } : {}}
                      whileHover={!selectedCardId ? {
                        scale: 1.03,
                        y: -8,
                        filter: 'brightness(1.1)'
                      } : {}}
                      animate={{
                        rotateY: (selectedCardId === card.id || (revealWinningCard && card.hasPrize)) ? 180 : 0,
                      }}
                      transition={{
                        rotateY: {
                          duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94] // easeOutCubic suave
                        },
                        scale: { duration: 0.2 },
                        y: { duration: 0.3 },
                        filter: { duration: 0.2 }
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                        perspective: '1000px'
                      }}
                    >
                      {/* Parte trasera - Glass style con glow al tap */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl backface-hidden overflow-hidden bg-white/15 backdrop-blur-sm border-4 border-cyan-400/60 shadow-2xl"
                        style={{ backfaceVisibility: 'hidden' }}
                        animate={!selectedCardId ? {
                          boxShadow: [
                            '0 20px 60px rgba(6, 182, 212, 0.3)',
                            '0 20px 80px rgba(6, 182, 212, 0.5)',
                            '0 20px 60px rgba(6, 182, 212, 0.3)'
                          ]
                        } : {}}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.4,
                          ease: "easeInOut"
                        }}
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

                        {/* Brillo superior elegante */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-3xl pointer-events-none" />

                        {/* Borde interno decorativo */}
                        <div className="absolute inset-3 rounded-2xl border border-white/20 pointer-events-none" />
                      </motion.div>

                      {/* Parte frontal (premio revelado) - Diseño profesional */}
                      <div
                        className="absolute inset-0 rounded-3xl backface-hidden overflow-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        {card.hasPrize ? (
                          // Carta GANADORA con logo 13.svg
                          <motion.div
                            className="relative w-full h-full bg-gradient-to-br from-emerald-400/95 via-green-500/95 to-teal-600/95 rounded-3xl border-4 border-emerald-300/70 shadow-[0_12px_48px_rgba(16,185,129,0.5)]"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.4, type: 'spring', stiffness: 300 }}
                          >
                            {/* Logo verde 13.svg */}
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center p-8"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8, duration: 0.5, type: 'spring', stiffness: 200 }}
                            >
                              <img
                                src="/images/13.svg"
                                alt="¡Ganaste!"
                                className="w-[90%] h-[90%] object-contain select-none pointer-events-none drop-shadow-2xl"
                                draggable={false}
                              />
                            </motion.div>

                            {/* Glow pulsante */}
                            <motion.div
                              className="absolute inset-0 bg-white/20 rounded-3xl pointer-events-none"
                              animate={{ opacity: [0.2, 0.4, 0.2] }}
                              transition={{ duration: 2, repeat: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Infinity, ease: "easeInOut" }}
                            />

                            {/* Borde interno decorativo */}
                            <div className="absolute inset-3 rounded-2xl border-2 border-white/30 pointer-events-none" />
                          </motion.div>
                        ) : (
                          // Carta PERDEDORA con texto "Seguí participando"
                          <motion.div
                            className="relative w-full h-full bg-gradient-to-br from-cyan-100/95 via-blue-100/95 to-teal-100/95 rounded-3xl border-4 border-cyan-400/80 shadow-2xl"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.4, type: 'spring', stiffness: 300 }}
                          >
                            {/* Texto "Seguí participando" */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-6">
                              {/* Logo DarSalud con círculo decorativo */}
                              <motion.div
                                className="relative w-48 h-48"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.4 }}
                              >
                                {/* Círculo de fondo con gradiente */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200/40 via-blue-200/40 to-teal-200/40 shadow-lg" />

                                {/* Borde decorativo del círculo */}
                                <div className="absolute inset-2 rounded-full border-2 border-cyan-300/50" />

                                {/* Logo */}
                                <div className="absolute inset-0 flex items-center justify-center p-8">
                                  <img
                                    src="/images/8.svg"
                                    alt="DarSalud"
                                    className="w-full h-full object-contain select-none pointer-events-none"
                                    draggable={false}
                                  />
                                </div>
                              </motion.div>

                              {/* Texto principal */}
                              <motion.div
                                className="text-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, duration: 0.5, type: 'spring', stiffness: 200 }}
                              >
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                                  Seguí<br />participando
                                </h3>
                              </motion.div>

                              {/* Emoji decorativo */}
                              <motion.div
                                className="text-5xl"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.1, duration: 0.4 }}
                              >
                                💪
                              </motion.div>
                            </div>

                            {/* Sombra interna para profundidad */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none" />

                            {/* Borde interno */}
                            <div className="absolute inset-3 rounded-2xl border-2 border-cyan-300/50 pointer-events-none" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Microtexto debajo de la card con contraste AA */}
                    <motion.p
                      className={`mt-4 text-base font-bold tracking-wide transition-colors duration-300 drop-shadow-md ${
                        selectedCardId === card.id
                          ? 'text-cyan-200'
                          : (revealWinningCard && card.hasPrize)
                            ? 'text-emerald-300'
                            : selectedCardId
                              ? 'text-white/40'
                              : 'text-white'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index * 0.15) + 0.3 }}
                      style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
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
            // Pantalla final simple - Agradecimiento con dos opciones
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center justify-center px-6 w-full max-w-3xl mx-auto"
            >
              {/* Card glass principal */}
              <motion.div
                className="relative bg-white/15 backdrop-blur-xl rounded-3xl shadow-[0_12px_48px_rgba(6,182,212,0.3)] p-12 w-full border-2 border-white/30 overflow-hidden"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
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
                    transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 200 }}
                  >
                    <img
                      src={selectedCard?.hasPrize ? "/images/13.svg" : "/images/8.svg"}
                      alt="DarSalud"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </motion.div>

                  {/* Mensaje de agradecimiento */}
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">
                      {selectedCard?.hasPrize ? '¡Felicitaciones!' : '¡Gracias por jugar!'}
                    </h1>

                    <p className="text-2xl font-semibold text-white/90 drop-shadow-md max-w-xl">
                      {selectedCard?.hasPrize
                        ? 'Ganaste un premio. Acércate al stand de DarSalud para reclamarlo.'
                        : 'Te agradecemos por participar en esta actividad de DarSalud.'
                      }
                    </p>
                  </motion.div>

                  {/* Botones de acción */}
                  <motion.div
                    className="flex items-center justify-center gap-6 pt-4 w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
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
                      onClick={() => {
                        if ('vibrate' in navigator) navigator.vibrate(20);
                        resetGame();
                      }}
                      className="bg-transparent text-white px-10 py-4 rounded-2xl text-xl font-bold border-2 border-white/60 hover:bg-white/10 min-h-[60px] flex-1 max-w-xs backdrop-blur-sm"
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
          )}
        </AnimatePresence>
      </div>

      {/* Confetti breve en área de card (≤900ms) */}
      {showCardConfetti && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <MassiveConfetti
            show={true}
            windowSize={{
              width: window.innerWidth,
              height: window.innerHeight
            }}
          />
        </div>
      )}

      {/* Confetti masivo en pantalla de resultado final */}
      {showResult && selectedCard?.hasPrize && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <MassiveConfetti
            show={true}
            windowSize={{
              width: window.innerWidth,
              height: window.innerHeight
            }}
          />
        </div>
      )}
    </div>
  );
}