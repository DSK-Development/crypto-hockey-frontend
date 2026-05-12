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
    expect(useMatchStore.getState().ended?.reason).toBe('score')
  })
})
