import { useEffect, useRef } from 'react'
import { createStage, type StageHandles } from '../game/Stage'
import { interpolate } from '../game/interpolation'
import { cssToEngine } from '../game/coords'
import { useMatchStore } from '../store/match'
import { EngineClient } from '../engine-client/EngineClient'
import { impact } from '../telegram/webApp'

interface Props { client: EngineClient }

export function MatchScreen({ client }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<StageHandles | null>(null)
  const slot = useMatchStore((s) => s.slot)
  const score = useMatchStore((s) => s.score)
  const opponent = useMatchStore((s) => s.opponent)

  useEffect(() => {
    let alive = true
    let inputTimer: number | null = null
    let lastSent: { x: number; y: number } | null = null
    let pointer: { x: number; y: number } | null = null

    ;(async () => {
      if (!hostRef.current) return
      const stage = await createStage(hostRef.current)
      if (!alive) { stage.destroy(); return }
      stageRef.current = stage

      const onResize = () => {
        if (!hostRef.current) return
        stage.resize(hostRef.current.clientWidth, hostRef.current.clientHeight)
      }
      window.addEventListener('resize', onResize)

      const onPointerMove = (e: PointerEvent) => {
        if (!hostRef.current) return
        const rect = hostRef.current.getBoundingClientRect()
        pointer = cssToEngine(
          { x: e.clientX - rect.left, y: e.clientY - rect.top },
          { width: rect.width, height: rect.height },
        )
      }
      hostRef.current.addEventListener('pointermove', onPointerMove)
      hostRef.current.addEventListener('pointerdown', onPointerMove)

      inputTimer = window.setInterval(() => {
        if (pointer && (!lastSent || dist(pointer, lastSent) > 0.5)) {
          client.sendInput(pointer)
          lastSent = pointer
        }
      }, 33)

      let prevScoreA = 0, prevScoreB = 0
      stage.app.ticker.add(() => {
        const snaps = useMatchStore.getState().snapshots
        if (snaps.length === 0) return
        const tNow = (snaps[snaps.length - 1]?.tServer ?? 0) - 100
        const s = interpolate(snaps, tNow)
        stage.malletA.position.set(s.malletA.x, s.malletA.y)
        stage.malletB.position.set(s.malletB.x, s.malletB.y)
        stage.puck.position.set(s.puck.x, s.puck.y)
        if (s.score.a !== prevScoreA || s.score.b !== prevScoreB) {
          impact('medium')
          prevScoreA = s.score.a; prevScoreB = s.score.b
        }
      })
    })()

    return () => {
      alive = false
      if (inputTimer) clearInterval(inputTimer)
      stageRef.current?.destroy()
    }
  }, [client])

  return (
    <main style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <header style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 'var(--text-score)', fontWeight: 700 }}>
          <span style={{ color: 'var(--color-bad)' }}>{score.a}</span>
          <span style={{ color: 'var(--color-ink-muted)', margin: '0 var(--space-2)' }}>:</span>
          <span style={{ color: 'var(--color-good)' }}>{score.b}</span>
        </div>
        <div style={{ color: 'var(--color-ink-muted)' }}>
          {slot === 'A' ? 'You (red)' : slot === 'B' ? 'You (cyan)' : ''}{opponent ? ` vs @${opponent.username}` : ''}
        </div>
      </header>
      <div ref={hostRef} style={{ position: 'relative' }} />
      <footer style={{ padding: 'var(--space-3)', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
        Drag to move your mallet. First to 5 or 120s.
      </footer>
    </main>
  )
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
