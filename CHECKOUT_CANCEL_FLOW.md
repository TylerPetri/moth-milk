# Checkout cancellation and ongoing attempts

This release adds payment inspection, missed-success recovery, safe resume,
checkout lists, and explicit action flags. Deploy payment, order, and gateway
from the same ZIP before deploying a storefront that uses the new endpoints.
Existing order/payment records and their test/live/legacy environments remain
in place. An order marked failed is not, by itself, proof that its payment closed.

## Rollout

Apply payment migration `000004_checkout_observations.up.sql` (and the prior
`000003_checkout_recovery.up.sql` if not already installed). The payment startup
migration also installs these idempotent changes. Redeploy payment, order and
gateway. Keep `INTERNAL_SERVICE_TOKEN` consistent between order and payment.
Keep the original payment environment's Stripe profile available for historical
attempts. No new environment variables are needed for this feature.

The order maintenance loop inspects up to 20 reserved attempts older than one
minute per pass, with a 30-second batch deadline and rotating pagination. It
also retains the existing reservation expiry and paid-order recovery passes.
Provider reads for a checkout's awaiting/processing state are cached for 10
seconds under the shared database checkout lock. Listings do not call Stripe.
Do not remove correctly configured signed webhook endpoints: inspection is a
recovery path, not a replacement for webhooks.

## Storefront endpoints

All requests need the original `X-Shop-ID`. Checkout keys are capabilities:
keep them out of URLs, logs, analytics and list responses. A verified, signed-in
buyer may omit the key for their own order on status/resume/cancel. Gateway
identity headers must originate from the gateway, as for existing account APIs.
Email tracking proofs authorize status reads only, never resume or cancellation.

| Request | Authorization | Result |
| --- | --- | --- |
| `POST /v1/checkouts/query` | Guest receipt credentials | Up to 10 shop-scoped snapshots; invalid/foreign receipts omitted |
| `GET /v1/checkouts?limit=20&offset=0` | Verified buyer JWT | Buyer's reserved, pending, paid, failed and cancelled attempts |
| `GET /v1/shops/{shop_id}/checkouts?limit=20&offset=0` | Verified shop owner JWT | Shop's corresponding attempts for backend/operator visibility |
| `POST /v1/shops/{shop_id}/checkouts/{id}/status` | Verified shop owner JWT | Refreshed operator snapshot; no card-entry secret |
| `POST /v1/shops/{shop_id}/checkouts/{id}/cancel` | Verified shop owner JWT | Uses the same verified closure and cleanup path |
| `POST /v1/orders/{id}/checkout-status` | Original key, email tracking proof, or verified buyer | Inspect/reconcile payment and return current actions |
| `POST /v1/orders/{id}/checkout-resume` | Original key or verified buyer | 202 with original intent's `payment_client_secret` and `publishable_key` |
| `POST /v1/orders/{id}/checkout-cancel` | Original key or verified buyer | 200 only after safe key sealing and reservation cleanup |

Shop-owner listing does not grant access to a buyer's card-entry secret or
receipt capability. Operators use the dedicated shop-scoped status/cancel routes
with an owner token, verified email, matching shop header, and Auth-service owner
validation. Operator actions never bypass provider verification or safe closure.
These two routes accept an empty body; status masks the buyer resume action.

Guest list body:

```json
{"attempts":[{"id":"ORDER_UUID","idempotency_key":"ORIGINAL_KEY_UUID"}]}
```

Status, resume and cancel body:

```json
{"idempotency_key":"ORIGINAL_KEY_UUID"}
```

For an authenticated verified buyer's own order, `{}` is sufficient.
Listings return `{ "checkouts": [...], "count": N }`, newest first for account
and shop lists; limits default to 20 and are capped at 50. Guest lists preserve
the caller's order and are capped at 10. Snapshots contain `id`, order `status`,
`checkout_state`, `payment_status`, immutable `payment_environment`, `is_test`,
`revenue_eligible`, `total`, `currency`, `success`, `restart_allowed`, and:

```json
{"actions":{"resume":false,"cancel":false,"restart":false,"check":true}}
```

List snapshots are conservative: unconfirmed attempts initially offer checking.
Refresh a specific attempt through status before rendering its resume/cancel
controls. Always reauthorize and revalidate on the server when an action is used.

| `checkout_state` | Meaning / UI |
| --- | --- |
| `not_started` | No provider request was sent, or preparation was definitively rejected; closure can seal this key |
| `awaiting_payment` | Original intent awaits payment/authentication; resume for reserved orders, or request closure |
| `processing` | Original payment may complete; check again and keep the key |
| `payment_received` | Durable success recorded; order confirmation is being recovered |
| `refund_pending` | Failed/cancelled order has a verified completed payment; existing refund path is running |
| `refunded` | Full refund recorded; close the old key before starting again |
| `closed` | Old key sealed and stock cleanup verified; `restart_allowed=true` |
| `confirmed` | Successful order; show receipt, never cancellation |
| `recovery_pending` | Outcome cannot yet be verified; keep the old key and check/support |

A successful explicit cancellation returns matching `id`, `status:"failed"`,
`checkout_state:"closed"`, `restart_allowed:true` and only the restart action.
A status response may also report verified closure after provider cancellation.
Discard the active key and generate a new UUID only after a successful, matching
server response authorizes restart. Preserve the bag. Do not automatically submit
a new checkout or payment. On a 409, timeout, invalid response, or outage, retain
all original recovery credentials. A 409 may include the current snapshot and a
`request_id`; use it for support. Resume/cancel may race payment confirmation;
never infer success from a button click or a local failed flag.

Use the `publishable_key` returned with the resumed intent. Do not use a shop's
current key to mount a historical test/live payment. Only server-side inspection
with the original profile, full identity/amount/currency/environment validation,
and the existing atomic ledger/outbox path can recover a missed success event.
Refund accounting is retained when an old, fully refunded checkout key is sealed.
Partial refunds and paid/confirmed orders cannot become fresh checkout attempts.

## Moth Milk

Your Corner displays “Still waiting.” with “Check on it”, “Pick this up again”,
“Leave this one” and “Start again”. Device attempts are bounded to ten and exclude
contact/address details from persistent storage. Guest receipt capabilities are
also kept in HttpOnly session-proxy cookies. Resume uses the backend's original
intent and key. Cancellation in either Your Corner or checkout preserves the bag;
a verified closed status offers Start again. Processing/paid states have no
second-payment or cancellation action. A lost initial status read gets bounded
status-only retries; tab visibility, online/focus recovery and explicit checking
keep the same receipt credentials. The teen afterhours typography and palette
remain in use; no payment/admin terminology is shown as navigation.

## Verification

See included regression tests for provider binding, original profile routing,
success ledger idempotency, refunded key sealing, auth/tenant scoping, conservative
listing, stock cleanup failure, UI cancellation/retry and resume. Run:

```sh
go test -race ./services/payment/... ./services/order/... ./services/gateway/...
# From storefront:
npm run check
npm test
npm run test:e2e
```

PostgreSQL integration tests use the existing `integration` build tag and Docker:
`go test -tags=integration ./services/payment/internal/adapters/repository/...`.
Live Stripe and production deployment require the usual environment configuration.
