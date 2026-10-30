# Artwork, stories, fonts and licensing — Pass 2

The room stays intact. Uncertain provenance is recorded, not inferred from style and not used as a reason to remove artwork. The owner has chosen reserved rights for project code and creative assets; see [RIGHTS.md](../RIGHTS.md). No MIT, Apache or Creative Commons project license is applied. Third-party licenses remain intact.

## Exact inventories

- [Assets](inventory/assets.csv): every current static file, review image and standalone font, with path, byte size, SHA-256, role, evidence and distribution decision (236 entries at this pass).
- [Stories](inventory/stories.csv): all 22 named stories, their source and the extent of implemented content.
- [Dependencies](inventory/dependencies.csv): all 171 locked package entries, exact version, declared license, optional/dev status and installed notice location. Platform-specific optional entries remain in the inventory even when not installed here.
- [Historical assets](inventory/historical-assets.txt): removed source artwork/templates still distributed with Git history.

Reproduce these with `python3 scripts/inventory-publication.py` after `npm ci`. The inventory records evidence available in the repository. A file hash identifies the reviewed file; it does not prove ownership. Asset changes should prompt a new review.

## What the evidence supports

| Category | Evidence and current classification | Public distribution / credit |
| --- | --- | --- |
| Original project artwork | No separate human-original image category is asserted: the owner confirms the image/texture collection was AI-generated. | Project rights are reserved to the extent held; this is not a claim of exclusive copyright in AI output. |
| AI-generated artwork | Owner attestation, 2026-10-30: every image and texture was AI-generated with **Grok Imagine and ChatGPT**. Per-file provider assignment, generation dates and reference-input records were not supplied. | Origin category is now owner-confirmed. Applicable provider terms and input rights still need review before a rights-cleared distribution recommendation; no mandatory attribution claim is invented. |
| Programmatic derivatives and review captures | Sofa-book images derive from atlases/cloth and historical templates; screenshots/contact sheet derive from application artwork. Their source art is covered by the owner attestation. | Preserve source rights/terms through derivatives. Screenshots are actual application captures, not independently AI-generated screenshots. Legacy asset regeneration still needs historical templates and refers to removed `library.js`; it was not run. |
| Third-party images/textures | No separately sourced stock/third-party image collection is reported; images and textures are owner-attested AI outputs, including the procedural SVG texture sources. | This does not establish rights in any reference inputs or exclude third-party rights within output. Provider/source records remain the focused follow-up; existing assets stay intact. |
| Fonts from Fontsource | Bodoni Moda, Cormorant Garamond, Courier Prime and IBM Plex Sans Condensed all use locked Fontsource version 5.3.0 and declare SIL OFL 1.1 in the locked installed packages. | **Distributable under OFL conditions.** Retain exact copyright/license notices in `docs/licenses/*-OFL.txt` with font copies; do not sell fonts alone, and observe reserved-name/modification conditions. Application licensing need not be OFL. |
| Standalone Cormorant TTF | `scripts/cormorant-garamond-600.ttf`, SHA-256 `d44e6acce1ab253c7cf0dfe4ccd5923be9d7dfc7f7050ef7bbb3778daca568c5`. FontTools comparison against the locked Fontsource Latin 600 normal WOFF found all non-head tables identical; head differs only checksum adjustment and modified timestamp. Embedded copyright identifies the Cormorant Project Authors, version 4.001, with OFL URL. | **OFL derivative evidence now established.** Retain the Cormorant OFL notice. Binary is unchanged. Reproduce the read-only comparison with `python3 scripts/verify-font-provenance.py` (optional FontTools required). This resolves the narrower font-family/provenance uncertainty from Pass 1; it does not clear artwork using that font. |
| Story content | `src/lib/data/library.ts` contains descriptions/excerpts for the 22 titles in the inventory. Reading-time labels do not establish full-length fiction. No author/source declaration exists. | Owner chooses reserved creative rights; story authorship/source and authority to license remain unconfirmed. Image provenance does not establish story provenance. |
| Project code, brand and editorial/product copy | No project-wide `LICENSE`, copyright assignment or contributor permission ledger exists. Git records one author identity, which does not establish rights to every contribution or input. | Public repository access permits viewing/forking under GitHub's platform terms; it does not automatically grant an open-source reuse license. Owner has chosen reserved rights, recorded in RIGHTS.md and npm `UNLICENSED` metadata. This is a licensing preference, not proof of ownership; third-party licenses still govern their materials. |

The four font license notices are the only confirmed creative-asset redistribution basis currently recorded. The owner image/texture attestation also informs screenshot and historical artwork provenance; provider/input permissions and story origin remain unresolved. Permissions/contracts containing personal information should be retained privately, with a non-sensitive public source/credit ledger.

## Dependency obligations

All current lock entries declare one of MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, BlueOak-1.0.0 or OFL-1.1. Those licenses generally permit redistribution subject to their terms; declared SPDX metadata is inventory evidence, not a substitute for the actual notice. Keep applicable copyright/license notices with redistributed code; Apache-2.0 also requires applicable NOTICE material and modification notices. Font copies require OFL notices. Optional packages not installed on this platform need their upstream notice reviewed if shipped elsewhere. A `dev` label does not exclude a package from runtime or distribution analysis: SvelteKit and Fontsource build application output.

`@stripe/stripe-js` is MIT-licensed package code; the hosted `https://js.stripe.com/v3/` service and payment account use are governed separately by Stripe terms. Optional offline tooling also uses Python, Pillow, NumPy and FontTools. This environment had Pillow 12.3.0 (MIT-CMU metadata), NumPy 2.3.5 (BSD-family terms with additional bundled-library notices) and FontTools 4.61.1 (MIT). They are not runtime dependencies, are not locked by this repository, and were not redistributed or used to regenerate visual assets. FontTools was used read-only for the font comparison. Review their actual notices if distributing a separate asset toolchain.

Private commerce, identity, inventory, mail and shipping services are external dependencies, not code licensed by this repository. The isolated demo uses local synthetic fixtures and makes no claim to redistribute the private backend.

## Focused owner decisions

| Decision | Recommended option | Other reasonable option / evidence needed |
| --- | --- | --- |
| Artwork provenance | **Recorded:** owner attests all images/textures were AI-generated using Grok Imagine and ChatGPT. | Remaining: per-file provider grouping, creation dates/applicable terms and reference-input rights. Preserve the room during review. |
| Third-party attribution | Keep font/dependency notices; disclose confirmed AI tools without claiming an unverified attribution obligation. | Record any required provider/input credits once applicable terms are identified. |
| Stories/brand | **Recorded preference:** creative rights reserved. | Story author/source confirmation is still needed; no story-origin inference is made from image provenance. |
| Code license | **Owner selected reserved rights.** RIGHTS.md and npm `UNLICENSED` metadata record this; no permissive license is applied. | Confirm authority over contributions/inputs; third-party font/dependency licenses are unaffected. |
| Historical disclosures and author metadata | Review/accept the existing author email and historical operational references; document the decision without reproducing private details. | Separately authorize a narrowly scoped history cleanup if necessary. This PR does not rewrite history or change visibility. |

**Portfolio distribution recommendation: NO-GO pending provider/input terms, story-origin confirmation and historical/privacy review. The AI origin category and reserved-rights preference are now recorded.** Fonts are now supported by concrete OFL evidence; uncertain ownership elsewhere remains a focused owner decision rather than a redesign task.
