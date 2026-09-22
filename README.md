# MOTH MILK

A multi-route SvelteKit 5 storefront and free horror-fiction library for the fictional MOTH MILK label.

The homepage combines a late-night bedroom editorial, interactive room hotspots, a selectable list/shelf library, an in-browser story reader, and the existing apparel/plush shop.

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
- the desktop shelf crops `static/images/empty-library-shelf-v1.webp` into independent top, side, and bottom wood-frame layers over a translucent cavity, so the bedroom and cursor light continue behind it instead of ending at a rectangular image boundary
- all 22 independently interactive alpha-masked bindings live in `static/images/transparent-spines-v1/`
- product photography uses WebP assets to keep the storefront and source archive small
- book content and spine dimensions live in `src/lib/data/library.js`
- reusable cover/spine renderers live in `src/lib/components/BookCover.svelte` and `BookSpine.svelte`

Typography is self-hosted through Fontsource: Bodoni Moda for the homepage wordmark and buttons, Montserrat for its subtitle, Cormorant Garamond for other editorial display, IBM Plex Sans Condensed for interface text, and Courier Prime for printed metadata and controls.

## Commands

```sh
npm install
npm run dev
npm run check
npm run build
```
