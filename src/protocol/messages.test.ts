import { describe, it, expect } from 'vitest'
import { parseServerMessage } from './messages'

describe('parseServerMessage', () => {
  it('parses AUTH_OK', () => {
    const m = parseServerMessage(JSON.stringify({
      type: 'AUTH_OK',
      authOk: { playerSlot: 'A', opponent: { username: 'b', telegramId: 2 } },
    }))
    expect(m?.type).toBe('AUTH_OK')
    if (m?.type === 'AUTH_OK') expect(m.authOk.playerSlot).toBe('A')
  })

  it('parses SNAPSHOT', () => {
    const m = parseServerMessage(JSON.stringify({
      type: 'SNAPSHOT',
      snapshot: {
        tServer: 1, ackSeq: 0,
        malletA: { x: 100, y: 200 }, malletB: { x: 700, y: 200 },
        puck: { x: 400, y: 200, vx: 0, vy: 0 },
        score: { a: 0, b: 0 },
      },
    }))
    expect(m?.type).toBe('SNAPSHOT')
  })

  it('returns null on garbage', () => {
    expect(parseServerMessage('{')).toBeNull()
    expect(parseServerMessage(JSON.stringify({ type: 'WAT' }))).toBeNull()
  })
})
