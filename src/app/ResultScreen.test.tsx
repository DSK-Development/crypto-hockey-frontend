import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultScreen } from './ResultScreen'
import { useMatchStore } from '../store/match'

vi.mock('../telegram/webApp', () => ({
  closeWebApp: vi.fn(),
  showMainButton: vi.fn(),
}))

describe('ResultScreen', () => {
  beforeEach(() => useMatchStore.getState().reset())

  function applyMatchEnd(opts: { winnerUserId: string | null; reason: 'score' | 'timeout' | 'forfeit' | 'no_join'; finalScore: { a: number; b: number } }) {
    useMatchStore.getState().onServerMessage({ type: 'AUTH_OK', authOk: { playerSlot: 'A', opponent: { username: 'bob', telegramId: 2 } } })
    useMatchStore.getState().onServerMessage({ type: 'MATCH_END', matchEnd: opts })
  }

  it('shows You won when slot A and a > b', () => {
    applyMatchEnd({ winnerUserId: 'u1', reason: 'score', finalScore: { a: 5, b: 3 } })
    render(<ResultScreen />)
    expect(screen.getByText(/you won/i)).toBeInTheDocument()
  })

  it('shows You lost when slot A and a < b', () => {
    applyMatchEnd({ winnerUserId: 'u2', reason: 'score', finalScore: { a: 2, b: 5 } })
    render(<ResultScreen />)
    expect(screen.getByText(/you lost/i)).toBeInTheDocument()
  })

  it('shows Match cancelled on no_join', () => {
    applyMatchEnd({ winnerUserId: null, reason: 'no_join', finalScore: { a: 0, b: 0 } })
    render(<ResultScreen />)
    expect(screen.getByText(/match cancelled/i)).toBeInTheDocument()
  })

  it('shows final score', () => {
    applyMatchEnd({ winnerUserId: 'u1', reason: 'score', finalScore: { a: 5, b: 3 } })
    render(<ResultScreen />)
    expect(screen.getByText('5 : 3')).toBeInTheDocument()
  })

  it('shows reason', () => {
    applyMatchEnd({ winnerUserId: 'u1', reason: 'timeout', finalScore: { a: 3, b: 2 } })
    render(<ResultScreen />)
    expect(screen.getByText(/timeout/i)).toBeInTheDocument()
  })
})
