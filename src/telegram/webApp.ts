import WebApp from '@twa-dev/sdk'

export interface LaunchParams {
  initData: string
  matchId: string | null
}

export type SignInFailureReason =
  | 'no_init_data'
  | 'no_bot_api'
  | 'network'
  | 'invalid_init_data'
  | 'session_store'
  | 'server'

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: SignInFailureReason; detail?: string }

/** Read Telegram initData from the SDK, falling back to launch hash/query. */
export function readInitData(): string {
  try {
    if (WebApp.initData) return WebApp.initData
  } catch { /* not in Telegram */ }

  const hash = window.location.hash.slice(1)
  const tgFromHash = extractTgWebAppData(hash)
  if (tgFromHash) return tgFromHash

  const query = window.location.search.slice(1)
  return extractTgWebAppData(query) ?? ''
}

/** tgWebAppData is one URL-encoded query string; avoid URLSearchParams on full initData. */
function extractTgWebAppData(queryOrHash: string): string | null {
  if (!queryOrHash) return null
  const parts = queryOrHash.split('&')
  for (const part of parts) {
    if (!part.startsWith('tgWebAppData=')) continue
    const raw = part.slice('tgWebAppData='.length)
    try {
      return decodeURIComponent(raw.replace(/\+/g, '%20'))
    } catch {
      return raw
    }
  }
  return null
}

export function readLaunchParams(): LaunchParams {
  try { WebApp.ready() } catch { /* not in Telegram */ }
  const initData = readInitData()
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

async function signInViaHttp(initData: string): Promise<SignInResult> {
  if (!BOT_API) {
    return { ok: false, reason: 'no_bot_api' }
  }
  try {
    const res = await fetch(`${BOT_API.replace(/\/$/, '')}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
    if (res.ok) return { ok: true }
    let detail: string | undefined
    try {
      const body = await res.json() as { message?: string; error?: string }
      detail = body.message ?? body.error
    } catch { /* ignore */ }
    if (res.status === 401) return { ok: false, reason: 'invalid_init_data', detail }
    if (res.status === 503) return { ok: false, reason: 'session_store', detail }
    return { ok: false, reason: 'server', detail }
  } catch (err) {
    return { ok: false, reason: 'network', detail: err instanceof Error ? err.message : undefined }
  }
}

// Signs the user in via bot HTTP API (works for all launch types).
export async function signIn(): Promise<SignInResult> {
  const initData = readInitData()
  if (!initData) return { ok: false, reason: 'no_init_data' }
  const http = await signInViaHttp(initData)
  if (http.ok) return http
  // Fallback: reply-keyboard only; does not confirm server-side success.
  try {
    WebApp.sendData(initData)
    return { ok: true }
  } catch {
    return http
  }
}

export function signInErrorMessage(result: Extract<SignInResult, { ok: false }>): string {
  switch (result.reason) {
    case 'no_bot_api':
      return 'Sign-in is not configured (missing VITE_BOT_API_URL on the frontend build).'
    case 'network':
      return result.detail
        ? `Cannot reach the bot API: ${result.detail}`
        : 'Cannot reach the bot API. Check VITE_BOT_API_URL (public https URL).'
    case 'invalid_init_data':
      return result.detail?.includes('HMAC') || result.detail?.includes('mismatch')
        ? 'Telegram auth rejected (bot token mismatch). Set TELEGRAM_BOT_TOKEN on account-management to the same value as BOT_TOKEN on the bot.'
        : (result.detail ?? 'Telegram auth rejected. Check TELEGRAM_BOT_TOKEN matches BOT_TOKEN.')
    case 'session_store':
      return result.detail ?? 'Bot could not save session. Add REDIS_URL on the bot service in Railway.'
    case 'server':
      return result.detail ?? 'Server error during sign-in.'
    case 'no_init_data':
      return 'Open this app from the Crypto Hockey bot in Telegram.'
  }
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
