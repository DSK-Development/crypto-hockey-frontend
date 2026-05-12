import { useEffect, useState } from 'react'
import { readLaunchParams, setupTelegramChrome } from '../telegram/webApp'
import { useMatchStore } from '../store/match'
import { BootScreen } from './BootScreen'
import { MatchScreen } from './MatchScreen'
import { ResultScreen } from './ResultScreen'
import { EngineClient } from '../engine-client/EngineClient'

const ENGINE_WS = import.meta.env.VITE_ENGINE_WS_URL ?? 'ws://localhost:8081/ws'

export function App() {
  const [client, setClient] = useState<EngineClient | null>(null)
  const phase = useMatchStore((s) => s.phase)
  const connectionPhase = useMatchStore((s) => s.connectionPhase)
  const ended = useMatchStore((s) => s.ended)
  const onServerMessage = useMatchStore((s) => s.onServerMessage)
  const setConnectionPhase = useMatchStore((s) => s.setConnectionPhase)

  useEffect(() => {
    setupTelegramChrome()
    const { initData, matchId } = readLaunchParams()
    if (!matchId) {
      setConnectionPhase('error')
      return
    }
    const c = new EngineClient(`${ENGINE_WS}?matchId=${encodeURIComponent(matchId)}`, initData)
    c.onMessage(onServerMessage)
    c.onClose(() => setConnectionPhase('closed'))
    setConnectionPhase('connecting')
    c.connect()
    setClient(c)
    return () => c.close()
  }, [onServerMessage, setConnectionPhase])

  if (ended) return <ResultScreen />
  if (connectionPhase === 'authed' && phase !== 'PENDING' && client) return <MatchScreen client={client} />
  return <BootScreen />
}
