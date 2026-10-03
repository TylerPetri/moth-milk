import type { PageServerLoad } from './$types';
import type { Product, Order } from '$lib/types/api.ts';
export const load: PageServerLoad = async ({ parent, fetch }) => {
  const { session } = await parent();
  if (!session) return { room: null };
  async function read(path: string) {
    const response = await fetch(`/session${path}`);
    if (!response.ok) throw new Error('Room unavailable');
    return response.json();
  }
  const books = await read('/v1/auth/me/books').catch(() => null);
  const goods = session.verified ? await Promise.all([
    read(`/v1/users/${encodeURIComponent(session.userId)}/orders?limit=100`), read('/v1/products?limit=100')
  ]).catch(() => null) : null;
  const owned = goods ? [...new Set((goods[0].orders as Order[]).filter(order => order.status === 'confirmed').flatMap(order => order.items).map(item => (goods[1].products as Product[]).find(product => product.id === item.product_id)?.attributes?.style_slug).filter((slug): slug is string => Boolean(slug)))] : [];
  return { room: { books: Array.isArray(books?.books) ? books.books as string[] : [], owned, loaded: Boolean(books && (!session.verified || goods)) } };
};
