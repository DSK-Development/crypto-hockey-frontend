import { describe, it, expect, beforeEach } from 'vitest'
import { useMatchStore } from './match'

describe('match store', () => {
  beforeEach(() => useMatchStore.getState().reset())

  it('applies AUTH_OK', () => {
    useMatchStore.getState().onServerMessage({
      type: 'AUTH_OK',
      authOk: { playerSlot: 'A', opponent: { username: 'bob', telegramId: 2 } },
    })
    const s = useMatchStore.getState()
    expect(s.slot).toBe('A')
    expect(s.opponent?.username).toBe('bob')
    expect(s.connectionPhase).toBe('authed')
  })

  it('applies AUTH_FAIL', () => {
    useMatchStore.getState().onServerMessage({ type: 'AUTH_FAIL', authFail: { reason: 'bad' } })
    expect(useMatchStore.getState().connectionPhase).toBe('error')
  })

  it('applies MATCH_STATE with countdown', () => {
    useMatchStore.getState().onServerMessage({
      type: 'MATCH_STATE', matchState: { phase: 'COUNTDOWN', countdownMs: 3000 },
    })
    const s = useMatchStore.getState()
    expect(s.phase).toBe('COUNTDOWN')
    expect(s.countdownMs).toBe(3000)
    expect(s.durationLeftMs).toBeNull()
  })

  it('applies MATCH_STATE with duration', () => {
    useMatchStore.getState().onServerMessage({
      type: 'MATCH_STATE', matchState: { phase: 'LIVE', durationLeftMs: 100000 },
    })
    const s = useMatchStore.getState()
    expect(s.phase).toBe('LIVE')
    expect(s.durationLeftMs).toBe(100000)
  })

  it('applies SNAPSHOT and keeps ring buffer of 2', () => {
    const snap = (t: number) => ({
      type: 'SNAPSHOT' as const,
      snapshot: {
        tServer: t, ackSeq: 0,
        malletA: { x: 100, y: 200 }, malletB: { x: 700, y: 200 },
        puck: { x: 400, y: 200, vx: 0, vy: 0 },
        score: { a: 0, b: 0 },
      },
    })
    useMatchStore.getState().onServerMessage(snap(1000))
    expect(useMatchStore.getState().snapshots).toHaveLength(1)
    useMatchStore.getState().onServerMessage(snap(1050))
    expect(useMatchStore.getState().snapshots).toHaveLength(2)
    useMatchStore.getState().onServerMessage(snap(1100))
    const snaps = useMatchStore.getState().snapshots
    expect(snaps).toHaveLength(2)
    expect(snaps[0]!.tServer).toBe(1050)
    expect(snaps[1]!.tServer).toBe(1100)
  })

  it('applies GOAL', () => {
    useMatchStore.getState().onServerMessage({
      type: 'GOAL', goal: { scorer: 'A', score: { a: 1, b: 0 } },
    })
    expect(useMatchStore.getState().score).toEqual({ a: 1, b: 0 })
  })

  it('captures MATCH_END', () => {
    useMatchStore.getState().onServerMessage({
      type: 'MATCH_END', matchEnd: { winnerUserId: 'u1', reason: 'score', finalScore: { a: 5, b: 3 } },
    })
    const s = useMatchStore.getState()
    expect(s.ended?.reason).toBe('score')
    expect(s.phase).toBe('SETTLED')
    expect(s.score).toEqual({ a: 5, b: 3 })
  })

  it('ignores PONG without error', () => {
    expect(() =>
      useMatchStore.getState().onServerMessage({ type: 'PONG', pong: { tClient: 1, tServer: 2 } })
    ).not.toThrow()
  })

  it('setConnectionPhase updates state', () => {
    useMatchStore.getState().setConnectionPhase('connecting')
    expect(useMatchStore.getState().connectionPhase).toBe('connecting')
  })

  it('reset clears all state', () => {
    useMatchStore.getState().onServerMessage({
      type: 'AUTH_OK', authOk: { playerSlot: 'B', opponent: { username: 'x', telegramId: 1 } },
    })
    useMatchStore.getState().reset()
    const s = useMatchStore.getState()
    expect(s.slot).toBeNull()
    expect(s.score).toEqual({ a: 0, b: 0 })
    expect(s.ended).toBeNull()
  })
})
