Checkout cancellation and saved attempts are wired end to end. Deploy the matching backend first; see [CHECKOUT_CANCEL_FLOW.md](CHECKOUT_CANCEL_FLOW.md) for the API and rollout.

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
- book content and spine dimensions live in `src/lib/data/library.ts`
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

Import this project into Vercel with the **SvelteKit** framework preset. Keep the project root as this directory and use the default `npm run build` command. The Vercel adapter is configured in `svelte.config.ts`; no output directory or rewrite rule is needed. Vercel installs dependencies from `package-lock.json`.

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

The corner saves chosen stories through `GET/PUT /v1/auth/me/books`; confirmed, claimed purchases identify the apparel and plush shown as yours. Every library story has a complete photographed, illustrated and typeset book baked for the three approved desktop and three approved mobile sofa positions under `static/images/sofa-books/`. Each asset includes its front board, dyed binding, page block and contact shadow; the room backgrounds remain empty until a story is selected. Mobile also uses the distinct closed login book from the approved preview. The hotspots follow those six silhouettes, and the list uses the same completed cover artwork. Source previews and blank photographed book templates are in `assets/source/sofa-books/`. Rebuild with `python3 scripts/generate_sofa_books.py` after installing Pillow, numpy and fonttools and running `npm install`; it reads the existing story atlas and cover material. Labels and list entries reflect ownership. Purchase history becomes visible once the customer's email is verified. Auth tokens are held in browser session storage; checkout recovery is persistent on this browser. In stub mode, checkout posts `/v1/orders` with `pm_card_visa` and waits for `/v1/orders/{id}/checkout-status` if confirmation is still processing. In Stripe mode, checkout reserves stock through `/v1/orders/prepare`, mounts Stripe Payment Element, then waits for the checkout status to report `confirmed`. The same checkout UUID is reused after a dropped response or refresh. The server's expiry worker releases unpaid holds; active reserved intents stay recoverable until the backend finishes or expires them. Returning from a bank redirect resumes the stored checkout on the same browser.

Order confirmation emails link guests to `/en/register?email=...&proof=...`, and existing-account links use `/en/login`. The email and proof are moved out of the address bar and passed to the book when the visitor signs in; the account is verified as part of that request. Verification and password recovery links land on `/{locale}/verify-email` and `/{locale}/reset-password`.


## Checkout recovery and receipts

Pending checkout and the last 50 receipts are saved on this browser. A checkout snapshot keeps the original bag lines, contact/address, currency, server total and receipt key. Legacy session checkouts are recovered. Only purchased line IDs are removed when the backend confirms the order; new bag additions remain. Never interpret a Stripe browser result alone as order confirmation.

Status polling uses one cancellable loop, request timeouts and increasing delays. Slow confirmation and connection errors retain the checkout and never invite another payment. Active reservations cannot be discarded locally; terminal failed/cancelled checkouts can be retried. A payment received but failed order is shown conservatively because the current backend does not expose refund progress.

Confirmed receipts remain accessible in Your Corner and at `/checkout?order=ORDER_ID`. For emailed guest tracking links, configure the shop's `order_tracking_path` as `/checkout`. The existing backend email fragment `#proof=TOKEN` is accepted, removed from the address bar, and retained with the receipt. Order-status reads stay credential protected. Shipping displays pending, packed, shipped, in transit and delivered states, carrier/tracking number, and service unavailability separately. Cross-device item details remain in the order email: the existing guest endpoint returns status/shipping rather than a complete receipt.

Use explicit `PUBLIC_PAYMENT_MODE=stub` only with the test backend; other values use Stripe and require its publishable key. Check with `npm run check`, `npm test`, and `npm run build`. Run a Stripe test-mode checkout and delayed webhook/fulfillment exercise against the configured backend before release. Browser storage and guest receipt credentials are private to the device; clearing site data removes local receipts.


## Outage handling and browser tests

Shop, product and Your Corner pages show human-readable retry states for API failures. Stock errors never become “sold out.” Temporarily unavailable auth endpoints preserve the session. Checkout distinguishes an unavailable shipping update from an uncertain payment; uncertain payments retain the order credential and explicitly ask the customer not to pay again. Recovery checks run on focus, visible return and online events, with debounce and per-page guards. Background checkout polling pauses when the page is hidden. Bag contents and contact/address drafts now persist on this browser; a fresh context can recover using persistent storage alone.

Install and run the controlled browser suite:

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

The suite starts a production build/preview automatically on port 4173. It runs the actual storefront in Chromium at desktop and mobile sizes, intercepting only API and Stripe boundaries. It cannot charge a real card. Tests cover outage messages, internal-error redaction, manual and automatic retry, stock errors, delayed confirmation, lost reservation responses, idempotency, repeated recovery events, bag line preservation, refreshed receipts, private guest tracking links, unavailable shipping, session preservation and fresh-context checkout recovery. Each test also checks for uncaught browser errors. Failure screenshots/traces and an HTML report are local generated output; use `npx playwright show-report` to inspect them. Run `npm test` for storage/error unit checks and `npm run check` for Svelte diagnostics.

