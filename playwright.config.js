// @ts-nocheck
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testIgnore: '**/live.spec.js', timeout: 60000, expect: { timeout: 15000 },
  fullyParallel: true, workers: 2, retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), ...(process.env.PLAYWRIGHT_CHROMIUM_ARGS ? { args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS) } : {}) } },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 120000,
    env: { PUBLIC_API_URL: '', PUBLIC_SHOP_ID: '11111111-1111-4111-8111-111111111111', PUBLIC_PAYMENT_MODE: 'stripe', PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_controlled_browser_fixture' } }
});
