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
