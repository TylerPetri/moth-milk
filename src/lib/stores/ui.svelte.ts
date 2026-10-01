import { readSaved, writeSaved } from '$lib/checkout.js';
import type { CartLine, StoreProduct } from '$lib/types/checkout.js';
const initialCart: CartLine[] = [];
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

export function addToCart(product: StoreProduct, size = product.sizes[0]) {
  ui.cart.push({ ...product, selectedSize: size, lineId: crypto.randomUUID() });
  ui.cartOpen = true;
  persistCart();
}

export function removeFromCart(lineId: string) {
  const index = ui.cart.findIndex((item) => item.lineId === lineId);
  if (index !== -1) ui.cart.splice(index, 1);
  persistCart();
}