The separate live smoke test does not intercept API or Stripe responses. It creates one test order through the card form and waits for a real webhook-backed backend confirmation, then reloads the receipt and checks shipping. Run it only on a running storefront configured for a disposable shop, with matching Stripe test keys in frontend/backend and working webhook delivery:

```bash
E2E_LIVE=1 E2E_DISPOSABLE_SHOP=1 \
E2E_BASE_URL=http://localhost:5173 \
E2E_SHOP_ID=YOUR_DISPOSABLE_SHOP_UUID \
npm run test:e2e:live
```

Optional settings: `E2E_PRODUCT_SLUG` (default `mimi-plush`), `E2E_CUSTOMER_EMAIL` (default a unique example.test address). Live traces/screenshots are disabled to keep receipt credentials out of artifacts. The runner validates the shop header and actual Stripe test publishable key before paying. The test shop must have stock and permit the sample Montreal address. Carrier delivery transitions and actual email delivery still need your integration environment; a mocked guest link verifies the frontend proof/recovery flow only. No live integration pass is claimed by the controlled suite.


The confirmed checkout uses matching textured shipping/corner actions and an “All yours” heading. Sofa books use native responsive pictures rather than a canvas; their original artwork, positions and story hotspots are preserved. The receipt-to-corner regression checks image decoding/current sources after navigation, reload and viewport changes, plus signed-in selected stories.

## Storefront security and deployment

Authentication now goes through the SvelteKit `/session` server boundary. Access and refresh tokens are host-only HttpOnly cookies (Secure over HTTPS, SameSite Strict), never browser storage. POST/PUT requests require an exact same-origin Origin header. Only the storefront's required endpoints are forwarded; browser Authorization, cookies and proxy headers are not forwarded to the gateway. The backend still performs tenant and ownership authorization.

Deploy with the existing Vercel server adapter, not a static export. Set `API_ORIGIN` to the gateway's HTTPS URL reachable from the Vercel server, and `PUBLIC_API_URL` to its browser-reachable HTTPS URL. `PUBLIC_SHOP_ID` binds this storefront to its shop; without it the server resolves the storefront host itself. The private origin must not contain credentials or query parameters. Restart/rebuild after changing environment settings. Public API origin allowlisting for CSP is generated at build time. Use local HTTP only for local development.

Receipt status credentials live in bounded HttpOnly cookies (10 receipts, 30 days). Browser receipt summaries exclude address/contact details and credentials. The Your Corner forget action deletes receipt cookies and summaries. Older summaries are migrated on return; if the storefront server is unreachable, legacy credentials are preserved until migration can complete rather than silently losing an uncertain payment. Existing users must sign in once after legacy session tokens are removed.

Unsubmitted address drafts stay in session storage for at most 24 hours. Pending checkout contact details are kept in the current tab and an HttpOnly recovery cookie, while a minimal persistent recovery marker remains until payment status is resolved. Never expire or clear an unresolved payment marker automatically: that could invite a second payment. Completing an order clears the contact recovery cookie and pending details. An emailed order link can restore access after receipt cookies expire or are forgotten.

CSP allows Svelte's generated scripts and Stripe.js/3DS/Link frames, with inline styles retained for the site's position-based artwork. Other headers prohibit embedding, suppress referrers, disable unused device permissions and prevent MIME sniffing. Checkout, recovery, verification and reset responses are not cacheable. These are defense-in-depth measures; HttpOnly cookies do not prevent a script already running on the page from performing actions.

`npm audit` is clean at this pass. A compatible `cookie` 0.7.x override addresses the transitive advisory without forcing a SvelteKit downgrade; the unused static adapter was removed. Recheck advisories routinely.

Security browser tests exercise the actual SvelteKit server against a disposable local gateway fixture, including cookie-only tokens, logout, forged Origin rejection, restricted proxy endpoints, guest receipt recovery and security headers. Other resilience tests retain browser boundary fixtures. They do not certify a deployed gateway, reverse-proxy configuration, live Stripe payment or test/live isolation. The attached backend uses atomic session/bootstrap locking, trusted proxy resolution and durable payment webhook commits; production configuration and live tenant/payment checks still require the backend's own security suite.

Because authenticated requests now originate at the storefront server, ensure gateway rate limiting handles that proxy topology deliberately. Do not broadly trust client-supplied forwarding headers. Use an authenticated, narrowly trusted ingress before relying on forwarded client identity. Also run the guarded live Stripe smoke test before the demo: mocked card tests cannot validate a real Stripe challenge against the CSP.

