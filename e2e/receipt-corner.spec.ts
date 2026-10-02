// @ts-nocheck
import { test, expect, seed, receipt, orderId, item, details } from './helpers.ts';
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
 const shipping = page.getByRole('button', { name: 'Track your things' });
 const corner = page.locator('.checkout-receipt__actions').getByRole('link', { name: 'Your corner', exact: true });
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
 app.signedIn = true;
 await page.goto('/your-corner'); await expect(page.locator('.corner-books button')).toHaveCount(1);
 await checkBooks(page, ['static']);
});

test('signed-in reader can forget device receipts without signing out', async ({ page, app }) => {
 app.signedIn = true; app.status = 'confirmed';
 await seed(page, { 'moth-milk-receipts': [receipt] });
 await page.goto('/your-corner');
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Your receipts', exact: true }).click();
 await page.getByRole('button', { name: 'Forget this device’s receipts' }).click();
 await page.getByRole('button', { name: 'History', exact: true }).click();
 await expect(page.getByRole('region', { name: 'Your receipt history' }).getByRole('article')).toHaveCount(0);
 await page.getByRole('button', { name: 'Back to the room' }).click();
 expect(await page.evaluate(() => localStorage.getItem('moth-milk-receipts'))).toBeNull();
 await expect(page.getByText('reader@example.test', { exact: true })).toBeVisible();
 await expect(page.locator('.recovery-notice')).toHaveCount(0);
});

test('account book explains validation, duplicate registration and incorrect login', async ({ page, app }) => {
 await page.goto('/your-corner');
 await page.getByRole('button', { name: 'Open the sign-in and registration book' }).click();
 const book = page.getByRole('dialog');
 await book.getByRole('button', { name: 'register', exact: true }).click();
 await book.getByLabel('Email', { exact: true }).fill('reader@example.test');
 await book.getByLabel('Password', { exact: true }).fill('short');
 await book.locator('button[type="submit"]').click();
 await expect(book.getByRole('status')).toContainText('at least 8 characters');
 await book.getByLabel('Password', { exact: true }).fill('long-enough-password');
 await book.locator('button[type="submit"]').click();
 await expect(book.getByRole('status')).toContainText('Already in the books');
 await book.getByRole('button', { name: 'sign in', exact: true }).click();
 await book.locator('button[type="submit"]').click();
 await expect(book.getByRole('status')).toContainText('email and password don’t match');
 await expect(book).not.toContainText('PRIVATE');
});

 test('card payment can leave confirmation and display purchased clothes on the rack', async ({ page, app }) => {
 app.signedIn = true;
 app.orderItems = [{ product_id: 'hoodie-id' }, { product_id: 'tee-id' }];
 const clothes = [
  { ...item, slug: 'night-shift-hoodie', name: 'Night Shift Hoodie', selectedSize: 'XS', price: 118, lineId: 'hoodie-line' },
  { ...item, slug: 'after-hours-baby-tee', name: 'After Hours Baby Tee', selectedSize: 'XS', price: 54, lineId: 'tee-line' }
 ];
 await seed(page, { 'moth-milk-bag': clothes });
 await page.goto('/checkout');
 await details(page);
 await page.getByRole('button', { name: /Continue to payment/ }).click();
 await expect(page.getByText('Secure card fixture')).toBeVisible();
 app.status = 'confirmed';
 await page.getByRole('button', { name: /Place order/ }).click();
 await expect(page.getByRole('heading', { name: 'All yours.' })).toBeVisible();
 await page.locator('.checkout-receipt__actions').getByRole('link', { name: 'Your corner', exact: true }).click();
 for (const slug of ['night-shift-hoodie', 'after-hours-baby-tee']) {
  const image = page.locator(`.corner-belonging--${slug} img`);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
 }
 await page.reload();
 await expect(page.locator('.corner-belonging--night-shift-hoodie img')).toBeVisible();
 await expect(page.locator('.corner-belonging--after-hours-baby-tee img')).toBeVisible();
});

test('Corner items return to the room after reload; direct products return to shop', async ({ page, app }) => {
 app.signedIn = true;
 await page.goto('/your-corner');
 await page.getByRole('link', { name: 'Meet Mimi Moth Plush', exact: true }).click();
 const back = page.getByRole('link', { name: '← back to your corner' });
 await expect(back).toHaveAttribute('href', '/your-corner');
 await page.reload();
 await expect(back).toBeVisible();
 await back.click();
 await expect(page).toHaveURL(/\/your-corner$/);
 await page.goto('/product/mimi-plush');
 await expect(page.getByRole('link', { name: '← back to shop' })).toHaveAttribute('href', '/shop');
});
