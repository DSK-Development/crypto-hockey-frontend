import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signIn, signInErrorMessage } from './webApp'

const mockWebApp = vi.hoisted(() => ({
  initData: 'INIT',
  ready: vi.fn(),
  expand: vi.fn(),
  setHeaderColor: vi.fn(),
  setBackgroundColor: vi.fn(),
  MainButton: {
    hide: vi.fn(),
    setText: vi.fn(),
    onClick: vi.fn(),
    show: vi.fn(),
  },
  close: vi.fn(),
  sendData: vi.fn(),
  HapticFeedback: {
    impactOccurred: vi.fn(),
  },
}))

vi.mock('@twa-dev/sdk', () => ({
  default: mockWebApp,
}))

vi.mock('../runtimeConfig', () => ({
  getRuntimeConfig: () => ({
    botApiUrl: 'https://bot.example',
    engineWsUrl: 'wss://engine.example/ws',
  }),
}))

describe('signIn', () => {
  beforeEach(() => {
    mockWebApp.initData = 'INIT'
    mockWebApp.sendData.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not report success when sendData fallback is unconfirmed', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await signIn()

    expect(fetchMock).toHaveBeenCalledWith('https://bot.example/auth/session', expect.objectContaining({
      method: 'POST',
    }))
    expect(mockWebApp.sendData).toHaveBeenCalledWith('INIT')
    expect(result).toEqual({
      ok: false,
      reason: 'fallback_unconfirmed',
      detail: 'offline → https://bot.example/auth/session',
    })
  })

  it('keeps account auth errors visible instead of falling back to false success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'HMAC signature mismatch' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await signIn()

    expect(mockWebApp.sendData).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: false,
      reason: 'invalid_init_data',
      detail: 'HMAC signature mismatch',
    })
    if (!result.ok) {
      expect(signInErrorMessage(result)).toContain('bot token mismatch')
    }
  })
})