### TypeScript

All application modules, Svelte scripts, configuration and test files use TypeScript. `src/lib/types/api.ts` describes wire contracts; API calls infer responses by route, and unrecognized routes return `unknown`. API amounts are minor units (cents), separate from display prices. Types do not replace runtime validation. The session proxy preserves HttpOnly credential storage, request limits and origin checks.

Use Node **22.18 or newer** (Node 24 is supported), then run `npm ci`, `npm run check`, `npm test` and `npm run test:e2e`. The Node minimum supports native TypeScript execution for unit tests and the disposable fixture server. Configuration is in `svelte.config.ts`, `vite.config.ts` and `playwright.config.ts`. Stripe types come from `@stripe/stripe-js`; the script loader and payment flow are unchanged.

When applying this ZIP over an existing folder, run `npm run cleanup:legacy` to remove the old `.js` source, configuration and test files that now have `.ts` counterparts, plus the replaced `jsconfig.json`. The script removes only files with an existing replacement; run `node scripts/remove-legacy-js.ts` for a preview. Keeping both versions can cause route/configuration conflicts. Keep your environment file.

## Closing an unfinished checkout

The textured **Cancel this checkout** action closes an unfinished attempt with `POST /v1/orders/{id}/checkout-cancel`. It sends the original checkout key through the same-origin cookie proxy. Tracking links alone cannot cancel an order.

The storefront keeps the bag and saved attempt until the server returns the matching order ID, `status: "failed"`, and `restart_allowed: true`. A replacement uses a fresh UUID. A failed request, timeout, or refused cancellation preserves the original checkout and offers recovery; paid/confirmed orders have no cancellation action. The backend's explicit `checkout_restart_allowed` prepare response also permits returning to details, without automatically creating a replacement payment.

Use the attached backend version that exposes this endpoint. No backend files or migrations were changed in this frontend pass.

Cancellation coverage is in `e2e/cancellation.spec.ts`; the real cookie-proxy checks are in `e2e/security.spec.ts`.

### A paid test checkout is stuck after a webhook failure

`checkout_recovery_pending` from cancellation means the backend could not prove
that the old payment can no longer complete. It can mean Stripe already succeeded,
the intent is processing, provider credentials are unavailable, or cleanup failed.
Keep the saved receipt key. A new key is permitted only after verified closure.

The checkout now continues bounded confirmation polling after a refused closure
and displays the saved order and backend request reference for support. It never
marks an order paid from browser Stripe state or silently creates another payment.

For the earlier **local test** payment that succeeded while events were forwarded
to `/v1/webhooks/stripe` instead of `/v1/webhooks/stripe/test`, recover the original
Stripe event with the included operator helper. In your terminal, set
`STRIPE_TEST_SECRET_KEY` to the same sandbox account used by the checkout and
`STRIPE_TEST_WEBHOOK_SECRET` to the signing secret currently loaded by payment.
Then, from this storefront directory:

```bash
python3 scripts/replay-stripe-test-event.py evt_YOUR_ORIGINAL_SUCCESS_EVENT \
  --order-id YOUR_SAVED_ORDER_UUID
```

The order check is optional, but useful when several checkouts are waiting.
The default destination is `http://localhost:8080/v1/webhooks/stripe/test`.
For a direct payment service connection, pass
`--url http://localhost:8087/v1/webhooks/stripe/test`.

This helper retrieves the existing event from Stripe, checks its test environment
and order metadata, signs the unchanged response with the local webhook secret,
and sends it through the normal webhook handler. It never creates a charge,
refunds a payment, or edits an order directly. It refuses live and connected-account
events, external destinations and redirects. Secrets and event bodies are not
printed. A 200 acknowledgement means the webhook was accepted; use the checkout's
**Check again** button to wait for asynchronous order confirmation. If replay
fails, inspect payment logs using the displayed request reference and retain the
original checkout. No actual Stripe call was performed during this change's tests.

Stripe event retrieval reference: https://docs.stripe.com/api/events/retrieve.

## Your Corner receipt drawer

Your receipts opens a drawer with Current and History tabs. Closed, cancelled, expired and refunded attempts stay in History. Processing payments and uncertain outcomes remain in Current; shipped orders remain there until delivered.

History entries can be hidden on this device and restored with Show hidden receipts. Hiding changes local display preferences only and keeps receipt credentials intact. Active payments cannot be hidden. Existing cancellation and receipt authorization use the same backend endpoints.

Textured action buttons use plain labels; directional arrows remain on a few quiet navigation links.

The receipts launcher sits quietly in the account bar beside Leave the room. A checkout closed by Check on it stays visible with Resolve × until dismissed; reloading puts it directly in History. Logged-in room items omit ownership labels.
