import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  initialTime: number
  onComplete?: () => void
  autoStart?: boolean
  interval?: number
}

export function useTimer({
  initialTime,
  onComplete,
  autoStart = false,
  interval = 1000
}: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            onCompleteRef.current?.()
            return 0
          }
          return prev - 1
        })
      }, interval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, interval])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setTimeLeft(initialTime)
    setIsRunning(false)
  }, [initialTime])

  const restart = useCallback(() => {
    setTimeLeft(initialTime)
    setIsRunning(true)
  }, [initialTime])

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    restart
  }
}