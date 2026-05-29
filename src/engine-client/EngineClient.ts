import { clientToJSON, parseServerMessage, type ClientMessage, type ServerMessage } from '../protocol/messages'

type MessageHandler = (m: ServerMessage) => void
type CloseHandler = () => void

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30_000

export class EngineClient {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private closeHandlers: CloseHandler[] = []
  private nextSeq = 1
  private retryCount = 0
  private closed = false
  private readonly url: string
  private readonly initData: string

  constructor(url: string, initData: string) {
    this.url = url
    this.initData = initData
  }

  connect(): void {
    this.closed = false
    this._connect()
  }

  private _connect(): void {
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => {
      this.retryCount = 0
      this.sendRaw({ type: 'AUTH', auth: { initData: this.initData } })
    }
    ws.onmessage = (e) => {
      const m = parseServerMessage(String(e.data))
      if (m) this.handlers.forEach((h) => h(m))
    }
    ws.onclose = () => {
      if (this.closed) {
        this.closeHandlers.forEach((h) => h())
        return
      }
      if (this.retryCount < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * 2 ** this.retryCount, MAX_DELAY_MS)
        this.retryCount++
        setTimeout(() => {
          if (!this.closed) this._connect()
        }, delay)
      } else {
        this.closeHandlers.forEach((h) => h())
      }
    }
    ws.onerror = () => { /* surfaced via onclose */ }
  }

  sendInput(malletTarget: { x: number; y: number }): number {
    const seq = this.nextSeq++
    this.sendRaw({ type: 'INPUT', input: { seq, tClient: Date.now(), malletTarget } })
    return seq
  }

  ping(): void {
    this.sendRaw({ type: 'PING', ping: { tClient: Date.now() } })
  }

  close(): void {
    this.closed = true
    this.ws?.close()
  }

  onMessage(h: MessageHandler): void { this.handlers.push(h) }
  onClose(h: CloseHandler): void { this.closeHandlers.push(h) }

  private sendRaw(m: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(clientToJSON(m))
  }
}
