export interface BaseGame {
  id: string
  name: string
  description: string
  type: 'roulette' | 'trivia' | 'quiz' | 'wheel'
  minPlayers?: number
  maxPlayers?: number
  duration?: number
}

export interface Player {
  id: string
  name: string
  score: number
  isActive: boolean
  joinedAt: Date
}

export interface GameSession {
  id: string
  gameType: BaseGame['type']
  players: Player[]
  status: 'waiting' | 'playing' | 'finished'
  startedAt?: Date
  endedAt?: Date
}

export interface GameResult {
  sessionId: string
  winner?: Player
  scores: Record<string, number>
  duration: number
}