# MOTH MILK

A multi-route SvelteKit 5 storefront and free horror-fiction library for the fictional MOTH MILK label.

The homepage combines a late-night bedroom editorial with a transparent torn lower edge, interactive room hotspots, an overlapping selectable list/shelf library, an in-browser story reader, and the existing apparel/plush shop.

`/your-corner` is a visual account-space prototype in the same shared room. The dark book on the side table opens a small sign-in/register interface with email and password fields. On narrow screens the intact book shifts left beyond the viewport, keeping the right page and spine in their natural proportions. Warm ambient light falls from outside the upper-right screen edge. Hovering that light area dims the book; clicking it, clicking outside the book, or pressing Escape closes it. Authentication requests are not wired to an API; submitting clearly reports that details were not sent or saved. Connect the form to the real shop auth contract before presenting it as live sign-in.

## Style architecture

All styling is raw SCSS under `src/styles/`:

- `abstracts/`: tokens, functions, and mixins
- `base/`: reset, typography, and global foundations
- `layout/`: site-wide header, footer, and content-shell rules
- `components/`: reusable UI component styles
- `pages/`: route-specific compositions
- `main.scss`: the single ordered entry point

Physical surfaces are reusable rather than page-specific:

- SCSS material mixins live in `src/styles/abstracts/_mixins.scss`
- procedural SVG archive paper, general paper, cloth, leather, brocade, ink, and wood textures live in `static/textures/`
- compact photographic material and cover-art atlases live in `static/images/book-material-atlas-v1.webp` and `horror-cover-atlas-v1.webp`
- the shelf uses a single transparent dark-walnut frame (`static/images/empty-library-shelf-v2.webp`) with a plain wood top beam, side posts, and a lower lip around the interactive spines
- all 22 independently interactive alpha-masked bindings live in `static/images/transparent-spines-v2/`
- product photography uses WebP assets to keep the storefront and source archive small
- book content and spine dimensions live in `src/lib/data/library.js`
- reusable cover/spine renderers live in `src/lib/components/BookCover.svelte` and `BookSpine.svelte`

The homepage wordmark and subtitle are transparent image assets based on the printed reference, with accessible text alternatives. The header reuses the wordmark over a dark brocade image layer. Typography elsewhere is self-hosted through Fontsource: Bodoni Moda for the hero buttons, Cormorant Garamond for editorial display, IBM Plex Sans Condensed for interface text, and Courier Prime for printed metadata and controls.

## Commands

```sh
npm install
npm run dev
npm run check
npm run build
```
