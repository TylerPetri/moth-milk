# Asset rights review — 2026-10-30

**Public distribution recommendation: NO-GO until provenance is supplied.**
Being tracked in Git, or described as original in UI copy, does not establish ownership. No repository-wide license or image/story permissions ledger was present at the audited baseline. This review does not grant rights or apply a new license to anyone's work.

| Material | Evidence checked | Decision / required evidence |
| --- | --- | --- |
| `static/images/**`, including room scenes, product/model images, wordmarks, covers, atlases and derivatives | Tracked files and introduction history; `contact.png` is a room-asset contact sheet, not a customer export | No source/creator/license/release evidence found. Obtain source URLs or generation records, commercial redistribution terms and any required model/trademark permissions. Check derivatives as well as originals. |
| `static/textures/*.svg`, `static/favicon.svg` | SVG source consists of vector shapes/filters; no external image references found in textures | Repository authorship alone is insufficient; confirm creator and applicable license. |
| `src/lib/data/library.ts`, product/editorial copy and brand | Repository content/history | Confirm author and permission to redistribute stories, excerpts and brand material. Reading times do not prove that full stories are implemented. |
| Four `@fontsource/*` dependencies | Installed locked packages each include SIL OFL 1.1 with family copyright notices | OFL permits redistribution subject to its conditions. Exact notices copied to `docs/licenses/`; retain them with redistributed fonts. These notices do not license artwork rendered with those fonts. |
| `scripts/cormorant-garamond-600.ttf` | Font metadata identifies Cormorant Garamond SemiBold; generator can derive a TTF from Fontsource | Family matches OFL dependency, but exact file source/version is unrecorded. Confirm provenance or regenerate from the locked package before recommending distribution of this standalone binary. |
| `docs/screenshots/home-*.png` | Actual local Chromium renders, anonymous state, external network requests blocked | No real customers or backend data. Screenshots inherit underlying artwork rights; they are review evidence, not evidence of clearance. |
| Historical `assets/source/sofa-books/**` and removed imagery | Reachable Git history includes source/approved room templates | Also require clearance if publishing history. Deleting a current path does not remove historical distribution. |

Maintain a per-source ledger containing path/glob, creator, source, license/permission, date, modifications and required credit. Keep private receipts/contracts outside the public repository. Confirm code licensing separately with the owner; no blanket open-source license has been invented here.
