import { useEffect } from 'react'
import { useMatchStore } from '../store/match'
import { closeWebApp, showMainButton } from '../telegram/webApp'

export function ResultScreen() {
  const ended = useMatchStore((s) => s.ended)!
  const slot = useMatchStore((s) => s.slot)
  const myUserId = slot === 'A' ? 'self-A' : slot === 'B' ? 'self-B' : null

  // Engine sends the userId; we only know our slot. Treat win by comparing scores in the slot's favour.
  const youWon =
    ended.reason === 'score'
      ? (slot === 'A' ? ended.finalScore.a > ended.finalScore.b : ended.finalScore.b > ended.finalScore.a)
      : ended.reason === 'forfeit'
        ? ended.winnerUserId !== null // forfeit → other player wins, we lost unless we are winner
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
        {void myUserId /* keep var referenced */}
      </section>
    </main>
  )
}
