import WebApp from '@twa-dev/sdk'
import { getRuntimeConfig } from '../runtimeConfig'

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
  | 'fallback_unconfirmed'
  | 'server'

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: SignInFailureReason; detail?: string }

type TelegramGlobal = {
  Telegram?: {
    WebApp?: {
      initData?: string
      ready?: () => void
      expand?: () => void
      setHeaderColor?: (color: string) => void
      setBackgroundColor?: (color: string) => void
      MainButton?: {
        hide?: () => void
        setText?: (text: string) => void
        onClick?: (handler: () => void) => void
        show?: () => void
      }
      close?: () => void
      sendData?: (data: string) => void
      HapticFeedback?: {
        impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void
      }
    }
  }
}

function telegramWebApp() {
  return (globalThis as TelegramGlobal).Telegram?.WebApp
}

/** Read Telegram initData from the SDK, falling back to launch hash/query. */
export function readInitData(): string {
  try {
    if (WebApp.initData) return WebApp.initData
  } catch { /* not in Telegram */ }

  const directInitData = telegramWebApp()?.initData
  if (directInitData) return directInitData

  const hash = window.location.hash.slice(1)
  const tgFromHash = extractLaunchValue(hash, 'tgWebAppData') ?? extractLaunchValue(hash, 'initData')
  if (tgFromHash) return tgFromHash

  const query = window.location.search.slice(1)
  return extractLaunchValue(query, 'tgWebAppData') ?? extractLaunchValue(query, 'initData') ?? ''
}

/** tgWebAppData/initData is one URL-encoded query string; avoid URLSearchParams on full initData. */
function extractLaunchValue(queryOrHash: string, key: string): string | null {
  if (!queryOrHash) return null
  const parts = queryOrHash.split('&')
  for (const part of parts) {
    const prefix = `${key}=`
    if (!part.startsWith(prefix)) continue
    const raw = part.slice(prefix.length)
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

function botApiBase(): string {
  const base = getRuntimeConfig().botApiUrl.replace(/\/$/, '')
  if (!base || base === 'null' || base === 'undefined') return ''
  try {
    const url = new URL(base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : ''
  } catch {
    return ''
  }
}

async function signInViaHttp(initData: string): Promise<SignInResult> {
  const base = botApiBase()
  if (!base) {
    return { ok: false, reason: 'no_bot_api' }
  }
  const url = `${base}/auth/session`
  try {
    const res = await fetch(url, {
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
    const msg = err instanceof Error ? err.message : 'unknown'
    return { ok: false, reason: 'network', detail: `${msg} → ${url}` }
  }
}

// Signs the user in via bot HTTP API (works for all launch types).
export async function signIn(): Promise<SignInResult> {
  const initData = readInitData()
  if (!initData) return { ok: false, reason: 'no_init_data' }
  const http = await signInViaHttp(initData)
  if (http.ok) return http

  // Fallback is only useful when the bot HTTP endpoint cannot be reached.
  // sendData does not confirm that the bot accepted and saved the session.
  if (http.reason === 'no_bot_api' || http.reason === 'network') {
    try {
      WebApp.sendData(initData)
      return { ok: false, reason: 'fallback_unconfirmed', detail: http.detail }
    } catch {
      return http
    }
  }

  return http
}

export function signInErrorMessage(result: Extract<SignInResult, { ok: false }>): string {
  switch (result.reason) {
    case 'no_bot_api':
      return 'Sign-in is not configured. On Railway set BOT_API_URL on the frontend service (e.g. https://your-bot.up.railway.app).'
    case 'network':
      return result.detail
        ? `Cannot reach the bot API: ${result.detail}`
        : 'Cannot reach the bot API. Set BOT_API_URL to the bot public https URL (not WEBAPP_URL or ENGINE_WS).'
    case 'invalid_init_data':
      return result.detail?.includes('HMAC') || result.detail?.includes('mismatch')
        ? 'Telegram auth rejected (bot token mismatch). Set TELEGRAM_BOT_TOKEN on account-management to the same value as BOT_TOKEN on the bot.'
        : (result.detail ?? 'Telegram auth rejected. Check TELEGRAM_BOT_TOKEN matches BOT_TOKEN.')
    case 'session_store':
      return result.detail ?? 'Bot could not save session. Add REDIS_URL on the bot service in Railway.'
    case 'fallback_unconfirmed':
      return 'Sign-in was sent to Telegram, but this app could not confirm it. Wait for the bot confirmation in chat; if it does not appear, check BOT_API_URL on the frontend.'
    case 'server':
      return result.detail ?? 'Server error during sign-in.'
    case 'no_init_data':
      return 'Open this app from the Crypto Hockey bot in Telegram.'
  }
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try { WebApp.HapticFeedback.impactOccurred(style) } catch { /* not in Telegram */ }
}
