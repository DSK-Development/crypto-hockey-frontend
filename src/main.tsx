import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './app/App'
import { loadRuntimeConfig } from './runtimeConfig'

const root = document.getElementById('root')!

void loadRuntimeConfig().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
