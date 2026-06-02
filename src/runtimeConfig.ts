export interface RuntimeConfig {
  botApiUrl: string
  engineWsUrl: string
}

const defaults: RuntimeConfig = {
  botApiUrl: import.meta.env.VITE_BOT_API_URL ?? '',
  engineWsUrl: import.meta.env.VITE_ENGINE_WS_URL ?? 'ws://localhost:8081/ws',
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
        botApiUrl: body.botApiUrl?.trim() || defaults.botApiUrl,
        engineWsUrl: body.engineWsUrl?.trim() || defaults.engineWsUrl,
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
