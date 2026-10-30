# Latest provenance follow-up — documentation and inventory only

Latest owner confirmations record mixed human-authored/AI-assisted story content, 2026 AI-generated imagery and a scoped confirmation that the owner supplied no outside material for reproduction. Individual attribution, models/plans/dates and applicable terms remain unverified. Repository history establishes story introduction commits, not authorship. The [follow-up](PROVENANCE-FOLLOWUP.md), [provider review](PROVIDER-TERMS.md) and [credits](CREDITS.md) are current.

This follow-up changes no application source, stories, imagery, layouts, interaction code, dependency versions, font notices or licenses. Inventory regeneration, all asset hashes, story slugs/history grouping, package/lock reserved-rights consistency, Markdown targets and whitespace are checked separately. The latest full runtime verification remains **939c149e9f9ac41243d34c4e6d106aafbfa2a672**: clean installation, zero Svelte/TypeScript errors/warnings, 26 unit tests, 7 mocked Python tests, production build and 138 controlled browser scenarios passed; all three screenshots pixel-matched. Dependency audit then reported 5 low and no moderate/high/critical entries. These are prior-commit runtime results, not a claim of another full run on this metadata follow-up. No new CI test pass is claimed.

The historical records below are retained and may describe earlier incomplete owner answers; the latest scoped confirmations supersede them.

# Owner follow-up — rights/provenance metadata

The owner confirms images/textures were AI-generated with Grok Imagine and ChatGPT and selects reserved rights for project code/creative assets. Updated RIGHTS.md, rights/review/README text, inventory classifications and npm root license metadata (`UNLICENSED`). Font/dependency licenses are unchanged. Inventories regenerated; all 236 asset hashes still match, local Markdown targets resolve, package/lock root license metadata matches, and `git diff --check` passes. This follow-up changes no application behavior or dependency versions; the complete Pass 2 test evidence below remains the most recent runtime verification. Story provenance and provider/input terms remain unresolved.

# Verification — Pass 2, 2026-10-30

Final local results for the existing publication-readiness branch. Node 24.19.0, Chromium 154.0.8037.57, Playwright 1.63.0; no dependency versions changed during Pass 2.

| Check | Final Pass 2 result |
| --- | --- |
| Clean `npm ci` | Passed; 112 packages installed from the lockfile |
| `npm run check` | 0 errors, 0 warnings |
| `npm test` | 26 passed, 0 failed, including legacy migration/concurrent-write and payment-environment checks |
| `npm run build` | Passed; Vercel SvelteKit server output intact, no static export |
| `npm run test:e2e` | 134 passed (67 desktop + 67 mobile), 2.3 minutes |
| `npm run test:e2e:boundaries` | 2 passed (desktop/mobile): fresh build with empty backend/shop/key configuration; visual room available, safe no-store 503 and useful shop failure |
| `npm run test:e2e:demo` | 2 passed (desktop/mobile): loopback synthetic order, visible simulation label, external browser traffic blocked, no Stripe |
| Python replay utility unit tests | 7 passed using mocks; no Stripe API/replay action |
| Dependency audit | 5 low; 0 moderate/high/critical; exact lock entries remain unchanged from patched Pass 1 |
| Font comparison | All font tables match locked Cormorant WOFF except head checksum/timestamp; OFL evidence recorded, no binary edits |
| Visual comparison | Fresh home desktop/mobile captures: **0 changed pixels** versus both Pass 1 screenshots; new full-page synthetic-catalog shop capture inspected. No source SCSS or static image files changed. |
| Inventory | 236 current asset/font entries, 22 stories, 171 locked dependency entries; includes historical-only asset paths separately |
| Documentation and whitespace | Local Markdown targets resolve; `git diff --check` passes |

Main controlled suite uses the real application with disposable loopback upstream/browser API fixtures and a fake Stripe client. Boundary checks separately rebuild with no backend; rehearsal checks run the local demo fixture. All browser projects use Chromium; iPhone device emulation is not a mobile Safari test. No database, email, real customer, Stripe charge/webhook, refund, shipping or private-backend integration pass is claimed.

