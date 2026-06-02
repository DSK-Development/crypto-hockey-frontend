import WebApp from '@twa-dev/sdk'

export interface LaunchParams {
  initData: string
  matchId: string | null
}

export function readLaunchParams(): LaunchParams {
  try { WebApp.ready() } catch { /* not in Telegram */ }
  const initData = WebApp.initData ?? ''
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

// Signs the user in by sending the raw initData back to the bot. The bot's
// `web_app_data` handler exchanges it for an account session. This only
// delivers when the Mini App was launched from a *reply-keyboard* web_app
// button (Telegram does not emit web_app_data for inline/menu launches).
export function signIn(): boolean {
  try {
    if (!WebApp.initData) return false
    WebApp.sendData(WebApp.initData)
    return true
  } catch {
    return false
  }
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
