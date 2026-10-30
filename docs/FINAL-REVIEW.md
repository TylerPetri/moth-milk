# Pass 3 — final review and merge preparation

**Owner follow-up supersedes the earlier provenance hold:** images/textures were generated during 2026 with Grok Imagine and ChatGPT/OpenAI; story content combines owner writing and AI assistance, with individual attribution unverified. The owner confirms no outside materials were supplied by them for reproduction and accepts disclosed experimental showcasing. See [the latest record](PROVENANCE-FOLLOWUP.md) and [provider-terms review](PROVIDER-TERMS.md).

Reviewed the complete `origin/main...portfolio/publication-readiness` diff, including application/configuration changes, fixture/test utilities, package metadata/lockfile, documentation, inventories, screenshot additions and font notices. Main baseline is `70b9d1ec4d2cf99102311c3461b4680644e4bcc3`. No new must-fix engineering defect was identified by code inspection. Pass 3 changes only this review record and two README phrases; final runtime verification is executed against the resulting commit and reported in [draft PR #1](https://github.com/TylerPetri/moth-milk/pull/1), rather than committing a new untested results revision afterwards.

## Engineering conclusions and limits

| Area | Review conclusion |
| --- | --- |
| Checkout and uncertain payments | Existing reservation, backend confirmation, original-key retries, cancellation/verified restart and uncertain-payment handling remain intact. Approved earlier changes hash contact fingerprints and reject unexpected test/live Stripe keys while preserving attempts. This is not a claim that every line is identical to main. |
| Recovery and credentials | Original payment keys are retained during fingerprint migration; compare-before-write avoids replacing newer saved state. Session tokens stay in HttpOnly cookies; receipt cookies preserve guest recovery. Unfinished local recovery keys remain JS-accessible, as disclosed in the security matrix. |
| Customer/shop isolation | Server-controlled shop header, customer role/shop response checks, restricted routes, Origin checks for mutations and refusal to forward browser identity headers remain. The backend still must verify signatures/revocation, tenant/resource ownership and receipt capabilities. |
| Payment separation | Configured Stripe test/live modes cannot be switched by a returned backend key. Stub submission requires a loopback upstream, and the visible local rehearsal uses synthetic fixtures. No shared shop or production payment settings changed. |
| Public configuration | Only four documented public variables pass the guards; public URLs reject embedded credentials/path/query/fragment. Private `API_ORIGIN` remains server-side. These checks cannot recognize a secret deliberately disguised as an otherwise valid public value. |
| Server deployment | Vercel SvelteKit adapter and `prerender=false` remain. SSR account routes and `/session` need a server; stale static-host metadata is removed. Local build success is not deployment certification or permission to deploy. |
| Visual and content preservation | No source SCSS, static imagery or `src/lib/data/library.ts` changes against main. The only added visual in normal source is the earlier stub-only rehearsal notice. Fresh screenshot comparisons and responsive tests are part of final verification. |
| Error recovery | Missing-backend, outages, lost reservation responses, interrupted/uncertain payments, reloads and cancellation refusals remain represented in controlled desktop/mobile scenarios. Their passes establish fixture behavior, not real Stripe, database, email or shipping integration. |

Known security limitations remain documented in [SECURITY-BOUNDARIES.md](SECURITY-BOUNDARIES.md): JS-accessible unfinished recovery keys; up to 30-day unsigned/unencrypted contact recovery cookies; guessable contact digests; ingress/query logging; process-local refresh coordination; and external backend authorization. These are disclosed existing boundaries, not newly discovered reasons to expand this PR or change the shared backend. The final dependency audit and CI status are reported separately in the PR; prior local passes are not called CI.

## Provenance and licensing conclusions

- The [236-entry asset inventory](inventory/assets.csv) is consistent with the owner's image/texture attestation: Grok Imagine and ChatGPT were used. Family-level origin and year 2026 are confirmed by the owner, not inferred from appearance. Individual provider assignment, exact dates/models/plans and applicable terms remain unverified; the owner supplied no outside inputs for reproduction, without independently certifying every asset.
- Programmatic book derivatives and the four application screenshot/contact-sheet entries inherit source-art provenance; the captures are actual rendered UI, not separately AI-generated screenshots. Empty build remnants have no artwork. No files are removed/replaced for uncertain provenance.
- No separately sourced stock-image/texture collection is identified by available evidence. This does not exclude third-party reference inputs, recognizable protected material or rights within AI output. Provider or reference-input permission/credit obligations cannot be determined from the attestation alone.
- Cormorant Garamond, Bodoni Moda, Courier Prime and IBM Plex Sans Condensed require their retained SIL OFL copyright/license notices. The standalone Cormorant font has matching-table evidence against the locked Fontsource font. Dependency licenses remain independent; root reserved rights do not revoke them.
- All **22 story descriptions/excerpts** are in `src/lib/data/library.ts` and [stories.csv](inventory/stories.csv). No separate full-length story files are claimed. Owner now confirms mixed human writing and AI assistance at collection level, with individual attribution unverified; no stories are edited, removed or relicensed.
- `RIGHTS.md`, root `package.json` and lock-root `UNLICENSED` metadata agree with the owner's reserved-rights decision. No MIT/Apache/GPL/Creative Commons project license is applied. No exclusive copyright in AI output or ownership of outside inputs is asserted. A public showcase does not require granting public reuse rights.

## Owner answers and remaining records

The earlier categorical questions have been answered to the extent records permit. Stories are mixed human-authored and AI-assisted; artwork is AI-generated in 2026 using the confirmed providers; no outside material was supplied by the owner for reproduction. Missing individual mappings are explicitly unresolved, not evidence of infringement or proof of ownership. Only recoverable generation/export records, applicable terms/permissions and any subsequently identified outside-source obligations remain useful; see the concise list in [the follow-up record](PROVENANCE-FOLLOWUP.md#what-can-still-resolve-uncertainty).

Reserved rights are already chosen. Historical operational references and Git author contact metadata remain disclosed; no history rewrite is introduced.

## Final metadata recommendation

Observed current GitHub description: “A slightly strange storefront built with SvelteKit and TypeScript, featuring interactive shopping experiences and a shared Go backend.” Current topics: `ecommerce`, `fullstack`, `scss`, `storefront`, `svelte`, `sveltekit`, `typescript`, `web-development`.

Recommended final description:

> A slightly strange SvelteKit storefront and horror-excerpt library, with a local simulated demo, recoverable checkout and a private commerce backend.

Recommended topics: `sveltekit`, `svelte`, `typescript`, `scss`, `storefront`, `ecommerce`, `stripe`, `portfolio`, `horror-fiction`, `fullstack`.

These are recommendations; repository About metadata was read, not modified. The description explicitly distinguishes the local demo from the external backend rather than implying backend source is included.

## Merge decision

**MERGE GO for the documentation and engineering improvements**, based on the completed runtime verification at `939c149e9f9ac41243d34c4e6d106aafbfa2a672` and the owner's latest scoped provenance confirmations. This follow-up changes documentation/inventory tooling only and retains all limitations. Missing per-file records do not, by themselves, require rejecting an improvement merge or redesigning the project. This is not provider-permission or comprehensive rights clearance and is not approval to execute a merge or deployment. The owner has explicitly kept both on hold.
