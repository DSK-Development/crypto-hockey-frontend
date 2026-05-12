export const RINK_W = 800
export const RINK_H = 400

interface Size { width: number; height: number }
export interface V2 { x: number; y: number }

export function engineToCss(p: V2, size: Size): V2 {
  return { x: (p.x / RINK_W) * size.width, y: (p.y / RINK_H) * size.height }
}

export function cssToEngine(p: V2, size: Size): V2 {
  return { x: (p.x / size.width) * RINK_W, y: (p.y / size.height) * RINK_H }
}
