export interface RuntimeConfig {
  botApiUrl: string
  engineWsUrl: string
}

function normalizeRuntimeUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().replace(/\/$/, '')
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return ''
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ws:' || url.protocol === 'wss:'
      ? trimmed
      : ''
  } catch {
    return ''
  }
}

const defaults: RuntimeConfig = {
  botApiUrl: normalizeRuntimeUrl(import.meta.env.VITE_BOT_API_URL),
  engineWsUrl: normalizeRuntimeUrl(import.meta.env.VITE_ENGINE_WS_URL) || 'ws://localhost:8081/ws',
}

let config: RuntimeConfig = { ...defaults }
let loaded = false

/** Load /runtime-config.json (served from Railway runtime env, no rebuild needed). */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (loaded) return config
  try {
    const res = await fetch('/runtime-config.json', { cache: 'no-store' })
    if (res.ok) {
      const body = (await res.json()) as Partial<RuntimeConfig>
      config = {
        botApiUrl: normalizeRuntimeUrl(body.botApiUrl) || defaults.botApiUrl,
        engineWsUrl: normalizeRuntimeUrl(body.engineWsUrl) || defaults.engineWsUrl,
      }
    }
  } catch {
    /* use build-time defaults */
  }
  loaded = true
  return config
}

export function getRuntimeConfig(): RuntimeConfig {
  return config
}
