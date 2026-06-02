import { useState } from 'react'
import { signIn } from '../telegram/webApp'

interface HomeScreenProps {
  initData: string
}

// Shown when the Mini App is opened without a matchId (e.g. from the bot's
// welcome button or the menu button). Instead of a dead-end error, we guide
// the user: sign in, then start a match from the chat.
export function HomeScreen({ initData }: HomeScreenProps) {
  const canSignIn = initData.length > 0
  const [signedIn, setSignedIn] = useState(false)

  const onSignIn = () => {
    if (signIn()) setSignedIn(true)
  }

  return (
    <main style={{
      display: 'grid', placeItems: 'center', height: '100%',
      padding: 'var(--space-6)', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 360 }}>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-3)' }}>🏒 Crypto Hockey</h1>

        {canSignIn ? (
          <>
            <p style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--space-4)' }}>
              {signedIn
                ? 'Signed in! Return to the chat and tap Find match (or /testmatch to try solo).'
                : 'Tap below to sign in, then start a match from the chat.'}
            </p>
            {!signedIn && (
              <button
                onClick={onSignIn}
                style={{
                  fontSize: 'var(--text-body)', padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-md, 12px)', border: 'none', cursor: 'pointer',
                  background: 'var(--color-accent, #3b82f6)', color: '#fff', fontWeight: 600,
                }}
              >
                Sign in
              </button>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--color-ink-muted)' }}>
            Open this app from the Crypto Hockey bot to play.
          </p>
        )}
      </div>
    </main>
  )
}
