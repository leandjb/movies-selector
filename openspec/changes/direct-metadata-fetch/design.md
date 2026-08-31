## Context

The `metadata-fetch` capability (merged from `orange-glass-redesign`) describes a proxy-first pipeline: every IMDb request goes through a rotating chain of three free CORS proxies with per-proxy retries. Live measurement during exploration invalidated the premise recorded in `imdb.js`'s header ("NO CORS headers, so via proxies"): the suggestion API returns `Access-Control-Allow-Origin` echoing the caller's origin, answers directly in ~86 ms, and did so on 8/8 sampled requests — while all three proxies failed the same session (allorigins 500/520 after 13.4 s, codetabs 522, cors.workers.dev 429). The second provider (title-page JSON-LD, our only rating source) is WAF-blocked: HTTP 202 with a zero-byte body direct, 522 through both reachable proxies — so ratings have never actually rendered (cards show "—"). The queue, dedup, and cache machinery from the previous change (`queue.js`, round-robin rotation, `Retry-After` handling) all still work and stay.

## Goals / Non-Goals

**Goals:**
- Fetch the suggestion API directly, first, with no proxy — the happy path becomes one ~86 ms request per movie.
- Keep the proxy chain as a demoted fallback (rotation, dedup, cache, `Retry-After` all preserved).
- Stop amplifying failures: gateway errors advance instead of retrying; total requests per movie bounded at 7 worst case (today: 18).
- Remove the dead rating pipeline end to end (fetch layer + card UI + tests + specs).
- Pin the real-world failures with a pure-Jest API suite: unwrapped direct request, fallback on direct failure, 408-advance, bounded volume, preflight-free requests.
- Leave the tree organized: business modules under `src/`, every test under `tests/` — placement-only, no logic rewrites.

**Non-Goals:**
- No use of the suggestion payload's extra fields (cast `s`, popularity `rank`) — free data, but out of scope here.
- No API-key integration (OMDb/TMDB) for ratings; ratings are simply gone.
- No changes to `queue.js`, `board.js`, `gist.js`, `winner.js`, `topbar.js`, `toast.js`.
- No change to the 10 s per-request timeout (only the fallback path can be slow enough to hit it).
- Keeping or dropping `cors.workers.dev` from the fallback list: it stays — it costs nothing in the happy path and the fallback only runs when direct fails. Revisit only if telemetry shows it wasting the budget.
- No new test dependencies (supertest was considered and rejected — the app has no server to point it at, and live third-party calls in CI would reintroduce the flakiness this change removes). No code rewrites beyond the file moves: the restructure is placement-only (KISS/YAGNI).

## Decisions

### D1. Direct-first provider replaces proxy-first ordering
`fetchTitle` tries one new source before the proxy chain: the raw suggestion URL (no wrapper). On success it returns immediately. On failure — network error, CORS block, non-OK status, unusable body — it falls through to the existing `tryProxies` chain unchanged. The provider array shrinks from `[suggestion, page]` to `[direct, proxies]` where "proxies" means the same suggestion endpoint wrapped. The header comment's false CORS claim is rewritten with the measured evidence and a dated note, since it is what misled the design originally.
*Alternative considered:* racing direct against a proxy — rejected: doubles request volume, the opposite of the 429 goal.

### D2. Ratings are removed at the fetch layer and the UI layer; `board.js` is untouched
`imdb.js` deletes the page provider, `normalizeLd`, `extractLdJson`, `findTitleLd`, `PAGE_URL`, and stops emitting `rating` (suggestion never had one). `app.js` drops the `badge--imdb` span and `scoreOrDash`. `board.js` keeps tolerating a `rating` field: `normalizeMovie` passes it through, old localStorage boards containing ratings keep loading, and the field is simply never rendered or fetched again. This is the low-risk cut — purging the field from the persistence shape would touch storage migration for zero user-visible gain.
*Alternative considered:* full purge including `board.js` — rejected: touches persisted-data shape for no behavioral benefit.

