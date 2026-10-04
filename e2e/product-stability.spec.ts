// @ts-nocheck
import { test, expect, products, seed, item, details } from './helpers.ts';

test('size checks keep the button and paper steady and ignore late stock responses', async ({ page, app }) => {
 await page.route('**/v1/products?*', route => route.fulfill({ json: { products: [...products, { ...products[1], id: 'hoodie-s', attributes: { style_slug: 'night-shift-hoodie', size: 'S' } }, { ...products[1], id: 'hoodie-m', attributes: { style_slug: 'night-shift-hoodie', size: 'M' } }] } }));
 let releaseS; let releaseM; let reads = 0;
 await page.route('**/v1/stock/*', async route => {
  reads++;
  const id = route.request().url().split('/').pop();
  if (id === 'hoodie-s') await new Promise(r => releaseS = r);
  if (id === 'hoodie-m') await new Promise(r => releaseM = r);
  await route.fulfill({ json: { available: id === 'hoodie-s' ? 0 : 20 } }).catch(() => {});
 });
 await page.goto('/product/night-shift-hoodie');
 const add = page.locator('.add-button');
 await expect(add).toBeEnabled();
 const before = await page.locator('.product-detail__info').boundingBox();
 await page.getByRole('button', { name: 'S', exact: true }).click();
 await expect(add).toBeDisabled(); await expect(add).toContainText('add to bag');
 await expect(page.getByRole('status')).toContainText('Checking stock');
 const during = await page.locator('.product-detail__info').boundingBox();
 expect(during.height).toBeCloseTo(before.height, 0);
 await page.getByRole('button', { name: 'M', exact: true }).click();
 await expect.poll(() => Boolean(releaseM)).toBe(true);
 releaseM(); await expect(add).toBeEnabled(); releaseS();
 await expect(add).toContainText('add to bag');
 await page.getByRole('button', { name: 'XS', exact: true }).click();
 await expect(add).toBeEnabled(); expect(reads).toBe(3);
 await add.click();
 await expect(page.getByRole('complementary', { name: 'Shopping bag' })).toContainText('XS');
});

test('returning to the shop retains its loaded catalog without an empty frame', async ({ page, app }) => {
 await page.goto('/shop'); await expect(page.locator('.product-card')).toHaveCount(3);
 await page.locator('.product-card').filter({ hasText: 'Mimi' }).getByRole('link').first().click();
 await page.locator('.product-page__back').click();
 await expect(page.locator('.product-card')).toHaveCount(3);
 await expect(page.getByText('Finding your things…')).toHaveCount(0);
});

test('ordering keeps the textured button steady while preparation is pending', async ({ page, app }) => {
 await seed(page, { 'moth-milk-bag': [item] });
 app.prepareWait = new Promise(resolve => app.releasePrepare = resolve);
 await page.goto('/checkout'); await details(page);
 const button = page.getByRole('button', { name: 'Continue to payment' });
 const opacity = await button.evaluate(node => getComputedStyle(node).opacity);
 await button.click();
 const busy = page.getByRole('button', { name: 'A moment…' });
 await expect(busy).toBeDisabled(); await expect(busy).toHaveAttribute('aria-busy', 'true');
 expect(await busy.evaluate(node => getComputedStyle(node).opacity)).toBe(opacity);
 await expect(page.locator('.checkout-summary')).toContainText('Mimi Moth Plush');
 app.releasePrepare(); await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled();
});
