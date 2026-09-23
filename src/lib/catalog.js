// @ts-nocheck
import { api } from '$lib/api.js';
let cached;
let pending;
export async function catalog() {
  if (cached) return cached;
  pending ||= api('/v1/products?limit=100').then(({ products }) => (cached = products || [])).finally(() => { pending = null; });
  return pending;
}
export function invalidateCatalog() { cached = undefined; }
export function variantFor(items, slug, size) {
  return items.find((item) => item.is_active && item.attributes?.style_slug === slug && (item.attributes?.size === size || (!item.attributes?.size && size === 'One soft size')));
}