System-browser commands used `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; the main suite additionally used `PLAYWRIGHT_CHROMIUM_ARGS='["--no-sandbox"]'`. Normal Playwright-managed Chromium needs no executable override. Build/browser commands ran sequentially because they share generated output.

## Remaining advisories

Five low-severity npm entries represent SvelteKit/adapter/plugin/inspector propagation and deepmerge. Upstream advisories: [enhanced-form redirection](https://github.com/advisories/GHSA-pfhg-q3qv-9q6r), [prerender cache-control XSS](https://github.com/advisories/GHSA-27mw-82g8-phjj), and [deepmerge prototype poisoning](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). This app disables prerendering and uses custom forms rather than SvelteKit enhanced forms, reducing those particular paths' applicability; this is not proof the framework is unaffected. npm's suggested remediation involves a SvelteKit major upgrade and requires a separately tested migration. `devDependencies` includes framework code used to build the runtime, so omitting dev packages is not a production-security verdict.

## CI status and limits

No GitHub Actions workflow exists in the repository; none was added. The prior PR head had zero Actions runs. Its successful Vercel status accompanied a bot message reporting an ignored/skipped deployment, not a test run. The final pushed head's exact remote status is recorded in draft PR #1 after the push; local results above are not called CI. No deploy, merge, visibility/domain change or production backend/payment configuration action was performed.

Pass 2 changed-file groups: README and linked implementation/review/security documentation; per-file/story/dependency inventories plus read-only generation/font-verification utilities; new shop screenshot/capture utility; checkout fingerprint migration and Stripe mode guard; local demo launcher and fixture additions; unit/browser regressions and separate boundary/demo configs. Pass 1's static metadata removal and public-environment guards remain in this same PR. No significant visual assets were removed, replaced or redesigned.

---

## Retained Pass 1 evidence (prior result, not current counts)

# Review evidence — 2026-10-30

Environment: Node 24.19.0 (project minimum 22.18), Chromium 154.0.8037.57 on Debian, Playwright 1.63.0. Locked SvelteKit 2.70.3 / Svelte 5.57.1, Vite 7.3.7 and source-map-js 1.2.2. Baseline `70b9d1e`; no deployment or remote environment change was requested or executed.

| Check | Result |
| --- | --- |
| `npm ci` | Clean install of final patched lockfile succeeded, 112 packages |
| `npm run check` | 0 errors, 0 warnings |
| `npm test` | 22 passed, 0 failed |
| `npm run build` | Succeeded with `@sveltejs/adapter-vercel`; server output produced |
| Controlled Playwright | Final patched-lockfile run: 128 passed, 0 failed (64 desktop + 64 mobile), 2.1 minutes |
| `python3 -m unittest discover -s scripts -p 'test_*.py'` | 7 passed; Stripe replay utility tests use mocks, not Stripe |
| `npm audit --json` | 5 low, 0 moderate/high/critical after patches; baseline had 5 low + 2 high |
| `npm audit --omit=dev` | Baseline 0; excludes SvelteKit/build dependencies and therefore is not a deployed-server security verdict |
| `git fsck --full --no-reflogs` | No errors reported |
| `git diff --check` | Passed |
| Public configuration negative check | Importing actual SvelteKit config with a synthetic `PUBLIC_RECEIPT_PROOF` setting failed as intended; no value logged |
| Client output inspection | No `API_ORIGIN`, fixture access/refresh credential markers or private loopback upstream origin found in `.svelte-kit/output/client` |
| Screenshots | Actual anonymous desktop (1440×1000) and mobile (390×844) renders, inspected visually; external browser requests blocked |

Browser reproduction:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
PLAYWRIGHT_CHROMIUM_ARGS='["--no-sandbox"]' npm run test:e2e
```

Use the managed browser executable appropriate to your environment; normal Playwright-managed Chromium does not require either override. The command above describes this isolated container run, not a deployment setting.

The suite starts local fixture upstream `127.0.0.1:4174` and a production build/preview at `127.0.0.1:4173`. Projects are Desktop Chrome and Chromium with iPhone 13 device settings; mobile Safari was not tested. Coverage includes account/shop scope, SSR and cookie refresh/logout, receipt import/persistence/history, cancellation/restart safeguards, processing/uncertain payments, outage/reconnection behavior, stock/size stability, responsive room assets and navigation/reloads. Browser API mocks and fake Stripe isolate external effects; security scenarios use the actual SvelteKit proxy. No database, email, live tenant, webhook, refund or shipping integration pass is claimed.

The first run exposed receipt fixtures dated 2026-09-30, now outside production's 30-day retention window. That interrupted run is not reported as a pass. Changed only the fixture timestamp to one day before the run; the subsequent full suite passed all 128 scenarios before dependency patches. The complete clean-install suite was repeated after patching the lockfile.

No live smoke tests, real charges, customer data, external Stripe replays, merges, deploy commands, domain changes or visibility updates were performed. GitHub reported existing visibility as public; this review leaves it unchanged. External automatic hosting behavior is not controlled or certified by these local tests.

Changed files:

- `.openai/hosting.json` removed (stale static deployment metadata).
- `.gitignore` ignores Python utility caches.
- `README.md`, `env.example`: portfolio/setup/security documentation and sanitized current operational context.
- `svelte.config.ts`, `src/hooks.server.ts`, `scripts/public-config.ts`, `tests/public-config.test.ts`: build/runtime public configuration guard and tests.
- `package-lock.json`: compatible Vite and source-map-js patches.
- `e2e/helpers.ts`: receipt fixture date remains inside retention window.
- `scripts/audit-publication.py`, `scripts/capture-portfolio.ts`: bounded history scan and isolated screenshot reproduction.
- `docs/PUBLICATION-REVIEW.md`, `docs/ASSET-RIGHTS.md`, `docs/VERIFICATION.md`: findings, limitations and evidence.
- `docs/screenshots/home-desktop.png`, `docs/screenshots/home-mobile.png`: actual UI captures.
- `docs/licenses/{bodoni-moda,cormorant-garamond,courier-prime,ibm-plex-sans-condensed}-OFL.txt`: four exact Fontsource notices.
