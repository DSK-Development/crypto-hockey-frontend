import WebApp from '@twa-dev/sdk'

export interface LaunchParams {
  initData: string
  matchId: string | null
}

export function readLaunchParams(): LaunchParams {
  WebApp.ready()
  const initData = WebApp.initData ?? ''
  // Telegram passes start_param through initDataUnsafe; matchId via URL hash for our flow.
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const matchId = hash.get('matchId')
  return { initData, matchId }
}

export function setupTelegramChrome(): void {
  WebApp.expand()
  WebApp.setHeaderColor('#0c0f17')
  WebApp.setBackgroundColor('#0c0f17')
  WebApp.MainButton.hide()
}

export function showMainButton(text: string, onClick: () => void): void {
  WebApp.MainButton.setText(text)
  WebApp.MainButton.onClick(onClick)
  WebApp.MainButton.show()
}

export function closeWebApp(): void {
  WebApp.close()
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
