import { describe, it, expect } from 'vitest'
import { cssToEngine, engineToCss, RINK_W, RINK_H } from './coords'

describe('coords', () => {
  it('roundtrips when canvas is RINK_W x RINK_H', () => {
    const css = engineToCss({ x: 400, y: 200 }, { width: RINK_W, height: RINK_H })
    const eng = cssToEngine(css, { width: RINK_W, height: RINK_H })
    expect(eng.x).toBeCloseTo(400)
    expect(eng.y).toBeCloseTo(200)
  })

  it('scales for half-size canvas', () => {
    const css = engineToCss({ x: 800, y: 400 }, { width: RINK_W / 2, height: RINK_H / 2 })
    expect(css.x).toBe(RINK_W / 2)
    expect(css.y).toBe(RINK_H / 2)
  })
})
