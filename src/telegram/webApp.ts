import WebApp from '@twa-dev/sdk'

export interface LaunchParams {
  initData: string
  matchId: string | null
}

export function readLaunchParams(): LaunchParams {
  try { WebApp.ready() } catch { /* not in Telegram */ }
  const initData = WebApp.initData ?? ''
  // Telegram passes start_param through initDataUnsafe; matchId via URL hash for our flow.
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const matchId = hash.get('matchId')
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

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
