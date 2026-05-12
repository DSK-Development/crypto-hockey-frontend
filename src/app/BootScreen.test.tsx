import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BootScreen } from './BootScreen'
import { useMatchStore } from '../store/match'

describe('BootScreen', () => {
  beforeEach(() => useMatchStore.getState().reset())

  it('shows connecting message by default', () => {
    render(<BootScreen />)
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('shows error message on error phase', () => {
    useMatchStore.getState().setConnectionPhase('error')
    render(<BootScreen />)
    expect(screen.getByText(/could not connect/i)).toBeInTheDocument()
  })

  it('shows closed message when connection closed', () => {
    useMatchStore.getState().setConnectionPhase('closed')
    render(<BootScreen />)
    expect(screen.getByText(/connection closed/i)).toBeInTheDocument()
  })
})
