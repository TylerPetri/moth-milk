import { readSaved, writeSaved } from '$lib/checkout.js';
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
    const saved = readSaved(cartKey) || [];
    if (Array.isArray(saved)) ui.cart = saved.filter((item) => typeof item.slug === 'string' && typeof item.selectedSize === 'string' && typeof item.lineId === 'string');
  } catch { ui.cart = []; }
}
export function persistCart() { if (typeof window !== 'undefined') writeSaved(cartKey, $state.snapshot(ui.cart)); }

export const ui = $state({
  mood: 'soft',
  cartOpen: false,
  cart: initialCart,
  menuOpen: false
});

/** @param {StoreProduct} product @param {string} [size] */
export function addToCart(product, size = product.sizes[0]) {
  ui.cart.push({ ...product, selectedSize: size, lineId: crypto.randomUUID() });
  ui.cartOpen = true;
  persistCart();
}

/** @param {string} lineId */
export function removeFromCart(lineId) {
  const index = ui.cart.findIndex((item) => item.lineId === lineId);
  if (index !== -1) ui.cart.splice(index, 1);
  persistCart();
}
