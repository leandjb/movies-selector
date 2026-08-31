## Why

The metadata pipeline routes every IMDb request through free CORS proxies based on a false premise — measured testing shows the suggestion API sends `Access-Control-Allow-Origin` and answers directly in 86 ms, while all three proxies failed live (500 / 522 / 429, one taking 13.4 s). The proxies are the sole source of the 408/429 console errors, and the rating pipeline behind them is dead anyway: the IMDb title page is WAF-blocked (202 with a zero-byte body direct, 522 through both proxies), so the "IMDb rating" on cards has always rendered as a placeholder. Meanwhile our retry policy can amplify a single movie into 18 requests, earning the very 429s it retries against.

## What Changes

- **Direct-first fetching**: the suggestion API is fetched directly from the browser — no proxy, one request, ~86 ms. The three-proxy chain (with rotation) is demoted to a fallback used only when the direct request fails.
- **Ratings dropped — BREAKING**: the IMDb title-page JSON-LD provider, its normalizers, and the rating badge are removed. Cards show title, year, poster, and the IMDb link; no rating is displayed or fetched. `board.js` persistence is untouched (it tolerates the missing field).
- **Smarter proxy failures**: 408/502/504 from a proxy advance to the next proxy immediately instead of retrying a struggling proxy; 429 keeps honoring `Retry-After`; retries per proxy drop from 3 attempts to 2.
- **Request budget per movie**: total metadata requests per movie are bounded (worst case 1 direct + 3 proxies × 2 attempts = 7, typical 1), ending the 18-request amplification storm.
- **API test suite (pure Jest, no new dependencies)**: a dedicated `tests/api/imdb.api.test.js` suite over the existing injected-fetch harness, covering the four layers the real-world failures touched — **API contract** (status handling 200/408/429/502/504, `Retry-After` present/absent/case-insensitive, malformed and empty payloads), **CORS posture** (direct requests stay preflight-free — no custom headers; a simulated CORS block, i.e. a fetch `TypeError`, falls back to proxies), **fetch transport** (hanging request aborted at the timeout, network `TypeError`, JSON parse failure), and **chain integration** (unwrapped direct URL first, proxy fallback order, ≤7 request bound). CORS itself is browser-enforced, so live CORS behavior stays covered by the manual browser smoke.
- **Rate-limit strategy suite (pure Jest)**: four strategy groups in `tests/api/imdb.api.test.js` — sustained traffic at the self-imposed pace (there is no documented limit to honor), exceed-the-limit → 429 with `Retry-After` honored, reset-window recovery via fake timers, and boundary/burst-vs-sustained concurrency at the queue bound. Per-user/API-key limits and `X-RateLimit-*` header handling are explicitly out of scope: the product is keyless and accountless, and no source in the chain sends those headers (acting on them would be the previously-rejected adaptive throttling).
- **Continuous integration (Docker-isolated)**: `.github/workflows/tests.yml` — push and pull_request run one job inside `node:24-bookworm-slim`, with pnpm pinned by Corepack from a new `packageManager` field in `package.json`, a frozen-lockfile install, then `pnpm test`; no setup actions, and the same `docker run` reproduces CI locally.
- **Repository restructure (placement-only)**: business modules move to `src/`, all tests move out of the root into `tests/unit|api|integration|ui`, with `index.html` script tags, test imports, the harness, `package.json` `testMatch`, and README updated to match. No logic rewrites — file placement only.

## Capabilities

### New Capabilities

<!-- none — metadata-fetch already exists in main specs -->

### Modified Capabilities

- `metadata-fetch`: provider chain becomes direct-first with proxies as fallback (round-robin now applies to fallback chains only); the title-page JSON-LD provider is removed; retry policy changes (408/502/504 advance immediately); a per-movie request budget is added.
- `shortlist-import`: cards no longer display an IMDb rating — hydration requirement, badge-row requirement, and poster-fallback scenario drop the rating.

## Impact

- **Code**: `imdb.js` rewritten around a direct provider + demoted fallback (deletes the page provider, `normalizeLd`/`extractLdJson`/`findTitleLd`, `PAGE_URL`; header comment rewritten); `app.js` card markup loses the rating badge (`scoreOrDash` removed); `board.js`, `queue.js`, `gist.js`, `winner.js`, `topbar.js`, `toast.js` unchanged. Layout: business modules → `src/`, tests → `tests/unit|api|integration|ui`, `index.html` script tags → `src/*.js`, `package.json` `testMatch` → `tests/**/*.test.js`, harness reads `src/app.js`.
- **Specs**: `openspec/specs/metadata-fetch/spec.md` and `openspec/specs/shortlist-import/spec.md` amended.
- **Docs**: DESIGN.md badge section and `.impeccable/design.json` Score Badge lose the rating; PRODUCT.md's stale "curated static data / no runtime APIs" claims corrected (the page does fetch metadata), the deleted `movies.js` reference removed, and the Platform stack updated to the `src/` + `tests/` layout.
- **Tests**: `tests/unit/imdb.test.js` gains the direct-first/fallback/408/budget suite and loses all JSON-LD tests; new `tests/api/imdb.api.test.js` (API contract, CORS posture, transport, rate-limit strategies); `tests/ui/cards.test.js`, `tests/integration/pipeline.integration.test.js`, `tests/integration/integration.test.js` updated; `jsonLdRoute` helper removed from the harness. **No new dependencies** — the suite is pure Jest over the existing injected-fetch harness; runtime stays static vanilla JS.
- **CI**: new `.github/workflows/tests.yml` (single containerized job on `node:24-bookworm-slim`, frozen-lockfile install, `pnpm test` on push/PR) plus a one-line `packageManager` field in `package.json` so Corepack pins pnpm from the manifest instead of a hardcoded workflow version.
