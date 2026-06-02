import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EngineClient } from './EngineClient'

class MockSocket {
  static instances: MockSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  sent: string[] = []
  url: string
  constructor(url: string) { this.url = url; MockSocket.instances.push(this) }
  send(d: string) { this.sent.push(d) }
  close() { this.onclose?.() }
}

describe('EngineClient', () => {
  let originalWS: typeof WebSocket
  beforeEach(() => {
    originalWS = globalThis.WebSocket
    MockSocket.instances = []
    globalThis.WebSocket = MockSocket as unknown as typeof WebSocket
  })
  afterEach(() => { globalThis.WebSocket = originalWS })

  it('sends AUTH after open', () => {
    const c = new EngineClient('wss://x/ws?matchId=m1', 'INIT')
    const onMsg = vi.fn()
    c.onMessage(onMsg)
    c.connect()
    const s = MockSocket.instances[0]!
    s.onopen?.()
    expect(s.sent[0]).toContain('"type":"AUTH"')
    expect(s.sent[0]).toContain('"initData":"INIT"')
  })

  it('delivers parsed messages', () => {
    const c = new EngineClient('wss://x/ws?matchId=m1', 'I')
    const onMsg = vi.fn()
    c.onMessage(onMsg)
    c.connect()
    const s = MockSocket.instances[0]!
    s.onopen?.()
    s.onmessage?.({ data: JSON.stringify({
      type: 'AUTH_OK',
      authOk: { playerSlot: 'B', opponent: { username: 'x', telegramId: 1 } },
    }) } as MessageEvent)
    expect(onMsg).toHaveBeenCalledWith(expect.objectContaining({ type: 'AUTH_OK' }))
  })

  it('reconnects after unexpected close (retryCount < maxRetries)', async () => {
    vi.useFakeTimers()
    const c = new EngineClient('wss://x/ws?matchId=m1', 'INIT')
    c.connect()
    const s0 = MockSocket.instances[0]!
    s0.onopen?.()
    // Simulate unexpected close (not via c.close())
    s0.onclose?.()
    // Advance past the 1s backoff delay
    await vi.runAllTimersAsync()
    expect(MockSocket.instances.length).toBeGreaterThanOrEqual(2)
    vi.useRealTimers()
  })

  it('does NOT reconnect after AUTH_FAIL', async () => {
    vi.useFakeTimers()
    const c = new EngineClient('wss://x/ws?matchId=m1', 'INIT')
    c.connect()
    const s0 = MockSocket.instances[0]!
    s0.onopen?.()
    s0.onmessage?.({ data: JSON.stringify({ type: 'AUTH_FAIL', authFail: { reason: 'bad' } }) } as MessageEvent)
    s0.onclose?.()
    await vi.runAllTimersAsync()
    expect(MockSocket.instances.length).toBe(1)
    vi.useRealTimers()
  })

  it('does NOT reconnect after explicit c.close()', () => {
    const c = new EngineClient('wss://x/ws?matchId=m1', 'INIT')
    const onClose = vi.fn()
    c.onClose(onClose)
    c.connect()
    const s0 = MockSocket.instances[0]!
    s0.onopen?.()
    c.close()
    expect(MockSocket.instances.length).toBe(1)
    expect(onClose).toHaveBeenCalled()
  })
})
