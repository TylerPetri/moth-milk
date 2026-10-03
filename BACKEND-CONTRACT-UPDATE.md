# Backend contract update

Inspected backend(6).zip source handlers, gateway middleware, customer account/session services, order recovery and catalog handlers. The uploaded backend(5) and backend(6) contents match. No backend, database, deployment, operator identity or shop mapping was changed.

| Operation | Customer route | Authorization |
| --- | --- | --- |
| Register/login | POST /v1/auth/register, /v1/auth/login | Resolved X-Shop-ID; no Authorization |
| Refresh/logout | POST /v1/auth/refresh, /v1/auth/logout | Resolved X-Shop-ID; HttpOnly refresh cookie; no Authorization |
| Identity/books | GET /v1/auth/me; GET/PUT /v1/auth/me/books | Customer access cookie and resolved X-Shop-ID |
| Verification | POST /v1/auth/email/verify/request, /confirm | Request uses customer session; confirmation uses token and resolved shop |
| Password recovery | POST /v1/auth/password/reset/request, /confirm | Resolved shop; no Authorization; successful reset clears local account cookies |
| Checkout status | POST /v1/orders/{id}/checkout-status | Receipt key or tracking proof bypasses unrelated access cookie |
| Resume/cancel | POST /v1/orders/{id}/checkout-resume, /checkout-cancel | Receipt key can bypass access cookie; tracking proof cannot |
| Receipt batch | POST /v1/checkouts/query | Access cookie omitted only for a nonempty batch with keys for every receipt |
| Checkout creation/order ownership | POST /v1/orders/prepare, /v1/orders; account history/claim | Existing customer access cookie retained; shop enforced |

Dashboard and shop-switch endpoints are excluded. Customer token responses must match the resolved shop and contain only customer roles when roles are present. Account responses must explicitly identify a customer with customer roles. Register legitimately omits roles in this backend. Session tokens never reach browser JavaScript; responses contain markers only. Supplied browser shop, refresh token and Authorization cannot override the server's shop/cookies.

The existing design, room loading, receipt history/order, language, navigation, Stripe checkout and cancellation behavior are preserved. Public catalog/stock and existing checkout contracts remain compatible; hidden catalog enumeration remains an operator-only backend operation.

## Deployment prerequisites

- Configure this storefront's verified shop UUID or its exact backend host mapping before authentication. Missing, malformed or nil shop IDs fail closed. Never infer a shop from an existing cookie.
- Use the current gateway/auth services and their reviewed identity/session migrations. Preserve existing data; no reseeding or database reset is required by this frontend.
- Use HTTPS gateway origins in production and the existing server adapter. Retain the matching Stripe publishable key and backend Stripe/mail/webhook settings. Only public settings belong in PUBLIC_ variables.
- Browser refresh/logout use the same Web Lock; overlapping refreshes within one server process share one rotation. Deployments with multiple server instances must coordinate refresh across instances (e.g. a shared secure rotation coordinator or session affinity). The in-memory coordinator alone is not a distributed lock. Browsers lacking Web Locks retain per-tab coordination only.
- Existing legacy global/dashboard cookies cannot become customer sessions by shop switching. A fresh customer login may be required. Existing customer history remains attached to backend customer identities; this frontend does not guess or migrate mappings.
- The supplied `scripts/auth-model/cutover.sql` requires the final session-aware runtime, an explicitly reviewed identity mapping and stopped writers. Operators must plan that backend cutover separately; this frontend change does not perform it. Use `scripts/auth-model/report.sql` and `render_mapping.py` to review actual IDs, roles, memberships and cross-service history; never use an example mapping as production data.
- Bubbling Bliss: before any production identity migration, operators must independently verify Maddie's dashboard identity, membership/roles, customer-to-shop mappings and order ownership using the backend's reviewed migration process. Preserve a database backup and existing service configuration. This storefront update neither modifies nor verifies those production records and must not be used as authorization to reseed or grant dashboard roles to customers.

## Verification scope

Local automated checks cover contract validation, cookie-only sessions, fresh browser login/register, resolved scope despite tampered headers, operator/wrong-shop rejection, refresh/logout/restoration, verification/recovery request wiring, and receipt recovery/status/resume/cancellation with stale unrelated login cookies. The real Svelte server proxy is exercised against a disposable local upstream, alongside the existing desktop/mobile suite. Unit tests exercise same-email shop isolation in contract validation and overlapping refresh coalescing.

Requires the running backend: actual same-email registrations and distinct customer IDs/passwords across two shops; database rotation/replay/revocation semantics; delivered verification/reset emails and one-time expiry/shop rejection; Stripe PaymentIntents and signed webhooks; retained production customer history and Maddie's dashboard access. No running backend or database was available and Go is not installed, so backend runtime/integration tests were not run. Fixture responses do not establish database behavior.

Local results: Svelte check 0 errors/0 warnings; 20 unit tests passed; 116 desktop/mobile regression tests passed, then 42 security/session/receipt tests passed after incremental hardening, followed by 18 authentication/SSR tests with no configured shop UUID (backend host resolution). Production builds passed during these runs. See BACKEND-CONTRACT-VALIDATION.json for scope.
