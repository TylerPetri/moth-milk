# Experimental portfolio provenance record

The owner is comfortable showcasing the already-public repository as an **experimental portfolio project with unresolved provenance/licensing questions clearly disclosed**. This decision does not certify outside-input rights, provider permission, exclusive copyright or unrestricted redistribution. No new license, merge, deployment, visibility change, history rewrite, artwork replacement or story edit is authorized or performed by this follow-up.

## Evidence groups

| Group | Current evidence | Still unknown |
| --- | --- | --- |
| 61 project image files, 6 atlases and 8 vector texture/favicon sources | Owner confirms project imagery/textures were generated during 2026 with Grok Imagine and ChatGPT/OpenAI image generation; per-file hashes in [assets.csv](inventory/assets.csv) | Individual provider, actual generation date, account/plan, reference inputs and applicable terms |
| 154 story covers/positioned book derivatives | Repository baking script describes atlas/cloth/historical template derivation; source collection has the owner's AI attestation | Source generation details and inherited input/provider permissions; script execution is not proof of human/AI authorship |
| 4 application screenshot/contact-sheet files | Actual renders or image contact-sheet derivatives | Underlying source rights; screenshot capture itself is not a new AI generation |
| 1 standalone font plus 4 Fontsource dependency families | Cormorant table comparison and retained OFL notices support font provenance | Font rights do not clear artwork or story text |
| 2 empty temporary files | No image content | No creative-origin claim is needed |

No separately licensed stock-art source was identified in repository/history records. The owner confirms no outside stories, copyrighted passages, reference images, textures, logos or likenesses were supplied by them for reproduction. That confirmation is limited to their supplied inputs; it does **not** independently establish the origin of every asset, prove original ownership or certify no third-party rights. All unverified sources remain unverified. See [provider terms](PROVIDER-TERMS.md) and [credits](CREDITS.md).

## Story slugs and Git evidence

All 22 are **mixed human-authored and AI-assisted content, with individual attribution unverified** in [stories.csv](inventory/stories.csv) and `src/lib/data/library.ts`. The owner confirms their own writing and AI assistance were combined specifically for Moth Milk. Reliable individual passage/provider records remain unavailable. The earlier authorship-unconfirmed classification is superseded at collection level only; individual attribution is still unverified.

| First recorded Git introduction (America/Toronto) | Slugs |
| --- | --- |
| [0a97cea](https://github.com/TylerPetri/moth-milk/commit/0a97cea), September 21, 2026, 20:02:19 | `static`, `hush`, `the-hall`, `no-signal`, `underbed` |
| [a443d2a](https://github.com/TylerPetri/moth-milk/commit/a443d2a), September 21, 2026, 22:26:43 | `the-briar-room`, `room-14`, `moth-house`, `afterimage`, `red-hours`, `half-moon`, `guest-book`, `visitor`, `borrowed-face`, `sleep-study`, `bell-jar`, `thin-walls`, `house-rules`, `cold-water`, `night-index`, `wake`, `the-attic` |

The original file was `src/lib/data/library.js`. [6f0c40b](https://github.com/TylerPetri/moth-milk/commit/6f0c40b) converted it to TypeScript on October 1, 2026. Comparing parsed description/excerpt strings across the available path history finds no text changes after each story's introduction; later changes adjust display metadata, formatting and types. Re-run `python3 scripts/inventory-publication.py` to reproduce introduction hashes/dates and detect later text revisions. Git dates record entry into repository history, not composition/generation dates, authorship or rights.

Commit messages and historical READMEs describe homepage, shelf/book styling and the fiction library, but do not identify a story author, provider, prompt or licensed source. No saved generation transcripts, prompt records, source credits or contributor permissions establishing individual origins were found in the inspected project/history records. The mixed-authorship classification comes from the latest owner confirmation, not from Git. Some existing UI copy describes fiction as original; that wording is not provenance evidence and has been preserved under the owner's instruction not to change content.

## What can still resolve uncertainty

Supply only what can be recovered; unavailable details remain explicitly unknown:

1. **Recoverable passage/input records:** drafts, chat/export records or contributor notes tied to slugs/asset families, including any external source/permission that later becomes known. Mixed human/AI story authorship and the owner-supplied-input confirmation are already recorded and need not be re-certified.
2. **Recoverable image records:** original exports or generation/chat IDs, dates more precise than the confirmed year 2026, provider/product surface (including whether Grok was used on X), model/account/plan and source inputs, grouped by asset family where possible. Unknowns remain marked unknown.
3. **Terms/permissions:** dated terms accepted for those services, or provider clarification/permission for public repository and screenshot use, including attribution wording/placement and any outside-input licenses. The reviewed Grok pages contain permission/attribution clauses; documentation credits alone are not claimed to discharge every obligation.

**MERGE GO for the documentation and engineering improvements**, with the disclosed limitations retained. These evidence gaps do not themselves require redesign, story edits or rejection of a documentation/security-improvement merge. This recommendation does not execute or authorize a merge/deployment, establish provider permission or certify broader commercialization.

If no further records can be established, the responsible conclusion remains: experimental showcase accepted by the owner, individual provenance and comprehensive rights clearance unresolved. No missing record is silently converted to ownership, permission or license. The PR stays open; merge and deployment remain on hold under the owner's instruction.
