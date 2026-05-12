import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: [
    { command: 'node tests/e2e/mock-server.mjs', port: 8090, reuseExistingServer: true },
    { command: 'VITE_ENGINE_WS_URL=ws://localhost:8090/ws npm run dev', port: 5173, reuseExistingServer: true },
  ],
})
