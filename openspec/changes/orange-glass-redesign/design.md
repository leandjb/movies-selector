## Context

Static vanilla app: `index.html` + `styles.css` + five classic scripts attaching to `window` (`imdb`, `board`, `gist`, `winner`, `app`). Hydration currently runs through a serial queue embedded in `app.js` (concurrency 1, 300–800 ms inter-movie gaps); `imdb.js` walks 3 proxies sequentially with per-proxy retries and still carries a dead provider (`api.imdbapi.dev`, DNS-dead since July 2026). Feedback renders into an inline status bar; reveal lives below the grid. Specs pin "at most one request in flight" — this change amends that (see delta specs). Jest + jsdom with an eval-based harness (`tests/helpers/app-harness.js`) is the only tooling; `board.js`/`gist.js`/`winner.js` stay untouched.

## Goals / Non-Goals

**Goals:**
- Amber/orange glass reskin executed as a token-level retheme, with DESIGN.md and `.impeccable/design.json` regenerated from the shipped CSS (fixing the stale cyan-era design.json).
- Navbar owns status: brand, board-count chip, votes-missing pill, show-winner button.
- Hero control column owns the three input controls; status bar and board-head sections die; toasts replace inline feedback.
- Hydration that fills a 9-movie board roughly 3× faster without increasing per-proxy request pressure.
- New modules land TDD-first; the whole DOM test battery refactored to the new layout in the same change.

**Non-Goals:**
- No backend, build step, framework, or new runtime dependencies.
- No changes to vote semantics, board persistence schema (`movieVotes.v1`, `shortlistBoard.v1`), gist fetching, or winner tally logic.
- No adaptive/AIMD throttling or circuit breakers (explored, rejected as over-engineered for a 9-card board).
- No new pages for the mockup's footer links (Terms/Privacy/Tech info are dropped as dead ends).

## Decisions

### D1. Reskin = token rewrite, not a CSS rewrite
`styles.css` keeps its structure and BEM names; the retheme swaps custom-property values (accent `#a78bfa` → amber family, e.g. accent `#f5a524`, accent-bright `#ffc857`, accent-ink `#241300`, night ground stays tinted near-black `#0a0806`-family, ambient blobs become warm amber/rust) and regenerates the DESIGN.md frontmatter + `.impeccable/design.json` from the result. Sora/Archivo, glass construction rules (hairline borders, glass lip, unblurred poster wells), and the ≥4.5:1 floor carry over — dark ink on amber passes contrast where white text would fail.
*Alternative considered:* full CSS rewrite alongside the layout change — rejected: it would entangle retheme regressions with restructure regressions in one diff.

### D2. Layout skeleton
New body order: navbar (`site-head` glass bar: brand + tag left, `[count chip] [votes pill] [Show winner]` right) → hero two-column grid (left: kicker/title/slab/lede/CTA; right `hero__tools`: budget panel with stepper + progress bar + "N votes left", add-by-link form, gist import form) → board section (`movie-grid` + a right-aligned quiet clear-all control at its edge) → modals (unchanged structure, retheme only) → footer. Status bar, board-head, and below-grid reveal section are deleted from the HTML. Kicker copy becomes "NINE SLOTS · ONE PICK" (board stays 9 per user decision).
*Alternative considered:* keeping a status strip — rejected: mockup and user decision dissolve it into navbar + toasts.

### D3. Module extraction follows the house pattern (no-DOM modules + one DOM IIFE)
- **`queue.js`** — `createQueue({ worker, concurrency, gap })`: fixed-bound task scheduler (default concurrency 3, one slot per proxy), small per-slot random start gap (150–400 ms) so parallel slots desync. Owns in-flight dedup + per-session result cache (in-memory `Map`; persisted hydration already lives in localStorage via `board.js`, so the cache only needs session scope).
- **`imdb.js`** — keeps proxy list and providers, gains a module-level rotation counter so each `fetchTitle` call begins its proxy chain at the next offset (round-robin); parses `Retry-After` (integer seconds or HTTP-date, capped at 15 s so the queue never stalls; absent → existing capped backoff); deletes the dead provider and its `normalizeTitle`/`API_BASE` baggage.
- **`topbar.js`** — pure view-model: `missingVotes(budget, allocated)`, pill label/state (`missing N` vs ready state), count-chip text `N / 9`. No DOM, like `winner.js`.
- **`toast.js`** — `createToaster({ container, document, maxVisible, duration })` factory with injected container and timers: stacked transient messages (`info`/`error`), auto-dismiss, one polite `aria-live` region rendered in `index.html` (not dynamically).
*Alternative considered:* putting round-robin state in the queue — rejected: proxy knowledge already lives in `imdb.js`; the queue must stay proxy-agnostic.

