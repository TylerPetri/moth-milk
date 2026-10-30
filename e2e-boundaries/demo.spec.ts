import { test, expect } from '@playwright/test';
test('loopback rehearsal places a simulated order with no Stripe or external browser traffic', async ({ page }) => {
 const external: string[] = [];
 await page.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.hostname !== '127.0.0.1') { external.push(url.origin); return route.abort(); }
  return route.continue();
 });
 await page.goto('/product/mimi-plush'); await expect(page.getByRole('note')).toContainText('simulated locally');
 await page.getByRole('button', { name: /add to bag/i }).click();
 await page.goto('/checkout');
 await page.getByLabel('Email address').fill('reader@example.test');
 await page.getByLabel('First name').fill('June'); await page.getByLabel('Last name').fill('Reader');
 await page.getByLabel('Street address').fill('12 Moon Street'); await page.getByLabel('City', { exact: true }).fill('Montreal');
 await page.getByLabel('Province / region').fill('QC'); await page.getByLabel('Postal code').fill('H2H2H2');
 await page.getByRole('button', { name: /Continue to payment/ }).click();
 await page.getByRole('button', { name: 'Place test order' }).click();
 await expect(page.getByRole('heading', { name: 'All yours.' })).toBeVisible();
 expect(external).toEqual([]);
});
