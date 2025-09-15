import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

interface MassiveConfettiProps {
  show: boolean
  windowSize?: { width: number; height: number }
  isTV65?: boolean
  isTabletPortrait?: boolean
  className?: string
}

export const MassiveConfetti: React.FC<MassiveConfettiProps> = ({
  show,
  windowSize,
  isTV65 = false,
  isTabletPortrait = false,
  className = "pointer-events-none fixed inset-0 z-50"
}) => {
  const dimensions = windowSize || {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }

  const confettiConfig = useMemo(() => ({
    width: dimensions.width,
    height: dimensions.height,
    gravity: isTV65 ? 0.09 : isTabletPortrait ? 0.12 : 0.15,
    initialVelocityY: isTV65 ? 25 : isTabletPortrait ? 18 : 15,
    initialVelocityX: isTV65 ? 15 : isTabletPortrait ? 12 : 10,
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff',
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00',
      '#ffffff', '#fff700'
    ],
    opacity: isTV65 ? 0.96 : isTabletPortrait ? 0.92 : 0.9,
    wind: isTV65 ? 0.03 : isTabletPortrait ? 0.02 : 0.01,
    recycle: false,
  }), [dimensions.width, dimensions.height, isTV65, isTabletPortrait])

  if (!show || dimensions.width <= 0 || dimensions.height <= 0) {
    return null
  }

  return (
    <>
      <ReactConfetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 600 : isTabletPortrait ? 180 : 220}
        confettiSource={{ x: 0, y: 0, w: dimensions.width, h: 40 }}
        recycle={false}
        className={`${className} ${isTabletPortrait ? 'confetti-tablet-portrait' : ''}`}
        style={{ zIndex: 9999 }}
      />
      <ReactConfetti
        {...confettiConfig}
        numberOfPieces={isTV65 ? 450 : isTabletPortrait ? 140 : 170}
        confettiSource={{ x: 0, y: dimensions.height - 40, w: dimensions.width, h: 40 }}
        recycle={false}
        className={`${className} ${isTabletPortrait ? 'confetti-tablet-portrait' : ''}`}
        style={{ zIndex: 9999 }}
      />
    </>
  )
}