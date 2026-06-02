import { useEffect, useState } from 'react'
import { readInitData, signIn } from '../telegram/webApp'

// Shown when the Mini App is opened without a matchId (e.g. from the bot's
// welcome button or the menu button). Instead of a dead-end error, we guide
// the user: sign in, then start a match from the chat.
export function HomeScreen() {
  const initData = readInitData()
  const canSignIn = initData.length > 0
  const [signedIn, setSignedIn] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [signInFailed, setSignInFailed] = useState(false)

  useEffect(() => {
    if (!canSignIn || signedIn) return
    let cancelled = false
    setSigningIn(true)
    signIn().then((ok) => {
      if (cancelled) return
      setSigningIn(false)
      if (ok) setSignedIn(true)
      else setSignInFailed(true)
    })
    return () => { cancelled = true }
  }, [canSignIn, signedIn])

  const onSignIn = async () => {
    setSignInFailed(false)
    setSigningIn(true)
    const ok = await signIn()
    setSigningIn(false)
    if (ok) setSignedIn(true)
    else setSignInFailed(true)
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
                ? 'Signed in! Return to the chat and use /play or /testmatch.'
                : signingIn
                  ? 'Signing in…'
                  : 'Sign in to play, then start a match from the chat.'}
            </p>
            {!signedIn && !signingIn && (
              <button
                onClick={() => void onSignIn()}
                style={{
                  fontSize: 'var(--text-body)', padding: 'var(--space-3) var(--space-5)',
                  borderRadius: 'var(--radius-md, 12px)', border: 'none', cursor: 'pointer',
                  background: 'var(--color-accent, #3b82f6)', color: '#fff', fontWeight: 600,
                }}
              >
                Sign in
              </button>
            )}
            {signInFailed && (
              <p style={{ color: 'var(--color-danger, #f87171)', marginTop: 'var(--space-3)' }}>
                Sign-in failed. Check bot settings and try again.
              </p>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--color-ink-muted)' }}>
            Open this app from the Crypto Hockey bot in Telegram (not in a regular browser).
          </p>
        )}
      </div>
    </main>
  )
}
