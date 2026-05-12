import { clientToJSON, parseServerMessage, type ClientMessage, type ServerMessage } from '../protocol/messages'

type MessageHandler = (m: ServerMessage) => void
type CloseHandler = () => void

export class EngineClient {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private closeHandlers: CloseHandler[] = []
  private nextSeq = 1
  private url: string
  private initData: string

  constructor(url: string, initData: string) {
    this.url = url
    this.initData = initData
  }

  connect(): void {
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => this.sendRaw({ type: 'AUTH', auth: { initData: this.initData } })
    ws.onmessage = (e) => {
      const m = parseServerMessage(String(e.data))
      if (m) this.handlers.forEach((h) => h(m))
    }
    ws.onclose = () => this.closeHandlers.forEach((h) => h())
    ws.onerror = () => { /* surfaced via close */ }
  }

  sendInput(malletTarget: { x: number; y: number }): number {
    const seq = this.nextSeq++
    this.sendRaw({ type: 'INPUT', input: { seq, tClient: Date.now(), malletTarget } })
    return seq
  }

  ping(): void {
    this.sendRaw({ type: 'PING', ping: { tClient: Date.now() } })
  }

  close(): void { this.ws?.close() }

  onMessage(h: MessageHandler): void { this.handlers.push(h) }
  onClose(h: CloseHandler): void { this.closeHandlers.push(h) }

  private sendRaw(m: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(clientToJSON(m))
  }
}
