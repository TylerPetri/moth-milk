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
}

/** @param {string} lineId */
export function removeFromCart(lineId) {
  const index = ui.cart.findIndex((item) => item.lineId === lineId);
  if (index !== -1) ui.cart.splice(index, 1);
}
