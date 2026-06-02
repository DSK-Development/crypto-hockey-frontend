import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { App } from './App'
import { useMatchStore } from '../store/match'

const mockConnect = vi.fn()
const mockClose = vi.fn()
const mockOnMessage = vi.fn()
const mockOnClose = vi.fn()

vi.mock('../runtimeConfig', () => ({
  getRuntimeConfig: () => ({
    botApiUrl: 'https://bot.example',
    engineWsUrl: 'wss://engine.example/ws',
  }),
  loadRuntimeConfig: vi.fn(() => Promise.resolve({
    botApiUrl: 'https://bot.example',
    engineWsUrl: 'wss://engine.example/ws',
  })),
}))

vi.mock('../telegram/webApp', () => ({
  readLaunchParams: vi.fn(() => ({ initData: 'mock', matchId: 'm1' })),
  setupTelegramChrome: vi.fn(),
  signIn: vi.fn(() => Promise.resolve({ ok: true } as const)),
  signInErrorMessage: vi.fn(() => ''),
  readInitData: vi.fn(() => 'mock'),
  impact: vi.fn(),
  showMainButton: vi.fn(),
  closeWebApp: vi.fn(),
}))

vi.mock('../engine-client/EngineClient', () => ({
  EngineClient: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    onMessage: mockOnMessage,
    onClose: mockOnClose,
    sendInput: vi.fn(),
    ping: vi.fn(),
  })),
}))

vi.mock('./MatchScreen', () => ({
  MatchScreen: () => <div data-testid="match-screen" />,
}))

describe('App routing', () => {
  beforeEach(() => {
    useMatchStore.getState().reset()
    vi.clearAllMocks()
  })

  it('shows BootScreen initially', () => {
    render(<App />)
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('connects to engine on mount with matchId', async () => {
    render(<App />)
    await waitFor(() => expect(mockConnect).toHaveBeenCalled())
  })

  it('shows MatchScreen once authed with client', async () => {
    render(<App />)
    // Wait for effect to run and client to be set
    await waitFor(() => expect(mockConnect).toHaveBeenCalled())
    // Simulate server sending AUTH_OK + LIVE phase
    const handler = mockOnMessage.mock.calls[0]?.[0]
    if (handler) {
      handler({ type: 'AUTH_OK', authOk: { playerSlot: 'A', opponent: { username: 'bob', telegramId: 2 } } })
      handler({ type: 'MATCH_STATE', matchState: { phase: 'LIVE' } })
    }
    await waitFor(() => expect(screen.getByTestId('match-screen')).toBeInTheDocument())
  })

  it('shows HomeScreen (not an error) when no matchId', async () => {
    const { readLaunchParams, readInitData } = await import('../telegram/webApp')
    vi.mocked(readLaunchParams).mockReturnValueOnce({ initData: '', matchId: null })
    vi.mocked(readInitData).mockReturnValue('')
    render(<App />)
    await waitFor(() => expect(screen.getByText(/open this app from the crypto hockey bot in telegram/i)).toBeInTheDocument())
    expect(screen.queryByText(/could not connect/i)).not.toBeInTheDocument()
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('shows HomeScreen with sign-in flow when initData is present', async () => {
    const { readLaunchParams, readInitData } = await import('../telegram/webApp')
    vi.mocked(readLaunchParams).mockReturnValueOnce({ initData: 'tg-init', matchId: null })
    vi.mocked(readInitData).mockReturnValue('tg-init')
    render(<App />)
    await waitFor(() => expect(screen.getByText(/signed in/i)).toBeInTheDocument())
  })
})
