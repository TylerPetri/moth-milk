# Invalid login signatures blocking receipt recovery

The session proxy previously forwarded `mm_access` on every checkout status,
resume, cancel and device-list request. The gateway validates any supplied
Bearer token even on public routes, so a stale token or mismatched JWT key pair
could reject the request before the order service checked its receipt capability.

Receipt-authorized status/resume/cancel requests now omit that unrelated Bearer
token. Status may also use the read-only email tracking proof. Device receipt
queries use their supplied shop-scoped capabilities. The backend still checks
shop, order, original key/proof, safe provider closure, and stock cleanup.
Account-only reads and new checkout creation retain JWT verification. Tracking
proofs never authorize cancellation or resume. No failed request automatically
resubmits a checkout as a guest, and no stored checkout/receipt key is cleared.

Immediate local workaround: in browser developer tools, delete only `mm_access`
and `mm_refresh` cookies for localhost, then reload. Keep `mm_receipt_*` and
`mm_checkout`, plus pending checkout local storage. Sign in again when needed.

The RSA error means the gateway cannot verify this access token with its configured
public key; it does not mean the payment failed. If a newly issued login token
also fails, verify that auth's JWT private key and gateway's JWT public key belong
to the same pair and both services loaded the intended files/environment. Restart
services after correcting their configuration; never disable signature checking.

Validation: storefront type check and Node tests; real session-proxy request
regressions against a controlled upstream with an invalid access-token signature.
Live auth/gateway configuration and Stripe were not inspected or deployed.
