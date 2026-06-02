import { useEffect, useMemo, useState } from 'react'
import { readLaunchParams, setupTelegramChrome } from '../telegram/webApp'
import { useMatchStore } from '../store/match'
import { BootScreen } from './BootScreen'
import { HomeScreen } from './HomeScreen'
import { MatchScreen } from './MatchScreen'
import { ResultScreen } from './ResultScreen'
import { EngineClient } from '../engine-client/EngineClient'
import { getRuntimeConfig } from '../runtimeConfig'

export function App() {
  const launch = useMemo(() => readLaunchParams(), [])
  const [client, setClient] = useState<EngineClient | null>(null)
  const phase = useMatchStore((s) => s.phase)
  const connectionPhase = useMatchStore((s) => s.connectionPhase)
  const ended = useMatchStore((s) => s.ended)
  const setConnectionPhase = useMatchStore((s) => s.setConnectionPhase)
  const matchId = launch.matchId
  const initData = launch.initData

  useEffect(() => {
    setupTelegramChrome()
    if (!matchId) return
    const engineWs = getRuntimeConfig().engineWsUrl
    const c = new EngineClient(`${engineWs}?matchId=${encodeURIComponent(matchId)}`, initData)
    c.onMessage((m) => useMatchStore.getState().onServerMessage(m))
    c.onClose(() => setConnectionPhase('closed'))
    setConnectionPhase('connecting')
    c.connect()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClient(c)
    return () => c.close()
  }, [matchId, initData, setConnectionPhase])

  if (!launch.matchId) return <HomeScreen />
  if (ended) return <ResultScreen />
  if (connectionPhase === 'authed' && phase !== 'PENDING' && client) return <MatchScreen client={client} />
  return <BootScreen />
}
