import type { libraryBooks } from '../data/library.ts';
import type { products } from '../data/products.ts';

export type LibraryBook = (typeof libraryBooks)[number];
export type DisplayProduct = (typeof products)[number];
