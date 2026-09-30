// @ts-nocheck
import { test, expect, seed, receipt, orderId } from './helpers.js';
async function checkBooks(page, slugs = ['static', 'hush', 'underbed']) {
 await expect(page.locator('.sofa-books img')).toHaveCount(slugs.length);
 const mode = page.viewportSize().width <= 900 ? 'mobile' : 'desktop';
 for (let index = 0; index < slugs.length; index++) {
   const image = page.locator('.sofa-books img').nth(index);
   await expect(image).toBeVisible();
   await expect.poll(() => image.evaluate((img, filename) => img.complete && img.naturalWidth > 0 && img.currentSrc.endsWith(filename), `${slugs[index]}-${mode}-${index + 1}.webp`)).toBe(true);
 }
}
test('confirmed receipt actions match, and navigation/reload/resize keep all sofa books visible', async ({ page, app }, testInfo) => {
 app.status = 'confirmed'; await seed(page, { 'moth-milk-receipts': [receipt] });
 await page.goto(`/checkout?order=${orderId}`);
 await expect(page.getByRole('status')).toContainText('Your order is confirmed');
 await expect(page.getByRole('heading', { name: 'All yours.' })).toBeVisible();
 const shipping = page.getByRole('button', { name: 'Track your things ↗' });
 const corner = page.getByRole('link', { name: 'Your corner ↗' });
 await expect(shipping).toBeEnabled(); await expect(corner).toBeVisible();
 const style = node => { const css = getComputedStyle(node); return [css.fontFamily, css.fontSize, css.color, css.padding, css.border, css.backgroundImage]; };
 expect(await shipping.evaluate(style)).toEqual(await corner.evaluate(style));
 await page.locator('.checkout-tv').screenshot({ path: `/tmp/moth-confirmed-${testInfo.project.name}.png` });
 await shipping.click();
 await expect(page.getByRole('heading', { name: 'Your things.' })).toBeFocused();
 await expect(page).toHaveURL(/view=tracking/);
 await expect(page.getByText('Your order is confirmed and waiting to be packed.', { exact: true })).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading', { name: 'Your things.' })).toBeVisible();
 await page.getByRole('button', { name: '← Your receipt' }).click();
 await expect(page.getByRole('heading', { name: 'All yours.' })).toBeFocused();
 await corner.click(); await expect(page).toHaveURL(/\/your-corner$/);
 await expect(page.locator('.corner-books button')).toHaveCount(3); await checkBooks(page);
 await page.locator('.corner-books button').first().click(); await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button', { name: 'Close reader', exact: true }).click();
 await page.reload(); await checkBooks(page);
 await page.setViewportSize(page.viewportSize().width > 900 ? { width: 390, height: 844 } : { width: 1280, height: 800 }); await checkBooks(page);
});
test('signed-in saved stories render their own responsive artwork', async ({ page, app }) => {
 await page.addInitScript(() => sessionStorage.setItem('moth-milk-session', JSON.stringify({ access: 'access', refresh: 'refresh', expires: 4070908800000, userId: 'reader', email: 'reader@example.test', verified: true })));
 await page.goto('/your-corner'); await expect(page.locator('.corner-books button')).toHaveCount(1);
 await checkBooks(page, ['static']);
});
