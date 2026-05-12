import { test, expect } from '@playwright/test'

test('full match smoke', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', err => console.log('PAGE ERROR:', err))
  // Stub @twa-dev/sdk before page scripts run.
  await page.addInitScript(() => {
    ;(globalThis as { Telegram?: unknown }).Telegram = {
      WebApp: {
        initData: 'mock-init',
        initDataUnsafe: {},
        ready: () => {}, expand: () => {},
        setHeaderColor: () => {}, setBackgroundColor: () => {},
        MainButton: { setText: () => {}, onClick: () => {}, show: () => {}, hide: () => {} },
        HapticFeedback: { impactOccurred: () => {} },
        close: () => {},
      },
    }
  })
  await page.goto('/#matchId=m1')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('You won', { exact: false })).toBeVisible({ timeout: 6000 })
})
