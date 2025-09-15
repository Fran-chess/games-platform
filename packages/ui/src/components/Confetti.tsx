import React from 'react'
import ReactConfetti from 'react-confetti'

interface ConfettiProps {
  show: boolean
  duration?: number
  numberOfPieces?: number
  gravity?: number
  colors?: string[]
}

export const Confetti: React.FC<ConfettiProps> = ({
  show,
  duration = 5000,
  numberOfPieces = 500,
  gravity = 0.3,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722']
}) => {
  const [windowDimensions, setWindowDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!show) return null

  return (
    <ReactConfetti
      width={windowDimensions.width}
      height={windowDimensions.height}
      numberOfPieces={numberOfPieces}
      gravity={gravity}
      colors={colors}
      recycle={false}
      run={show}
      tweenDuration={duration}
    />
  )
}