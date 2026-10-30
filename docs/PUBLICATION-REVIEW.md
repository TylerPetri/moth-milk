# Publication review — 2026-10-30

Pass 1 history-audit baseline is retained below. [Pass 2](PASS-2-REVIEW.md) and the [security boundary matrix](SECURITY-BOUNDARIES.md) record the current changes, precise inventories and resolved Cormorant OFL evidence.

**PUBLICATION: NO-GO.** GitHub reported the repository already public during this review; no visibility setting was changed. This is a readiness recommendation, not a claim that existing exposure has been reversed.

## Scope and method

Baseline: `70b9d1ec4d2cf99102311c3461b4680644e4bcc3` (`origin/main` after fetch). Explicitly fetched all advertised remote branches and tags; only `main` was returned. Audited all 339 tracked paths and all reachable fetched history: 56 commits, 1,346 objects, including 485 unique text blobs and 283 binary blobs. `git fsck --full --no-reflogs` reported no errors. Reviewed route/session/payment/storage boundaries, configuration, tests/utilities, dependency metadata, asset inventory and historical/deleted documents. Text patterns checked secret formats, receipt-like literals, emails, URL hosts and private address patterns; no matching values are reproduced here. Binary inventory/metadata and room contact-sheet inspection cannot prove absence of hidden personal data or ownership. GitHub PR refs, forks, caches, inaccessible/deleted remote refs, external backend repositories and production settings are outside this available checkout audit.

## Findings and disposition

| Finding | Evidence and disposition |
| --- | --- |
| Missing asset/story/code redistribution evidence | See [asset review](ASSET-RIGHTS.md). Publication blocker until owner supplies rights and licensing decisions. Preserve design pending clearance. |
| Private operational context in history | Baseline README and deleted `BACKEND-CONTRACT-UPDATE.md` / `BACKEND-CONTRACT-VALIDATION.json` discuss another business and named access relationships. Removed current README passage. Owner must assess historical disclosure and authorize any separate cleanup; no history rewrite performed. |
| Stale static deployment metadata | Removed `.openai/hosting.json`, which declared `static.directory=build` plus an opaque hosting project ID. Actual adapter is Vercel, `prerender=false`, SSR account loaders and `/session` server endpoints. Static export would break authentication/recovery. No hosting project or deployment was modified. Historical ID remains; it is an identifier, not a credential. |
| Public environment leakage | Vite uses `envPrefix: PUBLIC_`; SvelteKit also exposes dynamic public env. Added a shared allowlist/format guard at configuration/build and before server response resolution. Rejects unknown public names, credentials/path/query/fragment in public API URL, non-UUID shop IDs, non-publishable Stripe keys. Never prints values. Private `API_ORIGIN` is used only in the server proxy. Do not place secrets/capabilities in any public variable; validation cannot identify every secret disguised as a syntactically valid allowed value. |
| Secrets/customer information scan | No secret-shaped credential matches, private-network endpoint matches, or non-example customer email matches in scanned text. Capability-pattern matches were explicit `SERVER_ONLY_*` fixture literals in security tests/upstream. All email literals used reserved example/test domains. No customer export identified. This is bounded evidence, not a guarantee or a backend audit. |
| Git author metadata | One distinct author identity uses a non-noreply email address. Owner should confirm consent to keep that metadata public; address not reproduced here. |
| Dependency advisories | Patched Vite 7.3.6 → 7.3.7 and source-map-js 1.2.1 → 1.2.2 within existing version ranges. Remaining low-severity SvelteKit/enhanced-form/prerender and deepmerge toolchain advisories require separate assessment/major-upgrade planning. `devDependencies` does not mean irrelevant to deployed server code: SvelteKit builds the runtime. No blanket production-safety claim follows from `npm audit --omit=dev`. |
| Receipt capability boundary | Guest idempotency keys authorize status/cancel/resume; read proofs authorize status only, enforced by backend. HttpOnly receipt storage and token redaction reduce exposure; unfinished attempts still retain idempotency keys in browser storage. XSS, extensions or copied site data could expose these capabilities. Pass 2 additionally hashes contact fingerprints and migrates legacy plaintext copies without rotating recovery keys. README now discloses this; preserve recovery semantics. Backend must enforce shop/ownership/expiry/replay and redact request bodies/URLs. |
| Recovery/contact data | `mm_checkout` is HttpOnly but unsigned/unencrypted client-held JSON with contact/address data for up to 30 days; unsubmitted drafts use session storage up to 24 hours. HttpOnly is not encryption; client recovery data is not trusted authorization or pricing. Production retention/privacy review remains external. |
| Backend and deployment not certified | No live backend/Stripe/mail/customer data used. Inventory, tenant isolation, revocation, rate limiting, refund fulfillment, distributed refresh coordination and real webhook confirmation remain external acceptance work. Email/account links initially carry proof/token in query URLs; browser removal/no-referrer cannot erase ingress logs. Redact logs and keep analytics away from capability routes. |

## Verification

See [verification evidence](VERIFICATION.md) for exact check counts and any failures. Reproduce the bounded history pattern scan with `python3 scripts/audit-publication.py`; the baseline operational review also checked the deleted validation document directly. Controlled Playwright uses a disposable loopback upstream plus browser API/Stripe stubs. It exercises the real UI and, for security scenarios, the real SvelteKit proxy; it does not prove real payment, database, email or shipping integration. No live smoke tests or replay utilities were executed against external services.

## Conditions for a GO recommendation

1. Clear artwork, textures, stories, brand and code distribution rights, including historical source assets and screenshot derivatives. Pass 2 establishes OFL evidence for the bundled font and retains its notice.
2. Owner resolves or explicitly accepts historical operational disclosures; any rewrite/removal is a separate authorized operation and cannot recall existing clones.
3. Review backend/payment/privacy boundaries with disposable test-mode resources before claiming end-to-end integration. Document accepted browser receipt-key and recovery-data risks.
4. Review the proposed branch and all test evidence. Merge, deployment and visibility changes require separate approval.
