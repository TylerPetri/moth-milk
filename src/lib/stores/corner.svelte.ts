import { auth, withAuth } from '$lib/stores/auth.svelte.ts';
import { friendlyError } from '$lib/recovery.js';
import { libraryBooks } from '$lib/data/library.js';

export const corner = $state({ slugs: [] as string[], loaded: false, busy: false, error: '' });
export async function loadCorner() {
  if (!auth.refresh) { Object.assign(corner, { slugs: [] as string[], loaded: true, error: '' }); return; }
  try {
    const data = await withAuth('/v1/auth/me/books');
    corner.slugs = data.books.filter((slug) => libraryBooks.some((book) => book.slug === slug));
    corner.error = '';
  } catch (error) { corner.error = friendlyError(error); }
  corner.loaded = true;
}
export async function toggleCornerBook(slug: string) {
  if (!auth.refresh) throw new Error('Open the book in your corner to keep a story.');
  if (!libraryBooks.some((book) => book.slug === slug)) throw new Error('Story not found.');
  if (corner.busy) return;
  corner.busy = true;
  const next = corner.slugs.includes(slug) ? corner.slugs.filter((entry) => entry !== slug) : [...corner.slugs, slug];
  try {
    const response = await withAuth('/v1/auth/me/books', { method: 'PUT', body: JSON.stringify({ books: next }) });
    corner.slugs = response.books;
    corner.error = '';
  } catch (error) { corner.error = friendlyError(error); throw error; }
  finally { corner.busy = false; }
}
