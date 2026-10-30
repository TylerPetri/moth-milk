// Run while the controlled Playwright webServer is available on 4173.
// This captures the actual UI with synthetic catalog data; no backend/payment calls.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const output = process.env.CAPTURE_OUTPUT_DIR || 'docs/screenshots';
const products = [
 { id: 'plush-id', is_active: true, amount: 4200, currency: 'CAD', attributes: { style_slug: 'mimi-plush', size: 'One soft size' } },
 { id: 'hoodie-id', is_active: true, amount: 11800, currency: 'CAD', attributes: { style_slug: 'night-shift-hoodie', size: 'XS' } },
 { id: 'tee-id', is_active: true, amount: 5400, currency: 'CAD', attributes: { style_slug: 'after-hours-baby-tee', size: 'XS' } }
];
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
try {
  await mkdir(output, { recursive: true });
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]] as const) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: name === 'mobile', hasTouch: name === 'mobile' });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1') return route.abort();
      if (url.pathname.includes('/v1/')) return route.fulfill({ json: url.pathname.includes('/products') ? { products } : { error: 'unauthorized' }, status: url.pathname.includes('/products') ? 200 : 401 });
      return route.continue();
    });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/home-${name}.png` });
    if (name === 'desktop') {
      await page.goto('http://127.0.0.1:4173/shop', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${output}/shop-desktop.png`, fullPage: true });
    }
    await page.close();
  }
} finally { await browser.close(); }
