export interface Snap {
  tServer: number; ackSeq: number
  malletA: { x: number; y: number }
  malletB: { x: number; y: number }
  puck:    { x: number; y: number; vx: number; vy: number }
  score:   { a: number; b: number }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function interpolate(buf: readonly Snap[], tNow: number): Snap {
  if (buf.length === 0) throw new Error('interpolate: empty buffer')
  if (buf.length === 1) return buf[0]!
  const a = buf[0]!, b = buf[1]!
  if (tNow <= a.tServer) return a
  if (tNow >= b.tServer) return b
  const t = (tNow - a.tServer) / (b.tServer - a.tServer)
  return {
    tServer: tNow, ackSeq: b.ackSeq,
    malletA: { x: lerp(a.malletA.x, b.malletA.x, t), y: lerp(a.malletA.y, b.malletA.y, t) },
    malletB: { x: lerp(a.malletB.x, b.malletB.x, t), y: lerp(a.malletB.y, b.malletB.y, t) },
    puck:    {
      x: lerp(a.puck.x, b.puck.x, t), y: lerp(a.puck.y, b.puck.y, t),
      vx: b.puck.vx, vy: b.puck.vy,
    },
    score: b.score,
  }
}
