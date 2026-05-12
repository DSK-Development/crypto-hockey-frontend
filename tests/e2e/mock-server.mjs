import { WebSocketServer } from 'ws'
import http from 'node:http'

const wss = new WebSocketServer({ noServer: true })
const server = http.createServer()
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
})

wss.on('connection', (ws) => {
  console.log('WS Connection received!')
  ws.on('message', (raw) => {
    console.log('WS Message:', raw.toString())
    const m = JSON.parse(raw.toString())
    if (m.type === 'AUTH') {
      ws.send(JSON.stringify({ type: 'AUTH_OK', authOk: { playerSlot: 'A', opponent: { username: 'mock', telegramId: 2 } } }))
      ws.send(JSON.stringify({ type: 'MATCH_STATE', matchState: { phase: 'LIVE' } }))
      ws.send(JSON.stringify({ type: 'SNAPSHOT', snapshot: {
        tServer: Date.now(), ackSeq: 0,
        malletA: { x: 100, y: 200 }, malletB: { x: 700, y: 200 },
        puck: { x: 400, y: 200, vx: 0, vy: 0 },
        score: { a: 0, b: 0 } } }))
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'GOAL', goal: { scorer: 'A', score: { a: 1, b: 0 } } }))
        ws.send(JSON.stringify({ type: 'MATCH_END', matchEnd: { winnerUserId: 'u1', reason: 'score', finalScore: { a: 5, b: 3 } } }))
      }, 800)
    }
  })
})

server.listen(8090, () => console.log('mock engine on :8090'))
