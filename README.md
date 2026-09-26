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

## Deploy on Vercel

Import this project into Vercel with the **SvelteKit** framework preset. Keep the project root as this directory and use the default `npm run build` command. The Vercel adapter is configured in `svelte.config.js`; no output directory or rewrite rule is needed. Vercel installs dependencies from `package-lock.json`.

Set these environment variables in the Vercel project for each deployment environment (Production and Preview as appropriate):

| Variable | Value |
| --- | --- |
| `PUBLIC_API_URL` | Public HTTPS URL of the backend gateway, without a trailing slash |
| `PUBLIC_SHOP_ID` | UUID printed by the Moth Milk backend seed script |
| `PUBLIC_PAYMENT_MODE` | `stub` for the backend payment stub, or `stripe` for Stripe Payment Element |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Only for Stripe mode: publishable key (`pk_test_…` or `pk_live_…`) |

These `PUBLIC_` values are embedded in browser code at build time. Vite is configured to expose only this prefix. Keep Stripe secret keys, webhook secrets, database credentials, and notification credentials on the backend only. Redeploy after changing a storefront variable.

Set the Moth Milk shop's backend storefront URL to the deployed Vercel URL (or its custom domain). Allow that exact origin in the gateway's CORS configuration. For Preview deployments, either configure the changing preview origins on the backend or use a stable preview domain and matching shop configuration. The gateway must be publicly reachable over HTTPS; `localhost` from `env.example` only works for local development. Point payment webhooks to the backend, not this Vercel storefront. The backend is deployed separately.

## Live Moth Milk wiring

Copy `env.example` to `.env`, then set `PUBLIC_API_URL` for your environment. The example contains the Moth Milk `PUBLIC_SHOP_ID` and defaults to `PUBLIC_PAYMENT_MODE=stub`, which posts `pm_card_visa` to `/v1/orders` for test orders without browser card entry. The backend must support that test payment method. When ready for real Stripe Payment Element payments, set `PUBLIC_PAYMENT_MODE=stripe`, add `PUBLIC_STRIPE_PUBLISHABLE_KEY`, and configure the backend's Stripe PaymentIntent keys and signed webhook. The backend also needs a matching storefront URL, `NOTIFICATION_URL`, and working mail delivery. From the backend repository, run `python3 scripts/seed/moth_milk.py` and enter the owner email, password, and storefront URL when prompted. It prints the shop UUID for `PUBLIC_SHOP_ID`; it creates each hoodie and tee size as a separate product and stock row. This package does not contain live credentials.

The corner saves chosen stories through `GET/PUT /v1/auth/me/books`; confirmed, claimed purchases identify the apparel and plush shown as yours. Every library story has a complete photographed, illustrated and typeset book baked for the three approved desktop and three approved mobile sofa positions under `static/images/sofa-books/`. Each asset includes its front board, dyed binding, page block and contact shadow; the room backgrounds remain empty until a story is selected. Mobile also uses the distinct closed login book from the approved preview. The hotspots follow those six silhouettes, and the list uses the same completed cover artwork. Source previews and blank photographed book templates are in `assets/source/sofa-books/`. Rebuild with `python3 scripts/generate_sofa_books.py` after installing Pillow, numpy and fonttools and running `npm install`; it reads the existing story atlas and cover material. Labels and list entries reflect ownership. Purchase history becomes visible once the customer's email is verified. Auth tokens and pending checkout are held in browser session storage. In stub mode, checkout posts `/v1/orders` with `pm_card_visa` and waits for `/v1/orders/{id}/checkout-status` if confirmation is still processing. In Stripe mode, checkout reserves stock through `/v1/orders/prepare`, mounts Stripe Payment Element, then waits for the checkout status to report `confirmed`. The same checkout UUID is reused after a dropped response or refresh. The server's expiry worker releases unpaid holds; starting over locally does not immediately cancel a reserved intent. Returning from a bank redirect resumes the stored checkout in the same browser tab.

Order confirmation emails link guests to `/en/register?email=...&proof=...`, and existing-account links use `/en/login`. The email and proof are moved out of the address bar and passed to the book when the visitor signs in; the account is verified as part of that request. Verification and password recovery links land on `/{locale}/verify-email` and `/{locale}/reset-password`.
