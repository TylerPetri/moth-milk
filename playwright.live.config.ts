import { defineConfig } from '@playwright/test';
if (process.env.E2E_LIVE !== '1' || process.env.E2E_DISPOSABLE_SHOP !== '1' || !process.env.E2E_SHOP_ID || !process.env.E2E_BASE_URL) {
  throw new Error('Live tests require E2E_LIVE=1, E2E_DISPOSABLE_SHOP=1, E2E_SHOP_ID and E2E_BASE_URL. Use a disposable shop backed by Stripe TEST mode.');
}
export default defineConfig({ testDir: './e2e', testMatch: '**/live.spec.ts', timeout: 180000, workers: 1, retries: 0, reporter: 'list', use: { baseURL: process.env.E2E_BASE_URL, trace: 'off', screenshot: 'off' } });
