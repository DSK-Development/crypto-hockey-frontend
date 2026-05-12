import { describe, it, expect } from 'vitest'
import { interpolate, type Snap } from './interpolation'

const snap = (t: number, x: number): Snap => ({
  tServer: t, ackSeq: 0,
  malletA: { x, y: 200 }, malletB: { x: 700, y: 200 },
  puck: { x, y: 200, vx: 0, vy: 0 },
  score: { a: 0, b: 0 },
})

describe('interpolate', () => {
  it('returns latest when only one snap', () => {
    expect(interpolate([snap(100, 50)], 100).malletA.x).toBe(50)
  })

  it('blends two snaps by tNow', () => {
    const r = interpolate([snap(100, 0), snap(200, 100)], 150)
    expect(r.malletA.x).toBeCloseTo(50)
  })

  it('clamps when tNow exceeds latest', () => {
    const r = interpolate([snap(100, 0), snap(200, 100)], 300)
    expect(r.malletA.x).toBe(100)
  })
})
