import type { Product } from './types/api.ts';
import { api } from '$lib/api.ts';
let cached: Product[] | undefined;
let pending: Promise<Product[]> | undefined;
export function cachedCatalog() { return cached; }
export async function catalog() {
  if (cached) return cached;
  pending ||= api('/v1/products?limit=100').then(({ products }) => { if (!Array.isArray(products)) throw Object.assign(new Error('Catalog response unavailable.'), { retryable: true }); return (cached = products); }).finally(() => { pending = undefined; });
  return pending;
}
export function invalidateCatalog() { cached = undefined; }
export function variantFor(items: Product[], slug: string, size: string) {
  return items.find((item) => item.is_active && item.attributes?.style_slug === slug && (item.attributes?.size === size || (!item.attributes?.size && size === 'One soft size')));
}
