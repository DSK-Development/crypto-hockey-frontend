import { create } from 'zustand'
import type { Phase, Score, ServerMessage, Slot } from '../protocol/messages'

interface Opponent { username: string; telegramId: number }
interface EndedState {
  winnerUserId: string | null
  winnerSlot?: Slot | null
  reason: 'score' | 'timeout' | 'forfeit' | 'no_join'
  finalScore: Score
}

interface Snapshot {
  tServer: number; ackSeq: number
  malletA: { x: number; y: number }
  malletB: { x: number; y: number }
  puck:    { x: number; y: number; vx: number; vy: number }
  score:   Score
}

interface MatchState {
  connectionPhase: 'idle' | 'connecting' | 'authed' | 'closed' | 'error'
  phase: Phase
  slot: Slot | null
  opponent: Opponent | null
  score: Score
  countdownMs: number | null
  durationLeftMs: number | null
  snapshots: Snapshot[] // ring buffer of last 2
  ended: EndedState | null
  authFailReason: string | null
  setConnectionPhase: (p: MatchState['connectionPhase']) => void
  onServerMessage: (m: ServerMessage) => void
  reset: () => void
}

export const useMatchStore = create<MatchState>((set, get) => ({
  connectionPhase: 'idle',
  phase: 'PENDING',
  slot: null,
  opponent: null,
  score: { a: 0, b: 0 },
  countdownMs: null,
  durationLeftMs: null,
  snapshots: [],
  ended: null,
  authFailReason: null,
  setConnectionPhase: (p) => set({ connectionPhase: p }),
  onServerMessage: (m) => {
    switch (m.type) {
      case 'AUTH_OK':
        set({ slot: m.authOk.playerSlot, opponent: m.authOk.opponent, connectionPhase: 'authed' })
        return
      case 'AUTH_FAIL':
        set({ connectionPhase: 'error', authFailReason: m.authFail.reason })
        return
      case 'MATCH_STATE':
        set({
          phase: m.matchState.phase,
          countdownMs: m.matchState.countdownMs ?? null,
          durationLeftMs: m.matchState.durationLeftMs ?? null,
        })
        return
      case 'SNAPSHOT': {
        const buf = [...get().snapshots, m.snapshot]
        if (buf.length > 2) buf.shift()
        set({ snapshots: buf })
        return
      }
      case 'GOAL':
        set({ score: m.goal.score })
        return
      case 'MATCH_END':
        set({
          ended: m.matchEnd,
          phase: 'SETTLED',
          score: m.matchEnd.finalScore,
        })
        return
      case 'PONG':
        return
    }
  },
  reset: () => set({
    connectionPhase: 'idle', phase: 'PENDING', slot: null, opponent: null,
    score: { a: 0, b: 0 }, countdownMs: null, durationLeftMs: null,
    snapshots: [], ended: null, authFailReason: null,
  }),
}))