### D3. Gateway failures advance; rate limits retry
408/502/504 mean the proxy itself is struggling — retrying the same proxy adds load to a struggling hop (the user's console showed allorigins 408 twice before giving up). Those statuses advance to the next source immediately. 429 is different: it means *we* are rate-limited, and waiting may genuinely clear it — so 429 keeps the `Retry-After`/backoff path with one retry per proxy (down from two). Direct requests are never retried: one attempt, then the fallback chain takes over.
*Alternative considered:* treating all failures uniformly — rejected: it either wastes the budget on dead hops or gives up on recoverable rate limits.

### D4. The per-movie budget is emergent, not a counter
With direct = 1 attempt, fallback = 3 proxies × 2 attempts, and gateway errors advancing immediately, the worst case is 7 requests per movie with no additional bookkeeping. Rather than adding a budget counter to `imdb.js`, the tests assert the bound (a route that always fails, counting calls ≤ 7). If a future change adds sources, the test — not a runtime guard — is the tripwire.
*Alternative considered:* a hard runtime cap with an error — rejected: dead code for a bound the architecture already guarantees.

### D5. TDD ordering mirrors the previous change
New failing tests first: `tests/unit/imdb.test.js` (direct goes out unwrapped; all-proxies-fail-but-direct-works hydrates with zero proxy calls; direct failure falls back; 408 advances; always-fail stays ≤ 7 requests; no page-provider URLs ever requested), then badge-row updates in `tests/ui/cards.test.js` (no rating badge, year + link only). Implementation follows, then the DOM/integration battery (`tests/integration/pipeline.integration.test.js` rewrites its "provider chain walked: suggestion then page" test into "no page-provider URL is ever requested" and retightens its 429 bound), then harness cleanup (`jsonLdRoute` helper and its imports deleted).

### D6. Two-layer test architecture — pure Jest, no supertest
The API suite (`tests/api/imdb.api.test.js`) runs entirely on the existing injected-fetch harness pattern (routed `fetch` doubles with a call log), organized in four describe layers: **API contract** (status handling including 502/504, `Retry-After` presence and case-insensitive lookup — the harness `makeResponse` already provides a case-insensitive `headers.get` — and malformed/empty payloads), **CORS posture**, **fetch transport**, and **chain integration**. Supertest was evaluated and rejected: it asserts against HTTP servers, this app deliberately has none, and a local fixture server would test our own emulation rather than the shipped code path. Consequence recorded honestly: **CORS is enforced by browsers, not Node**, so no Jest test can assert a live CORS rejection. Instead the suite asserts what calling code can control — the direct request must be a *simple* request (no custom headers, so the browser never fires an OPTIONS preflight) and a simulated CORS block (fetch rejecting with `TypeError`) must trigger the proxy fallback. Real CORS behavior stays covered by the manual browser smoke task.
*Alternative considered:* local fixture server + supertest — rejected per user decision: extra dependency, and the fixture's contract is only as good as our assumptions, which the existing fetch doubles already encode.

### D7. Repository layout — `src/` + `tests/*`, placement-only, reorg first
The tree reorganizes once, at the start of the change, so every later file is born at its final path:

```
index.html / styles.css / favicon.svg   entry points, stay at root
src/        imdb · queue · board · gist · winner · topbar · toast · app
tests/
  helpers/   app-harness (reads src/app.js + root index.html)
  unit/      board · gist · winner · queue · topbar · toast · imdb
  api/       imdb.api.test.js (new, D6)
  integration/  integration · pipeline.integration
  ui/        fixture · sections · cards · modals
```

Mechanical consequences, nothing more: `index.html` script tags gain the `src/` prefix, test imports become `../../src/*.js`, `package.json` `testMatch` narrows to `tests/**/*.test.js`, the harness path updates, README paths update. jsdom stays a per-file docblock, unaffected by folders. The reorg lands **before** any fetch/test work so no task references a stale path, and it is verified by the suite staying green — the harness loads the shipped `index.html`, so a missed script-tag update fails loudly rather than silently.

### D8. Rate-limit strategy suite — what maps, what's rejected
A requested rate-limit test strategy reconciles against this pipeline as follows. **Mapped** (all in `tests/api/imdb.api.test.js`, on D6's harness): (1) sustained traffic at the *self-imposed* pace — there is no documented limit to honor (undocumented endpoint, see Risks), so the contract under test is our own pacing: bounded concurrency + 150–400 ms gap; (2) exceed-the-limit → 429 with `Retry-After` honored, one gentle retry per proxy; (3) reset-window recovery — fake timers advance past the window and the same automated chain recovers without user action; (4) boundary concurrency (in-flight exactly at the bound, the +1 request waits) and burst-vs-sustained (9-movie gist burst peaks at the bound; a sustained stream never exceeds it). **Rejected**, recorded so they aren't re-proposed: per-user/API-key limits — the product is keyless and accountless by pinned principle, so no caller identity exists to vary; and `X-RateLimit-Remaining`/`X-RateLimit-Reset` handling — verified live that no source in the chain sends those headers, and acting on them would be adaptive throttling, previously rejected as over-engineering (YAGNI). The suite keeps asserting `Retry-After`, which real sources do send.

### D9. Continuous integration — one workflow, one job, Docker-isolated
`.github/workflows/tests.yml` runs the suite on push and pull_request as a single job on `ubuntu-latest` that executes **entirely inside a container** (`container: node:24-bookworm-slim`): `actions/checkout@v4`, then `corepack enable` → `pnpm install --frozen-lockfile` → `pnpm test`. No `actions/setup-node`, no `pnpm/action-setup` — the image **is** the Node setup, and pnpm is pinned by Corepack from the manifest. Two consequences worth stating: `package.json` gains a top-level `packageManager: "pnpm@11.21.0"` field, because Corepack reads `packageManager` (not `devEngines.packageManager`) and would otherwise fall back to its bundled default, reintroducing the exact version drift isolation is meant to remove; and no cache step is needed for a three-package devDependency tree (KISS — a pnpm store cache inside a container job is fiddly and a known source of stale-cache failures).

What the isolation actually buys: a pinned Node 24 line, a Corepack-pinned pnpm, zero runner preinstalls or globally installed tools bleeding in, pnpm's symlinked store contained inside the container, and byte-identical local reproduction via the same `docker run` command. What it explicitly does **not** buy, stated so it isn't re-litigated: Jest behavior is unchanged — `--experimental-vm-modules` is a launch flag in the existing `pnpm test` script, not an environment dependency, and the suite is fully offline by design (every network call is an injected fetch double), so there is no native build, no port binding, and no environment-specific Jest failure mode left for a container to fix. Isolation here is about a reproducible toolchain, not about Jest.

The image tag is minor-pinned (`node:24-bookworm-slim`) rather than digest-pinned: patches float, which is safe because the dependency tree has no native modules to rebuild, and a digest would need manual bumps for security patches.

## Risks / Trade-offs

- [Relying on an undocumented endpoint] — `v3.sg.media-imdb.com` is IMDb's own search-suggest backend; they could change CORS or availability without notice. → The fallback chain stays intact and tested; a direct failure degrades to today's behavior, not worse.
- [Intermittent cold-edge CORS] — one sampled cold request returned without the CORS header before the edge warmed. → Treated as a direct failure; the fallback chain covers it. The fallback test asserts exactly this path.
- [Ratings disappear from cards] — the mockup showed "★ 8.8". → Accepted by decision: the number was never real (always "—"); honest placeholders beat fabricated scores. The IMDb link keeps one-tap access to the real rating.
- [Retry policy change could give up "too early" on a slow-but-alive proxy] — a 408 proxy gets no second chance. → With three fallback proxies plus direct, giving up one hop early costs nothing when others are healthy; the bound test keeps the ceiling honest.
- [Stored boards still carry rating values] — harmless: normalized in, never rendered. → No migration.
- [Reorg breaks imports or script tags] — stale paths would silently skip suites or fail to boot. → `testMatch` narrows to `tests/**` so a root-level leftover fails loudly, and the harness loads the shipped `index.html`, so a wrong `src/` prefix breaks every DOM suite at once; the reorg task's exit criterion is a fully green suite.
- [Fetch doubles don't enforce CORS the way browsers do] — Node fetch ignores `Access-Control-Allow-Origin`, so a "CORS failure" can only be simulated. → The suite asserts the preflight-free posture of the request itself and the fallback-on-`TypeError` behavior; real CORS is covered by the browser smoke task (10.3).
- [Docker Hub throttles anonymous pulls on runner IPs] — a containerized job pulls `node:24-bookworm-slim` from Docker Hub on every run and can be rate-limited. → Low impact on a repo this size; if it bites, add a Docker Hub login (or fall back to the `actions/setup-node` shape this replaced). The job is one pull of a slim image.
- [Container job runs as root] — GitHub runs job containers as root, so pnpm's install scripts execute root-owned. → No untrusted code is installed (three first-party-dev dependencies from the lockfile, frozen), so the blast radius is unchanged from a normal runner job.

## Migration Plan

Static files ship together; no persisted-state migration (boards with stored ratings load fine, ratings just stop rendering). Rollback is a plain revert. Docs (`DESIGN.md` badges, `.impeccable/design.json` Score Badge, PRODUCT.md's stale "no runtime APIs / curated static data" claims and deleted `movies.js` reference) update in the same change so the written system matches the shipped one.

## Open Questions

None — the four decisions (direct-first, ratings dropped, gateway-advance, capture strategy) were settled with the user during exploration; remaining choices (cast data out of scope, `cors.workers.dev` stays, `board.js` untouched) are recorded above as design boundaries.
