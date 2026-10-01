'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

/**
 * Descarga por adelantado el código del confetti, que si no se pide recién al mostrarlo.
 * Sirve para que el festejo no dependa de la red en ese momento.
 * Es el mismo import() que usa el componente: el bundler lo resuelve al mismo chunk.
 */
export function preloadConfetti(): void {
  void import('react-confetti')
}

/** Piezas que emite cada franja con density = 1 */
const TOP_PIECES = 220
const BOTTOM_PIECES = 170

/** Alto en px de las franjas superior e inferior desde las que sale el confetti */
const SOURCE_HEIGHT = 40

interface MassiveConfettiProps {
  show: boolean
  windowSize?: { width: number; height: number }
  /** Multiplicador de la cantidad de piezas (1 = cantidad completa) */
  density?: number
}

export const MassiveConfetti: React.FC<MassiveConfettiProps> = ({
  show,
  windowSize,
  density = 1
}) => {
  const dimensions = windowSize || {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }

  // react-confetti posiciona el canvas (absolute, sin eventos de puntero) con estilos en línea
  const confettiConfig = useMemo(() => ({
    width: dimensions.width,
    height: dimensions.height,
    gravity: 0.15,
    initialVelocityY: 15,
    initialVelocityX: 10,
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff',
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00',
      '#ffffff', '#fff700'
    ],
    opacity: 0.9,
    wind: 0.01,
    recycle: false,
    style: { zIndex: 9999 },
  }), [dimensions.width, dimensions.height])

  if (!show || dimensions.width <= 0 || dimensions.height <= 0) {
    return null
  }

  return (
    <>
      <ReactConfetti
        {...confettiConfig}
        numberOfPieces={Math.round(TOP_PIECES * density)}
        confettiSource={{ x: 0, y: 0, w: dimensions.width, h: SOURCE_HEIGHT }}
      />
      <ReactConfetti
        {...confettiConfig}
        numberOfPieces={Math.round(BOTTOM_PIECES * density)}
        confettiSource={{ x: 0, y: dimensions.height - SOURCE_HEIGHT, w: dimensions.width, h: SOURCE_HEIGHT }}
      />
    </>
  )
}
