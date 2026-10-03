import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:4173';
const login = async (request) => {
 const response = await request.post('/session/v1/auth/login', { headers: { Origin: origin }, data: { email: 'reader@example.test', password: 'fixture-password' } });
 expect(response.ok()).toBeTruthy();
};
test('authenticated Corner renders the actual room before JavaScript, without exposing credentials', async ({ browser, viewport }, testInfo) => {
 const context = await browser.newContext({ baseURL: origin, javaScriptEnabled: false, viewport });
 await login(context.request);
 const cookies = await context.cookies(origin);
 expect(cookies.filter(cookie => ['mm_access', 'mm_refresh'].includes(cookie.name)).every(cookie => cookie.path === '/' && cookie.httpOnly)).toBeTruthy();
 const page = await context.newPage();
 const response = await page.goto('/your-corner');
 expect(response.headers()['cache-control']).toContain('no-store');
 const html = await response.text();
 expect(html).not.toContain('SERVER_ONLY_ACCESS'); expect(html).not.toContain('SERVER_ONLY_REFRESH');
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 await expect(page.locator('.corner-belonging--mimi-plush')).toHaveCount(1);
 await expect(page.locator('.corner-belonging--night-shift-hoodie')).toHaveCount(0);
 await expect(page.locator('.sofa-books picture')).toHaveCount(1);
 await page.screenshot({ path: testInfo.outputPath('room-before-javascript.png'), fullPage: true });
 await context.clearCookies({ name: 'mm_access' });
 await page.reload();
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 expect((await context.cookies(origin)).some(cookie => cookie.name === 'mm_access')).toBeTruthy();
 await context.close();
});
test('legacy session migrates securely and logout clears both scopes', async ({ context }) => {
 await context.addCookies([
  { name: 'mm_access', value: 'SERVER_ONLY_ACCESS', domain: '127.0.0.1', path: '/session', httpOnly: true, sameSite: 'Strict' },
  { name: 'mm_refresh', value: 'SERVER_ONLY_REFRESH', domain: '127.0.0.1', path: '/session', httpOnly: true, sameSite: 'Strict' }
 ]);
 expect((await context.request.get('/session/v1/auth/me')).ok()).toBeTruthy();
 expect((await context.cookies(origin)).some(cookie => cookie.name === 'mm_access' && cookie.path === '/')).toBeTruthy();
 await context.request.post('/session/v1/auth/logout', { headers: { Origin: origin } });
 expect((await context.cookies()).filter(cookie => ['mm_access', 'mm_refresh'].includes(cookie.name))).toHaveLength(0);
});
test('unknown session never server-renders guest possessions or a false empty receipt state', async ({ page }) => {
 const response = await page.goto('/your-corner');
 const html = await response.text();
 expect(html).not.toContain('class="corner-belonging corner-belonging--mimi-plush"');
 expect(html).not.toContain('Nothing waiting right now.');
 expect(html).toContain('Gathering your receipts');
 expect(html).toContain('as="font"');
 expect(html).toContain('/images/header-brocade.webp');
});

test('server room remains unchanged when delayed JavaScript hydrates', async ({ page, context }) => {
 await login(context.request);
 await page.route('**/v1/products?*', route => route.fulfill({ json: { products: [{ id: 'plush-id', is_active: true, amount: 4200, currency: 'CAD', attributes: { style_slug: 'mimi-plush', size: 'One soft size' } }] } }));
 let release; const hold = new Promise(resolve => { release = resolve; });
 await page.route('**/*.js', async route => { await hold; await route.continue(); });
 await page.goto('/your-corner', { waitUntil: 'commit' });
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 const objects = page.locator('.corner-belonging');
 const before = await objects.evaluateAll(nodes => nodes.map(node => node.className));
 await expect(page.locator('.sofa-books picture')).toHaveCount(1);
 release();
 await page.waitForLoadState('networkidle');
 expect(await objects.evaluateAll(nodes => nodes.map(node => node.className))).toEqual(before);
 await expect(page.locator('.sofa-books picture')).toHaveCount(1);
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 await expect(page.getByRole('dialog', { name: 'Your receipts.' })).toBeVisible();
});
