import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Player, GameSession } from '@games-platform/types'

export interface BaseGameState {
  session: GameSession | null
  currentPlayer: Player | null
  isLoading: boolean
  error: string | null
}

export interface BaseGameActions {
  setSession: (session: GameSession) => void
  setCurrentPlayer: (player: Player) => void
  updatePlayerScore: (playerId: string, score: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type BaseGameStore = BaseGameState & BaseGameActions

const initialState: BaseGameState = {
  session: null,
  currentPlayer: null,
  isLoading: false,
  error: null
}

export function createBaseGameStore(name: string) {
  return create<BaseGameStore>()(
    devtools(
      (set) => ({
        ...initialState,

        setSession: (session) => set({ session }),

        setCurrentPlayer: (player) => set({ currentPlayer: player }),

        updatePlayerScore: (playerId, score) =>
          set((state) => {
            if (!state.session) return state

            const updatedPlayers = state.session.players.map((p) =>
              p.id === playerId ? { ...p, score } : p
            )

            return {
              session: { ...state.session, players: updatedPlayers }
            }
          }),

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        reset: () => set(initialState)
      }),
      { name: `${name}-store` }
    )
  )
}