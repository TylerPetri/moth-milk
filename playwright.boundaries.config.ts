import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './e2e-boundaries', testMatch: 'missing-backend.spec.ts', workers: 1, timeout: 30000,
 reporter: 'list', use: { baseURL: 'http://127.0.0.1:4175', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] } },
 projects: [{ name: 'desktop', use: devices['Desktop Chrome'] }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
 webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: false, timeout: 120000,
 env: { API_ORIGIN: '', PUBLIC_API_URL: '', PUBLIC_SHOP_ID: '', PUBLIC_PAYMENT_MODE: 'stripe', PUBLIC_STRIPE_PUBLISHABLE_KEY: '' } }
});
