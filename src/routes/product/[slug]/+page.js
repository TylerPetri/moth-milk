import { error } from '@sveltejs/kit';
import { products } from '$lib/data/products.js';

export function entries() {
  return products.map(({ slug }) => ({ slug }));
}

export function load({ params }) {
  const product = products.find((item) => item.slug === params.slug);
  if (!product) error(404, 'This object wandered off.');
  return { product };
}
