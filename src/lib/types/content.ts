import type { libraryBooks } from '../data/library.js';
import type { products } from '../data/products.js';

export type LibraryBook = (typeof libraryBooks)[number];
export type DisplayProduct = (typeof products)[number];
