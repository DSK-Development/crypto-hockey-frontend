import { useEffect } from 'react'
import { useMatchStore } from '../store/match'
import { closeWebApp, showMainButton } from '../telegram/webApp'

export function ResultScreen() {
  const ended = useMatchStore((s) => s.ended)!
  const slot = useMatchStore((s) => s.slot)

  const youWon =
    ended.reason === 'score'
      ? (slot === 'A' ? ended.finalScore.a > ended.finalScore.b : ended.finalScore.b > ended.finalScore.a)
      : ended.winnerSlot
        ? ended.winnerSlot === slot
        : false

  useEffect(() => { showMainButton('Back to Telegram', closeWebApp) }, [])

  return (
    <main style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 'var(--space-6)' }}>
      <section style={{
        background: 'oklch(20% 0.02 250)', padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: 360,
      }}>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-3)' }}>
          {ended.reason === 'no_join' ? 'Match cancelled' : youWon ? 'You won 🎉' : 'You lost'}
        </h1>
        <p style={{ fontSize: 'var(--text-score)', fontWeight: 700, margin: 'var(--space-3) 0' }}>
          {ended.finalScore.a} : {ended.finalScore.b}
        </p>
        <p style={{ color: 'var(--color-ink-muted)' }}>Reason: {ended.reason}</p>
      </section>
    </main>
  )
}
