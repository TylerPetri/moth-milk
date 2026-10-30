# Pass 2 portfolio review

**Current status:** [the owner follow-up](PROVENANCE-FOLLOWUP.md) supersedes earlier collection-authorship unknowns and merge/portfolio holds below. Stories are mixed human-authored and AI-assisted; artwork was AI-generated in 2026; individual attribution/terms remain unresolved. The owner accepts disclosed experimental showcasing. Earlier review history is retained for context.

Branch: `portfolio/publication-readiness`. Existing [draft PR #1](https://github.com/TylerPetri/moth-milk/pull/1) is the only proposed change. Repository visibility was already public; no production/backend/domain/payment configuration, merge or deployment operation is included.

## Verified changes

- Persistent checkout fingerprints previously duplicated customer name/email/address as raw JSON even though explicit contact fields were stripped. New fingerprints are SHA-256 digests; legacy active/stub/archived fingerprints migrate while preserving original idempotency keys, payment-submitted state and newer concurrent recovery writes. A digest is not anonymization.
- A configured test Stripe client now rejects live publishable keys returned during prepare or resume (and live configuration rejects unexpected test keys). The pending attempt remains saved; no additional confirmation or new reservation is initiated by the rejection. Existing valid-environment payment/recovery flows remain covered.
- Stub mode rejects public remote API origins and live keys; the server refuses stub order submission to a non-loopback private upstream. `npm run demo` explicitly selects a local synthetic shop and fixture upstream, binds both processes to loopback and labels simulation in the UI. No private backend is needed to explore and complete a fixture order.
- Isolated desktop/mobile tests verify missing-backend failure and rehearsal checkout. The main suite additionally checks raw storage privacy and unexpected live-key prepare/resume responses. No tests use live Stripe or customer data.
- The README is shorter and links detailed account/checkout/operator notes separately. Actual home/mobile/shop captures, a simple diagram, technologies, local setup and explicit simulated/external feature status are included. Existing SCSS, source images and production-mode visual composition are unchanged.
- [Asset/story/dependency inventories](ASSET-RIGHTS.md) now identify files and hashes rather than broad globs. Cormorant font tables match the locked OFL font apart from checksum/timestamp metadata. Following owner confirmation, images/textures are labeled owner-attested AI-generated with Grok Imagine and ChatGPT; per-file provider/terms records remain outstanding. No significant assets were removed or replaced.

## Remaining security concerns

See [security boundaries](SECURITY-BOUNDARIES.md). The application restricts proxy routes, Origin, cookie exposure and shop headers; the private backend remains responsible for session signature/revocation, tenant ownership, capability authorization, prices/stock, restart safety and real Stripe/webhook state. Those services were not changed or certified.

Unfinished checkout keys remain browser-accessible to preserve existing device recovery. Contact recovery uses session storage and an unsigned/unencrypted HttpOnly cookie with up to 30-day retention. Contact digests are pseudonymous and may be guessable. XSS/extensions, copied site data, ingress query logging and distributed refresh races remain relevant. Backend log/analytics redaction, retention and multi-instance coordination require owner/operator assessment. Five low-severity dependency audit entries remain; a major SvelteKit migration was not bundled into this review.

## Owner decisions, with recommended options

1. **Image/texture origin recorded:** the owner confirms all were AI-generated with Grok Imagine and ChatGPT. Remaining: provider grouping/dates, applicable terms and reference-input rights. Story authorship remains unconfirmed.
2. **Attribution:** retain OFL/dependency notices; record any provider/input attribution obligations after checking applicable terms. No third-party stock source or mandatory AI attribution is invented.
3. **Rights preference recorded:** the owner selected reserved rights for project code and creative assets. [RIGHTS.md](../RIGHTS.md) and npm `UNLICENSED` metadata record that choice without overriding third-party licenses or claiming exclusive copyright in AI output. MIT/Apache/Creative Commons licensing is not selected.
4. **Historical/privacy risk:** assess historical operational references and Git author email, browser receipt-key access and contact retention. Explicitly accept or separately scope cleanup/hardening. This PR neither rewrites history nor removes recovery credentials.

Private source/permission contracts should stay private; record only non-sensitive attribution and owner decisions in public documentation. See [the focused asset decision table](ASSET-RIGHTS.md#focused-owner-decisions).

## Verification and CI

[Verification evidence](VERIFICATION.md) records the clean install, type/unit/build results, 134 main controlled scenarios, two missing-backend scenarios, two rehearsal scenarios, visual checks and dependency audit. All browser projects run desktop/mobile Chromium, not iOS Safari. Mocks certify application behavior only.

No GitHub Actions workflow exists in this repository. The prior head had no Actions runs, and the Vercel status marked success represented an **ignored/skipped deployment**, not a test or deployment pass. The latest pushed head must be checked separately; actual remote status is reported in PR #1. Local results are not labeled CI. No new CI/deployment workflow or hosting setting is introduced.

## Recommendation

**MERGE: NO-GO pending owner review/acceptance of the listed rights and privacy decisions.** The technical changes are locally reviewable and tested; this is not a claim that merging would deploy safely or certify the private backend. No merge is performed.

**Portfolio readiness:** suitable as a technical review candidate with a working isolated rehearsal and truthful integration boundaries. A rights-cleared portfolio-showcase recommendation remains **NO-GO** pending provider/input rights, story origin and acceptance of remaining disclosures. The owner has resolved the AI-origin category and reserved-rights preference. Public reuse is intentionally reserved; choosing a permissive license is not a condition for showcasing the project. Existing public visibility is unchanged.

Suggested GitHub description (recommendation only):

> An after-hours SvelteKit storefront and horror-excerpt library, with a responsive room, customer-session proxy and recoverable checkout. Includes a local simulated demo; real commerce uses a private backend.

Suggested topics: `sveltekit`, `svelte`, `typescript`, `scss`, `ecommerce`, `stripe`, `portfolio`, `horror-fiction`.