### D4. Concurrency bound = number of proxies (3)
With rotation, steady state is ≤1 in-flight request per proxy — the same per-proxy pressure as today's serial queue, but the wall clock for 9 movies drops roughly 3×. The bound is a `queue.js` constant, not config.
*Alternative considered:* unbounded/6+ — rejected: exceeds per-proxy headroom and invites exactly the 429 storms we're removing.

### D5. TDD ordering and battery refactor
New suites are written first and fail before their modules exist: `queue.test.js` (fake timers + controllable deferred fetch routes: observes concurrency via an in-flight counter, rotation via the proxy-annotated call log, dedup, cache hits, `Retry-After` waits, bounded retries), `topbar.test.js` (pure math/labels), `toast.test.js` (jsdom + fake timers: stacking, cap, auto-dismiss, aria region). Then modules, then the HTML/CSS restructure, then the DOM battery: `sections.test.js` rewritten as navbar/hero-grouping assertions, `cards.test.js` gains year + IMDb-link badge cases, `integration.test.js`/`pipeline.integration.test.js` drop TXT flows and add parallel-hydration, cache-dedup, and 429-failover flows, and the harness updates `REQUIRED_IDS` (adds `votes-pill`, `board-count-chip`, `show-winner` navbar id, `toast-region`; drops `adder-feedback`) plus a deferred-route helper for concurrency tests. TXT-import tests are deleted with the feature.
*Rationale:* the harness's `REQUIRED_IDS` tripwire is what makes the restructure fail loudly instead of silently degrading suites.

### D6. Card badge row gains year + IMDb link
Badge row renders `[★ rating] [year] [IMDb ↗]`; the IMDb anchor is buildable from the card's own id (`https://www.imdb.com/title/{id}/`, `target="_blank" rel="noopener noreferrer"`), so it renders even when hydration fails. Unfetched rating keeps the "—" placeholder convention (the mockup's "TBD" is not adopted).
*Alternative considered:* adopting mockup's "TBD" — rejected: changes an asserted convention for no behavioral gain.

## Risks / Trade-offs

- [Slow proxy stalls one slot for up to the 10 s timeout] → unchanged timeout keeps worst-case per-slot latency identical to today; the other slots keep flowing.
- [Shared keyless proxies still 429 under heavy use] → rotation spreads load, `Retry-After` respects limits, session cache eliminates repeat traffic; total request volume never exceeds today's worst case per movie.
- [Retheme and restructure in one change entangles regressions] → TDD isolates module work first; DOM battery rewrites assert the new layout explicitly; harness tripwire catches id drift.
- [jsdom concurrency tests flake on real timing] → deferred (manually-resolved) route promises + fake timers; no wall-clock assertions.
- [Removing TXT import strands users with local lists] → paste still accepts multi-line text of links; proposal documents the gist migration path.
- [`Retry-After` HTTP-date parsing varies across proxies] → both integer-seconds and HTTP-date supported, capped at 15 s; unparseable values fall back to backoff.

## Migration Plan

Single static deploy: all files ship together; persisted localStorage schemas are untouched, so existing boards and votes survive the upgrade with no migration. TXT-import users switch to gist/paste. Rollback is a plain revert.

## Open Questions

None — layout forks (9-card board, gist-only, toast + quiet clear-all, right-side pill, package A) were resolved with the user during exploration; remaining micro-decisions (kicker copy, "—" placeholder, dropped footer links) are recorded above.
