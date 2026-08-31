## 1. Repository reorganization (placement-only — suite stays green throughout)

- [x] 1.1 Perform the mechanical move: business modules → `src/` (imdb, queue, board, gist, winner, topbar, toast, app), test files → `tests/unit|api|integration|ui` per the design map, `index.html` script tags → `src/*.js`, test imports → `../../src/*.js`, `tests/helpers/app-harness.js` reads `src/app.js` + root `index.html`, `package.json` `testMatch` → `tests/**/*.test.js` — verify: `pnpm test` all green and no `*.test.js` remain in the root
- [x] 1.2 Update README (and any remaining doc path references) to the new layout — verify: `grep -n "imdb.js\|app.js\|test" README.md` shows only `src/` and `tests/` paths

## 2. Fetch pipeline — tests first (TDD)

- [x] 2.1 Write failing `tests/unit/imdb.test.js` additions for the direct-first chain: the first request goes out as the raw unwrapped suggestion URL (no proxy wrapper); with all proxies failing, a working direct response still hydrates and zero proxy-wrapped requests are made; a failing direct request falls back to the proxy chain and its first usable result wins; no `imdb.com/title/` page-provider URL is ever requested — verify red: `pnpm test -- tests/unit/imdb.test.js`
- [x] 2.2 Write failing `tests/unit/imdb.test.js` additions for the new retry policy: a proxy 408 (and 502/504) advances to the next source without retrying the same proxy; a 429 still retries once honoring `Retry-After`; a route where every source always fails issues no more than 7 requests for one movie — verify red: `pnpm test -- tests/unit/imdb.test.js`

## 3. API test suite — tests first (TDD, pure Jest, no new dependencies)

- [x] 3.1 Write failing `tests/api/imdb.api.test.js` API-contract tests: status handling for 200/408/429/502/504, `Retry-After` present / absent / case-insensitive header lookup, malformed JSON and empty suggestion payloads treated as source failures — verify red: `pnpm test -- tests/api/imdb.api.test.js`
- [x] 3.2 Write failing CORS-posture tests: the direct request carries no custom headers (a plain GET that cannot trigger an OPTIONS preflight), and a simulated CORS block (fetch rejecting with `TypeError`, what a browser CORS failure looks like to calling code) falls back to the proxy chain — verify red: `pnpm test -- tests/api/imdb.api.test.js`
- [x] 3.3 Write failing fetch-transport tests: a hanging request aborts at the timeout (fake timers over a never-resolving fetch), a network `TypeError` advances the chain, and a JSON parse failure is treated as an unusable source — verify red: `pnpm test -- tests/api/imdb.api.test.js`

## 4. Rate-limit strategy suite — tests first (TDD)

- [x] 4.1 Write failing sustained-at-pace tests (`tests/api/imdb.api.test.js`): against a healthy always-200 source, a sustained enqueue stream at the self-imposed pace (bounded concurrency, 150–400 ms launch gap) completes with every request succeeding, zero 429s observed, and consecutive launches spaced at least the configured gap apart — verify red: `pnpm test -- tests/api/imdb.api.test.js`
- [x] 4.2 Write failing exceed-the-limit tests: a source that starts answering 429 with a `Retry-After` hint once a request threshold is crossed is retried gently — the client waits the hinted window before repeating and never exceeds one retry per proxy — verify red: `pnpm test -- tests/api/imdb.api.test.js`
- [x] 4.3 Write failing reset-window recovery tests: the rate-limited source starts succeeding again once its reset window elapses; with fake timers advanced past `Retry-After`, the same automated chain recovers and hydrates the movie without user action — verify red: `pnpm test -- tests/api/imdb.api.test.js`
- [x] 4.4 Write failing boundary and burst-vs-sustained tests: concurrent requests at the boundary hold in-flight exactly at the fixed bound with the next request waiting; a 9-movie burst gist import peaks at the bound and rotates across proxies; a sustained stream never exceeds the bound — verify red: `pnpm test -- tests/api/imdb.api.test.js`

## 5. Ratings removal — tests first (TDD)

