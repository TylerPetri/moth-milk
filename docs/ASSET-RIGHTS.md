# Artwork, stories, fonts and licensing — Pass 2

The room stays intact. Uncertain provenance is recorded, not inferred from style and not used as a reason to remove artwork. No new blanket code or creative-content license is applied by this PR.

## Exact inventories

- [Assets](inventory/assets.csv): every current static file, review image and standalone font, with path, byte size, SHA-256, role, evidence and distribution decision (236 entries at this pass).
- [Stories](inventory/stories.csv): all 22 named stories, their source and the extent of implemented content.
- [Dependencies](inventory/dependencies.csv): all 171 locked package entries, exact version, declared license, optional/dev status and installed notice location. Platform-specific optional entries remain in the inventory even when not installed here.
- [Historical assets](inventory/historical-assets.txt): removed source artwork/templates still distributed with Git history.

Reproduce these with `python3 scripts/inventory-publication.py` after `npm ci`. The inventory records evidence available in the repository. A file hash identifies the reviewed file; it does not prove ownership. Asset changes should prompt a new review.

## What the evidence supports

| Category | Evidence and current classification | Public distribution / credit |
| --- | --- | --- |
| Original project artwork | Room, model/product images, wordmark, material atlases, registry images and covers are project-specific, but there is no creator/source declaration. **Original-project candidates, ownership unverified.** | Owner supplies creator/source records and confirms redistribution rights. Do not assume all are original merely because Git introduced them. |
| AI-generated artwork | **No files can be positively classified as AI-generated from available records.** A rendered photographic look or a generation script is not proof of AI origin. | Owner maps relevant asset paths to provider/tool, creation date, applicable commercial/public redistribution terms and reference inputs. Do not claim copyright exclusivity or model releases without evidence. |
| Programmatically generated derivatives | `static/images/sofa-books/*.webp` is covered by the repository's book-baking script: cloth and atlas artwork plus historical room templates. Review screenshots/contact sheet also derive from existing art. | Derived-work permission follows every source, not just the script. Reproduction currently needs historical templates, and the legacy script refers to removed `library.js`; it is not advertised as a turnkey asset build. No asset regeneration was attempted. |
| Third-party images/textures | No confirmed third-party image source/license has been identified. The remaining raster art stays **human/AI/third-party unresolved**. Seven texture SVGs and the favicon contain procedural vector source, with no external image references found, but human/AI authorship is unconfirmed. | Owner identifies any stock/reference material, source URL, author, exact license, changes and required credit. An empty attribution list is not a declaration that no third-party imagery exists. |
| Fonts from Fontsource | Bodoni Moda, Cormorant Garamond, Courier Prime and IBM Plex Sans Condensed all use locked Fontsource version 5.3.0 and declare SIL OFL 1.1 in the locked installed packages. | **Distributable under OFL conditions.** Retain exact copyright/license notices in `docs/licenses/*-OFL.txt` with font copies; do not sell fonts alone, and observe reserved-name/modification conditions. Application licensing need not be OFL. |
| Standalone Cormorant TTF | `scripts/cormorant-garamond-600.ttf`, SHA-256 `d44e6acce1ab253c7cf0dfe4ccd5923be9d7dfc7f7050ef7bbb3778daca568c5`. FontTools comparison against the locked Fontsource Latin 600 normal WOFF found all non-head tables identical; head differs only checksum adjustment and modified timestamp. Embedded copyright identifies the Cormorant Project Authors, version 4.001, with OFL URL. | **OFL derivative evidence now established.** Retain the Cormorant OFL notice. Binary is unchanged. Reproduce the read-only comparison with `python3 scripts/verify-font-provenance.py` (optional FontTools required). This resolves the narrower font-family/provenance uncertainty from Pass 1; it does not clear artwork using that font. |
| Story content | `src/lib/data/library.ts` contains descriptions/excerpts for the 22 titles in the inventory. Reading-time labels do not establish full-length fiction. No author/source declaration exists. | Owner confirms human/AI/third-party origin and permission for each story group. Keep story rights separate from code. |
| Project code, brand and editorial/product copy | No project-wide `LICENSE`, copyright assignment or contributor permission ledger exists. Git records one author identity, which does not establish rights to every contribution or input. | Public repository access permits viewing/forking under GitHub's platform terms; it does not automatically grant an open-source reuse license. Owner chooses the scope after confirming ownership. No license is invented here. |

The four font license notices are the only confirmed creative-asset redistribution basis currently recorded. Unverified image and story permissions also apply to README screenshots and assets in old commits. Permissions/contracts containing personal information should be retained privately, with a non-sensitive public source/credit ledger.

## Dependency obligations

All current lock entries declare one of MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, BlueOak-1.0.0 or OFL-1.1. Those licenses generally permit redistribution subject to their terms; declared SPDX metadata is inventory evidence, not a substitute for the actual notice. Keep applicable copyright/license notices with redistributed code; Apache-2.0 also requires applicable NOTICE material and modification notices. Font copies require OFL notices. Optional packages not installed on this platform need their upstream notice reviewed if shipped elsewhere. A `dev` label does not exclude a package from runtime or distribution analysis: SvelteKit and Fontsource build application output.

`@stripe/stripe-js` is MIT-licensed package code; the hosted `https://js.stripe.com/v3/` service and payment account use are governed separately by Stripe terms. Optional offline tooling also uses Python, Pillow, NumPy and FontTools. This environment had Pillow 12.3.0 (MIT-CMU metadata), NumPy 2.3.5 (BSD-family terms with additional bundled-library notices) and FontTools 4.61.1 (MIT). They are not runtime dependencies, are not locked by this repository, and were not redistributed or used to regenerate visual assets. FontTools was used read-only for the font comparison. Review their actual notices if distributing a separate asset toolchain.

Private commerce, identity, inventory, mail and shipping services are external dependencies, not code licensed by this repository. The isolated demo uses local synthetic fixtures and makes no claim to redistribute the private backend.

## Focused owner decisions

| Decision | Recommended option | Other reasonable option / evidence needed |
| --- | --- | --- |
| Artwork provenance | Supply one ledger mapping asset families to creator or AI provider, reference inputs and redistribution permission; use inventory hashes as the reviewed version. Preserve the room while this is reviewed. | If records cannot be established, retain assets during review but withhold a rights-cleared portfolio/public reuse recommendation. Replacement is a separate design decision, not automatic cleanup. |
| Third-party attribution | Add `docs/CREDITS.md` only for confirmed sources, with exact license links/required wording. | If none are third-party, record the owner's source declaration; do not fabricate credits. |
| Stories/brand | Confirm authorship and reserve creative rights separately from code unless a deliberate reuse license is wanted. | Choose a specific Creative Commons license only for material the owner has authority to license. |
| Code license | Recommend MIT for owner-controlled source, explicitly excluding artwork/stories/fonts and preserving dependency notices. | Apache-2.0 for an explicit patent grant, or retain all project-code rights. Owner must choose; no license has been applied. |
| Historical disclosures and author metadata | Review/accept the existing author email and historical operational references; document the decision without reproducing private details. | Separately authorize a narrowly scoped history cleanup if necessary. This PR does not rewrite history or change visibility. |

**Portfolio distribution recommendation: NO-GO until artwork/story/code decisions are recorded.** Fonts are now supported by concrete OFL evidence; uncertain ownership elsewhere remains a focused owner decision rather than a redesign task.
