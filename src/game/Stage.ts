import { Application, Graphics, Container } from 'pixi.js'
import { RINK_W, RINK_H } from './coords'

export interface StageHandles {
  app: Application
  malletA: Graphics
  malletB: Graphics
  puck: Graphics
  destroy: () => void
  resize: (w: number, h: number) => void
}

export async function createStage(host: HTMLDivElement): Promise<StageHandles> {
  const app = new Application()
  await app.init({
    background: '#0c0f17',
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    width: host.clientWidth,
    height: host.clientHeight,
  })
  host.appendChild(app.canvas)

  const root = new Container()
  app.stage.addChild(root)

  const rink = new Graphics()
  rink.rect(0, 0, RINK_W, RINK_H).fill({ color: 0xeeeeee, alpha: 0.04 }).stroke({ color: 0xffffff, alpha: 0.3, width: 2 })
  rink.moveTo(RINK_W / 2, 0).lineTo(RINK_W / 2, RINK_H).stroke({ color: 0xffffff, alpha: 0.25, width: 2 })
  rink.circle(RINK_W / 2, RINK_H / 2, 60).stroke({ color: 0xffffff, alpha: 0.25, width: 2 })
  root.addChild(rink)

  const goalLeft = new Graphics().rect(-6, 140, 6, 120).fill({ color: 0xff5a4a, alpha: 0.85 })
  const goalRight = new Graphics().rect(RINK_W, 140, 6, 120).fill({ color: 0x4afff0, alpha: 0.85 })
  root.addChild(goalLeft, goalRight)

  const malletA = new Graphics().circle(0, 0, 24).fill({ color: 0xff5a4a })
  const malletB = new Graphics().circle(0, 0, 24).fill({ color: 0x4afff0 })
  const puck = new Graphics().circle(0, 0, 14).fill({ color: 0xffffff })
  root.addChild(malletA, malletB, puck)

  const resize = (w: number, h: number) => {
    app.renderer.resize(w, h)
    const scale = Math.min(w / RINK_W, h / RINK_H)
    root.scale.set(scale)
    root.position.set((w - RINK_W * scale) / 2, (h - RINK_H * scale) / 2)
  }
  resize(host.clientWidth, host.clientHeight)

  const destroy = () => app.destroy(true, { children: true })

  return { app, malletA, malletB, puck, resize, destroy }
}