- [x] 5.1 Rewrite the rating tests in `tests/ui/cards.test.js`: delete "score badge shows the correct rating…" and "score badge renders the em dash placeholder…"; add a test that a hydrated card's badge row contains `.badge--year` and `.badge--link` but no `.badge--imdb`, and one that a failed-hydration card still shows the year placeholder and the IMDb link — verify red: `pnpm test -- tests/ui/cards.test.js`
- [x] 5.2 Rewrite the pipeline tests in `tests/integration/pipeline.integration.test.js`: "suggestion API is tried first…" loses its rating assertion and gains a no-rating-badge assertion; "suggestion failure falls back to JSON-LD for the rating" becomes "direct failure falls back to the proxy chain" (route the suggestion endpoint itself to fail then succeed via proxy); delete `jsonLdRoute` usage and the "provider chain walked: suggestion, then page" assertion in favor of "no page-provider URL requested" — verify red: `pnpm test -- tests/integration/pipeline.integration.test.js`

## 6. Implementation

- [x] 6.1 Rewrite `src/imdb.js` around the direct-first chain: try the raw suggestion URL once, then the rotated proxy chain; delete the page provider, `normalizeLd`, `extractLdJson`, `findTitleLd`, `PAGE_URL`, and `rating` from normalized output; 408/502/504 advance to the next source immediately, 429 keeps `Retry-After`/backoff with one retry per proxy; rewrite the header comment's false CORS claim with the measured evidence — verify green: `pnpm test -- tests/unit/imdb.test.js tests/api/imdb.api.test.js`
- [x] 6.2 Update `src/app.js` card markup: remove the `.badge--imdb` span and `scoreOrDash`, keep `.badge--year` and `.badge--link` (link still renders from the movie ID even when details fail); update `hydrateCard` to stop touching rating — verify green: `pnpm test -- tests/ui/cards.test.js tests/integration/pipeline.integration.test.js`

## 7. Harness + battery cleanup

- [x] 7.1 Remove the `jsonLdRoute` helper from `tests/helpers/app-harness.js` and its imports in `tests/ui/cards.test.js` / `tests/integration/pipeline.integration.test.js`; sweep for any other `normalizeLd`/`extractLdJson`/`api.imdbapi.dev`/JSON-LD remnants in tests and shipped code and delete them — verify all suites load and pass: `pnpm test`

## 8. Docs + design-system regeneration

- [x] 8.1 Update `DESIGN.md` (Chips section: badge row is year + IMDb link, no rating) and `.impeccable/design.json` (Score Badge component loses the star/rating) to match the shipped card — verify no rating-badge references remain: `grep -n "rating" DESIGN.md .impeccable/design.json` returns only intentional mentions
- [x] 8.2 Correct `PRODUCT.md` stale claims: the page does fetch IMDb metadata at runtime (drop "curated static data only / no runtime APIs / no live data fetching"), the card list drops the Rotten Tomatoes score, the deleted `movies.js` reference is removed, and the Platform stack reflects the `src/` + `tests/` layout — verify: `grep -n "movies.js\|no runtime APIs\|Rotten" PRODUCT.md` returns nothing

## 9. Continuous integration

- [x] 9.1 Add `"packageManager": "pnpm@11.21.0"` to `package.json` so Corepack pins pnpm from the manifest — Corepack reads `packageManager`, not `devEngines.packageManager`, so without it the container would take Corepack's default and reintroduce version drift; keeping the version in the manifest keeps the workflow free of hardcoded versions (DRY) — verify: `node -p "require('./package.json').packageManager"` prints `pnpm@11.21.0`
- [x] 9.2 Create `.github/workflows/tests.yml`: triggered on push and pull_request; one job, `runs-on: ubuntu-latest`, running entirely inside `container: node:24-bookworm-slim`; steps are `actions/checkout@v4` followed by a single run block — `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm test`; no `actions/setup-node`, no `pnpm/action-setup`, no cache step (the image *is* the Node setup, and the dependency tree is three devDependencies) — verify: the YAML parses (`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/tests.yml'))"`) and the same three commands run green locally inside `docker run --rm -v "$PWD":/app -w /app node:24-bookworm-slim bash -c "corepack enable && pnpm install --frozen-lockfile && pnpm test"` (run it against a throwaway copy so the host `node_modules` is untouched)

## 10. Full verification

- [x] 10.1 Run the whole suite and confirm every test passes with no rating/JSON-LD remnants and no root-level test files: `pnpm test`
- [x] 10.2 Validate the change artifacts: `openspec validate direct-metadata-fetch --strict`
- [ ] 10.3 Manual smoke in a browser with devtools open: paste a link and confirm in the Network tab that the suggestion request goes out directly (no `allorigins`/`codetabs`/`cors.workers.dev` wrapper), the card hydrates in well under a second, and no 408/429 appears in the console
