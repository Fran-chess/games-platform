import { useCallback, useRef, useEffect } from 'react'

interface UseSoundOptions {
  volume?: number
  loop?: boolean
  preload?: boolean
}

export function useSound(url: string, options: UseSoundOptions = {}) {
  const { volume = 1, loop = false, preload = true } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && preload) {
      audioRef.current = new Audio(url)
      audioRef.current.volume = volume
      audioRef.current.loop = loop
      audioRef.current.load()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [url, volume, loop, preload])

  const play = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio(url)
      audioRef.current.volume = volume
      audioRef.current.loop = loop
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }, [url, volume, loop])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))
    }
  }, [])

  return { play, pause, stop, setVolume }
}