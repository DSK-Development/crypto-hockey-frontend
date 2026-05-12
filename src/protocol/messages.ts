export type V2 = { x: number; y: number }
export type Score = { a: number; b: number }
export type Phase = 'PENDING' | 'COUNTDOWN' | 'LIVE' | 'SETTLED'
export type Slot = 'A' | 'B'

export type ClientMessage =
  | { type: 'AUTH'; auth: { initData: string } }
  | { type: 'INPUT'; input: { seq: number; tClient: number; malletTarget: V2 } }
  | { type: 'PING'; ping: { tClient: number } }

export type ServerMessage =
  | { type: 'AUTH_OK'; authOk: { playerSlot: Slot; opponent: { username: string; telegramId: number } } }
  | { type: 'AUTH_FAIL'; authFail: { reason: string } }
  | { type: 'MATCH_STATE'; matchState: { phase: Phase; countdownMs?: number; durationLeftMs?: number } }
  | {
      type: 'SNAPSHOT'
      snapshot: {
        tServer: number; ackSeq: number
        malletA: V2; malletB: V2
        puck: V2 & { vx: number; vy: number }
        score: Score
      }
    }
  | { type: 'GOAL'; goal: { scorer: Slot; score: Score } }
  | { type: 'MATCH_END'; matchEnd: { winnerUserId: string | null; reason: 'score' | 'timeout' | 'forfeit' | 'no_join'; finalScore: Score } }
  | { type: 'PONG'; pong: { tClient: number; tServer: number } }

const SERVER_TYPES = new Set(['AUTH_OK', 'AUTH_FAIL', 'MATCH_STATE', 'SNAPSHOT', 'GOAL', 'MATCH_END', 'PONG'])

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const v = JSON.parse(raw) as { type?: unknown }
    if (typeof v.type !== 'string' || !SERVER_TYPES.has(v.type)) return null
    return v as ServerMessage
  } catch {
    return null
  }
}

export function clientToJSON(m: ClientMessage): string {
  return JSON.stringify(m)
}
