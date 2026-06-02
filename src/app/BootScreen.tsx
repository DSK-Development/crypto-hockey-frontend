import { useMatchStore } from '../store/match'

export function BootScreen() {
  const status = useMatchStore((s) => s.connectionPhase)
  const authFailReason = useMatchStore((s) => s.authFailReason)
  const message =
    status === 'error'
      ? (authFailReason?.includes('not a participant')
          ? 'You are not in this match. Use /testmatch again after signing in.'
          : authFailReason?.includes('HMAC') || authFailReason?.includes('auth failed')
            ? 'Auth failed. Ensure TELEGRAM_BOT_TOKEN on account-management matches BOT_TOKEN.'
            : authFailReason
              ? `Could not connect: ${authFailReason}`
              : 'Could not connect. Reopen from the bot.')
      : status === 'closed' ? 'Connection closed.' : 'Connecting to match…'
  return (
    <main style={{
      display: 'grid', placeItems: 'center', height: '100%',
      padding: 'var(--space-6)', textAlign: 'center',
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-3)' }}>🏒 Crypto Hockey</h1>
        <p style={{ color: 'var(--color-ink-muted)' }}>{message}</p>
      </div>
    </main>
  )
}
