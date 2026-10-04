# Moth Milk

A SvelteKit 5 storefront and free horror-fiction library with an after-hours bedroom atmosphere. Apparel, plush, stories and customer accounts share the room; styling uses raw SCSS and existing photographic/textured assets.

## Getting started

Use Node **22.18 or newer**. Install the locked dependencies and configure the gateway:

```sh
npm ci
cp env.example .env
npm run dev
```

Set `.env` for your environment:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_API_URL` | Browser-reachable backend gateway URL |
| `API_ORIGIN` | Private server-to-server gateway URL; defaults to `PUBLIC_API_URL` |
| `PUBLIC_SHOP_ID` | This storefront's verified existing shop UUID. Leave empty only when the backend resolves the exact storefront host |
| `PUBLIC_PAYMENT_MODE` | `stripe` for normal checkout; `stub` only for an explicitly configured local test backend |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching Stripe publishable key for Stripe checkout |

The example deliberately has no shop UUID. Authentication fails closed if the shop cannot be resolved; cookies never determine the storefront's intended shop. Public variables are embedded in browser code. Keep database credentials, operator tokens, Stripe secret/webhook keys and mail credentials on the backend. Use HTTPS gateway origins in production, without embedded credentials or query parameters. Rebuild after changing public settings.

## Project structure

| Location | Contents |
| --- | --- |
| `src/routes/` | Home, shop, products, lookbook, broadcasts, Your Corner, checkout and account-link pages |
| `src/routes/session/[...path]/+server.ts` | Restricted same-origin cookie proxy for customer/session and checkout operations |
| `src/lib/components/` | Shared navigation, library, cart and receipt components |
| `src/lib/stores/` | Browser account, room and cart state |
| `src/lib/types/` | API, checkout, content and Stripe types; runtime checks still validate critical responses |
| `src/lib/data/` | Story content, display product data and room positions; backend prices determine checkout totals |
| `src/styles/` | SCSS abstracts, base, layout, components and pages; `main.scss` is the entry point |
| `static/images/`, `static/textures/` | Wordmark, room/product artwork, individual book assets and material textures |
| `tests/`, `e2e/` | Unit, controlled browser and guarded live checkout checks |
| `scripts/` | Asset-generation, legacy-source cleanup and local Stripe test-event utilities |

Typography is self-hosted through Fontsource: Cormorant Garamond, IBM Plex Sans Condensed, Courier Prime and Bodoni Moda. Existing assets, book positions and interactive room hotspots are part of the design. The mobile navigation closes on outside taps, navigation and Escape.

## Customer accounts and Your Corner

Customer identities belong to one shop. The storefront uses `/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/me`, `/me/books`, `/email/verify/*` and `/password/reset/*`. These are customer endpoints; global dashboard login and shop-switch routes are excluded.

Login, registration, refresh, logout, verification confirmation and password recovery send the resolved shop scope without a stale access header. Critical session responses must match the intended shop and customer identity/roles. Supplied browser headers or refresh-token fields cannot override server scope or HttpOnly credentials.

Access/refresh tokens are host-only HttpOnly cookies, Secure over HTTPS with SameSite Strict. Browser responses contain session markers, not usable tokens. The server validates the session for personalized rendering; books and owned item slugs load before Your Corner renders. Temporary API failures do not masquerade as an empty account. Valid legacy `/session` cookies migrate to `/`; logout clears both auth-cookie scopes while preserving separate receipt recovery credentials.

Verification/reset links land on `/{locale}/verify-email` and `/{locale}/reset-password`. Guest account links use the existing login/register landing routes and signed email proof. Account routes include EN/FR/ES entries, but current visible storefront copy is English. Successful password reset clears the local account session.

Chosen books use `GET/PUT /v1/auth/me/books`. Verified customer order history determines owned apparel/plush. Your receipts opens Current/History beside Leave the room. Uncertain payments remain current; terminal receipts belong in history. Checking a closed receipt preserves its position until Resolve, and reload places the checked closure in history. Hiding history changes device-local display preferences, not order records or receipt authorization.

Refresh/logout share browser Web Locks when supported; concurrent refreshes are also coalesced within a server process. **Multiple server instances need shared refresh coordination or session affinity.** The in-memory coordinator is not a distributed lock; browsers without Web Locks retain per-tab coordination only.

## Checkout, receipts and recovery

Stripe checkout reserves through `POST /v1/orders/prepare`, mounts Payment Element and waits for backend confirmation. A browser Stripe result alone never confirms the order. Explicit local stub mode posts `/v1/orders` with the backend's test payment method; do not use it for production.

Status, resumption and cancellation use `/v1/orders/{id}/checkout-status`, `/checkout-resume` and `/checkout-cancel`. The original receipt key can authorize these operations independently of an unrelated login cookie. A tracking proof authorizes status reads only. Access authorization is omitted only when the requested operation has the required receipt capability; account-only reads and checkout creation retain customer authorization and ownership checks.

An unfinished checkout can be replaced only after the backend verifies closure and permits restart. Cancellation retains the saved checkout and bag until the matching order returns the required closed state. Timeouts, refusal, processing payments and uncertain outcomes preserve the original attempt and ask the customer not to pay again. A replacement uses a fresh key; paid/confirmed orders have no unfinished-checkout cancellation action. Order failure and cancellation do not themselves imply a completed refund.

The customer tracking path should be configured as `/checkout`. Emailed receipt links can supply the existing `#proof=...` fragment; the storefront removes it from the address bar and imports it into HttpOnly receipt storage. Keep backend-issued capabilities intact; do not expose them in analytics or logs. Account access is not required for an appropriately authorized guest status read.

Receipt cookies are bounded to 10 receipts for 30 days. Browser summaries exclude credentials/contact/address details; local history may retain up to 50 receipts. Unsubmitted address drafts stay in session storage for at most 24 hours. Pending contact details use the current tab and HttpOnly recovery cookie; a minimal persistent marker remains until payment is resolved. Clearing site data removes device recovery information. Emailed receipt links can restore access when available.

Status polling is cancellable, bounded and pauses in the background. API outages, unavailable shipping and uncertain payments have distinct messages. Shipping states and refund progress come from backend data, not browser assumptions. Cross-device item details may remain in the order email when the status endpoint does not return a complete receipt.

## Deployment

Use the existing Vercel **SvelteKit** preset and server adapter in `svelte.config.ts`, with `npm run build` and dependency installation from `package-lock.json`. Do not use a static export: cookie sessions and recovery require the server boundary.

Configure the existing gateway, this shop's exact storefront URL/host mapping, allowed browser origins, matching Stripe environment, signed webhook delivery and mail delivery. Production/preview settings must point to the intended shop and payment environment. Keep payment webhooks directed to the backend.

The proxy restricts forwarded routes, requires same-origin Origin headers for mutations and does not pass browser cookies or arbitrary trusted-identity/forwarding headers upstream. The backend remains responsible for tenant isolation, ownership, session revocation and payment authorization. Rate limiting must deliberately account for server-to-server requests; do not broadly trust browser-supplied forwarding headers.

Personalized and credential-bearing responses use private/no-store caching. Security headers restrict scripts/Stripe frames, embedding and referrers. Review gateway/proxy/CSP configuration against the actual deployment; frontend fixtures cannot certify it.

Deploy the matching shop-bound customer/session backend and its separately reviewed migrations. Do not reseed an existing shop, reset its database or infer production identity mappings. Legacy dashboard/global sessions cannot be converted into customer sessions by switching shops; a fresh customer login may be needed. Customer history stays attached to backend identities.

For a shared backend serving live Bubbling Bliss, preserve its service/data and Maddie's dashboard access. Review real identities, memberships and cross-service history before any backend cutover; this frontend does not perform that migration or grant customer dashboard roles.

When overlaying this ZIP onto an older JavaScript version, keep your environment file and run `npm run cleanup:legacy`. It removes only legacy files with existing TypeScript replacements. Preview with `node scripts/remove-legacy-js.ts` first if needed.

## Checks

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The controlled suite starts a production build/preview on port 4173 and a disposable upstream fixture on 4174. Desktop/mobile tests cover account/cookie scope, receipt recovery, cancellation, outages, history and reload behaviour. Some tests use browser API/Stripe fixtures; server-boundary tests exercise the actual cookie proxy. These checks cannot charge a real card and do not establish live database, email, tenant or Stripe behaviour. Inspect failures with `npx playwright show-report`. Run checks and production/browser builds sequentially because they share generated SvelteKit output.

The guarded live smoke test creates a real **test-mode** order. Use a disposable stocked shop, a running storefront/backend, matching Stripe test keys and working webhook delivery:

```sh
E2E_LIVE=1 E2E_DISPOSABLE_SHOP=1 \
E2E_BASE_URL=http://localhost:5173 \
E2E_SHOP_ID=YOUR_DISPOSABLE_SHOP_UUID \
npm run test:e2e:live
```

Optional: `E2E_PRODUCT_SLUG` (default `mimi-plush`) and `E2E_CUSTOMER_EMAIL`. Live screenshots/traces are disabled to avoid capturing receipt credentials. Separately verify fresh-browser authentication, same-email separation across two shops, refresh/replay/logout, real verification/reset delivery, Stripe/webhooks and retained customer history against your running backend. Controlled fixture passes are not live integration passes.

## Local Stripe test-event recovery

If a test payment succeeded but its original webhook was misrouted, keep the saved checkout and recover the existing event instead of submitting another payment. `checkout_recovery_pending` means the backend has not proved it safe to restart.

The optional `scripts/replay-stripe-test-event.py` helper retrieves and replays an existing Stripe **test** event through a local webhook handler. In your terminal, configure `STRIPE_TEST_SECRET_KEY` for the original sandbox account and `STRIPE_TEST_WEBHOOK_SECRET` for the signing secret loaded by payment. Never put those secrets in public variables or commit them.

```sh
python3 scripts/replay-stripe-test-event.py evt_YOUR_ORIGINAL_SUCCESS_EVENT \
  --order-id YOUR_SAVED_ORDER_UUID
```

Its default destination is `http://localhost:8080/v1/webhooks/stripe/test`; a direct local payment service can use `--url http://localhost:8087/v1/webhooks/stripe/test`. The helper rejects live/connected-account events, external destinations and redirects. It does not create a charge or directly edit an order. A successful webhook acknowledgement still requires checking asynchronous backend order confirmation. Retain the original receipt if recovery fails.
