import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80 },
      exclude: [
        'src/game/Stage.ts',      // Pixi canvas — requires WebGL runtime
        'src/telegram/webApp.ts', // Telegram SDK wrapper — requires Telegram WebView
        'src/app/MatchScreen.tsx', // Pixi canvas initialised in effect — E2E tested
        'src/main.tsx',           // Entry point
        'playwright.config.ts',
        'eslint.config.js',
        'vite.config.ts',
        'vitest.config.ts',
        'server.js',
        'dist/**',
        'tests/**',
        'node_modules/**',
      ],
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})
