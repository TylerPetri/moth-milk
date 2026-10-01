import { api } from '$lib/api.js';
/** @type {import('./types/api.js').Product[] | undefined} */
let cached;
/** @type {Promise<import('./types/api.js').Product[]> | undefined} */
let pending;
export async function catalog() {
  if (cached) return cached;
  pending ||= api('/v1/products?limit=100').then(({ products }) => { if (!Array.isArray(products)) throw Object.assign(new Error('Catalog response unavailable.'), { retryable: true }); return (cached = products); }).finally(() => { pending = undefined; });
  return pending;
}
export function invalidateCatalog() { cached = undefined; }
/** @param {import('./types/api.js').Product[]} items @param {string} slug @param {string} size */
export function variantFor(items, slug, size) {
  return items.find((item) => item.is_active && item.attributes?.style_slug === slug && (item.attributes?.size === size || (!item.attributes?.size && size === 'One soft size')));
}
