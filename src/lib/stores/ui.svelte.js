/**
 * @typedef {Object} StoreProduct
 * @property {string} slug
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {string} color
 * @property {string[]} sizes
 */

/** @type {Array<StoreProduct & { selectedSize: string, lineId: string }>} */
const initialCart = [];
const cartKey = 'moth-milk-bag';
export function initCart() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const saved = JSON.parse(sessionStorage.getItem(cartKey) || '[]');
    if (Array.isArray(saved)) ui.cart = saved.filter((item) => typeof item.slug === 'string' && typeof item.selectedSize === 'string' && typeof item.lineId === 'string');
  } catch { ui.cart = []; }
}
export function persistCart() { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(cartKey, JSON.stringify(ui.cart)); }

export const ui = $state({
  mood: 'soft',
  cartOpen: false,
  cart: initialCart,
  menuOpen: false
});

/** @param {StoreProduct} product @param {string} [size] */
export function addToCart(product, size = product.sizes[0]) {
  ui.cart.push({ ...product, selectedSize: size, lineId: `${product.slug}-${Date.now()}` });
  ui.cartOpen = true;
  persistCart();
}

/** @param {string} lineId */
export function removeFromCart(lineId) {
  const index = ui.cart.findIndex((item) => item.lineId === lineId);
  if (index !== -1) ui.cart.splice(index, 1);
  persistCart();
}
