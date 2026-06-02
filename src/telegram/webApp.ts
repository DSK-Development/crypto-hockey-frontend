import WebApp from '@twa-dev/sdk'

export interface LaunchParams {
  initData: string
  matchId: string | null
}

/** Read Telegram initData from the SDK, falling back to launch hash/query. */
export function readInitData(): string {
  try {
    if (WebApp.initData) return WebApp.initData
  } catch { /* not in Telegram */ }

  const hash = new URLSearchParams(window.location.hash.slice(1))
  const fromHash = hash.get('tgWebAppData')
  if (fromHash) return fromHash

  const query = new URLSearchParams(window.location.search)
  return query.get('tgWebAppData') ?? ''
}

export function readLaunchParams(): LaunchParams {
  try { WebApp.ready() } catch { /* not in Telegram */ }
  const initData = readInitData()
  // Telegram preserves the query string of the WebApp URL but appends its own
  // launch params (tgWebAppData, ...) to the hash, where a custom fragment is
  // unreliable. The bot therefore passes matchId as a query param; we still
  // fall back to the hash so older links keep working.
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const matchId = query.get('matchId') ?? hash.get('matchId')
  return { initData, matchId }
}

export function setupTelegramChrome(): void {
  try { WebApp.expand() } catch { /* not in Telegram */ }
  try { WebApp.setHeaderColor('#0c0f17') } catch { /* not in Telegram */ }
  try { WebApp.setBackgroundColor('#0c0f17') } catch { /* not in Telegram */ }
  try { WebApp.MainButton.hide() } catch { /* not in Telegram */ }
}

export function showMainButton(text: string, onClick: () => void): void {
  try {
    WebApp.MainButton.setText(text)
    WebApp.MainButton.onClick(onClick)
    WebApp.MainButton.show()
  } catch { /* not in Telegram */ }
}

export function closeWebApp(): void {
  try { WebApp.close() } catch { /* not in Telegram */ }
}

const BOT_API = import.meta.env.VITE_BOT_API_URL ?? ''

async function signInViaHttp(initData: string): Promise<boolean> {
  if (!BOT_API) return false
  try {
    const res = await fetch(`${BOT_API.replace(/\/$/, '')}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Signs the user in by sending initData to the bot. Prefers HTTP (works for
// inline/menu launches); falls back to WebApp.sendData (reply-keyboard only).
export async function signIn(): Promise<boolean> {
  const initData = readInitData()
  if (!initData) return false
  if (await signInViaHttp(initData)) return true
  try {
    WebApp.sendData(initData)
    return true
  } catch {
    return false
  }
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
