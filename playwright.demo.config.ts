import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './e2e-boundaries', testMatch: 'demo.spec.ts', workers: 1, timeout: 60000,
 reporter: 'list', use: { baseURL: 'http://127.0.0.1:4173', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] } },
 projects: [{ name: 'desktop', use: devices['Desktop Chrome'] }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
 webServer: { command: 'npm run demo', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 120000 }
});
