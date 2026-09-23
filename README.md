# MOTH MILK

A multi-route SvelteKit 5 storefront and free horror-fiction library for the fictional MOTH MILK label.

The homepage combines a late-night bedroom editorial with a transparent torn lower edge, interactive room hotspots, an overlapping selectable list/shelf library, an in-browser story reader, and the existing apparel/plush shop.

`/your-corner` lives in the shared room. The dark book on the side table now opens working sign-in, registration, and recovery. On narrow screens the intact book shifts left beyond the viewport, keeping the right page and spine in their natural proportions. Hovering the light area dims the page; clicking it, clicking outside the book, or pressing Escape closes it. With backend configuration, chosen stories and verified purchase history personalize the room.

The mobile room photograph includes the closed book, three readable books, Mimi, the hoodie, and the tee. Each has its own transparent tap target. The image retains its portrait proportions on mobile so the hotspots stay aligned; the desktop room keeps its existing photographed book on the side table.

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

## Live Moth Milk wiring

Set `VITE_API_URL`, `VITE_SHOP_ID`, and `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` (see `.env.example`). The backend needs a matching storefront URL, `NOTIFICATION_URL`, working mail delivery, Stripe PaymentIntent keys, and a signed webhook. From the backend repository, set `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, and `MOTH_MILK_STOREFRONT_URL`, then run `python3 scripts/seed/moth_milk.py`. It prints the shop UUID for `VITE_SHOP_ID`; it creates each hoodie and tee size as a separate product and stock row. Use Stripe test keys and a webhook before testing checkout. This package does not contain live credentials.

The corner saves chosen stories through `GET/PUT /v1/auth/me/books`; confirmed, claimed purchases identify the apparel and plush shown as yours. The image depicts the shared room; selected cover art is blended over the sofa books while rack and plush remain part of the photograph. Labels and list entries reflect ownership. Purchase history becomes visible once the customer's email is verified. Auth tokens and the pending checkout are held in browser session storage. The checkout reserves stock through `/v1/orders/prepare`, mounts Stripe Payment Element, then waits for `/v1/orders/{id}/checkout-status` to report `confirmed`. The same checkout UUID is reused after a dropped response or refresh. The server's expiry worker releases unpaid holds; starting over locally does not immediately cancel a reserved intent. Returning from a bank redirect resumes the stored checkout in the same browser tab.

Order confirmation emails link guests to `/en/register?email=...&proof=...`, and existing-account links use `/en/login`. The email and proof are moved out of the address bar and passed to the book when the visitor signs in; the account is verified as part of that request. Verification and password recovery links land on `/{locale}/verify-email` and `/{locale}/reset-password`.
