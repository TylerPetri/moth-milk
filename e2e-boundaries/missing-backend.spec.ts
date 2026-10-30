import { test, expect } from '@playwright/test';
test('missing backend leaves the visual room available and proxy fails closed without internals', async ({ page }) => {
 await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
 await page.goto('/'); await expect(page.getByRole('heading', { name: 'Moth Milk', exact: true })).toBeVisible();
 const response = await page.request.get('/session/v1/auth/storefront');
 expect(response.status()).toBe(503); expect(await response.json()).toEqual({ error: 'unavailable', message: 'The room is temporarily unavailable.' });
 expect(response.headers()['cache-control']).toContain('no-store');
 await page.goto('/shop'); await expect(page.getByRole('status')).toContainText('Something’s wrong on our end');
 await expect(page.locator('body')).not.toContainText('API_ORIGIN');
});
