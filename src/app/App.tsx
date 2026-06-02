import { useEffect, useMemo, useState } from 'react'
import { readLaunchParams, setupTelegramChrome } from '../telegram/webApp'
import { useMatchStore } from '../store/match'
import { BootScreen } from './BootScreen'
import { HomeScreen } from './HomeScreen'
import { MatchScreen } from './MatchScreen'
import { ResultScreen } from './ResultScreen'
import { EngineClient } from '../engine-client/EngineClient'

const ENGINE_WS = import.meta.env.VITE_ENGINE_WS_URL ?? 'ws://localhost:8081/ws'

export function App() {
  const launch = useMemo(() => readLaunchParams(), [])
  const [client, setClient] = useState<EngineClient | null>(null)
  const phase = useMatchStore((s) => s.phase)
  const connectionPhase = useMatchStore((s) => s.connectionPhase)
  const ended = useMatchStore((s) => s.ended)
  const onServerMessage = useMatchStore((s) => s.onServerMessage)
  const setConnectionPhase = useMatchStore((s) => s.setConnectionPhase)

  useEffect(() => {
    setupTelegramChrome()
    // No matchId means the app was opened outside a match (welcome/menu button).
    // Show the home screen instead of connecting to the engine.
    if (!launch.matchId) return
    const c = new EngineClient(`${ENGINE_WS}?matchId=${encodeURIComponent(launch.matchId)}`, launch.initData)
    c.onMessage(onServerMessage)
    c.onClose(() => setConnectionPhase('closed'))
    setConnectionPhase('connecting')
    c.connect()
    // The EngineClient is an external (WebSocket) resource created once per
    // match; storing the live instance is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClient(c)
    return () => c.close()
  }, [launch, onServerMessage, setConnectionPhase])

  if (!launch.matchId) return <HomeScreen initData={launch.initData} />
  if (ended) return <ResultScreen />
  if (connectionPhase === 'authed' && phase !== 'PENDING' && client) return <MatchScreen client={client} />
  return <BootScreen />
}
