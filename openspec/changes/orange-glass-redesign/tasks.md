## 1. Fetch pipeline — tests first (TDD)

- [x] 1.1 Add deferred-route support to `tests/helpers/app-harness.js` (manually-resolved fetch promises + in-flight counter helper) and verify existing suites still pass: `pnpm test`
- [x] 1.2 Write failing `queue.test.js` covering: bounded concurrency observed via in-flight counter, per-slot start gap, FIFO completion, error isolation between slots — verify the suite fails because `queue.js` doesn't exist: `pnpm test -- queue.test.js`
- [x] 1.3 Write failing `imdb.test.js` additions for proxy round-robin (consecutive `fetchTitle` calls start at successive proxy offsets, verified via the call log), `Retry-After` (integer seconds, HTTP-date, cap at 15 s, absent → backoff), and removal of the dead `api.imdbapi.dev` provider — verify they fail: `pnpm test -- imdb.test.js`

## 2. Fetch pipeline — implementation

- [x] 2.1 Create `queue.js` (`createQueue({ worker, concurrency, gap })`: fixed-bound scheduler, in-flight dedup map, per-session result cache, no-DOM, attaches to `window.Queue`) and verify `queue.test.js` passes green: `pnpm test -- queue.test.js`
- [x] 2.2 Update `imdb.js`: module-level rotation counter for proxy offsets, `Retry-After` parsing with cap, delete `fetchFromImdbapiDev`/`API_BASE`/`normalizeTitle` and their tests, keep suggestion → JSON-LD chain and placeholder degradation — verify `pnpm test -- imdb.test.js` and existing integration suites still green

## 3. Topbar + toast — tests first (TDD)

- [x] 3.1 Write failing `topbar.test.js` (pure module): `missingVotes(budget, allocated)` math, pill label/state including the ready state at full allocation, count-chip text `N / 9`, empty-board disabled state — verify red: `pnpm test -- topbar.test.js`
- [x] 3.2 Write failing `toast.test.js` (jsdom + fake timers): stacking order, max-visible cap, auto-dismiss after the bounded duration, `aria-live` region present, error variant class — verify red: `pnpm test -- toast.test.js`

## 4. Topbar + toast — implementation

- [x] 4.1 Create `topbar.js` (no-DOM view-model, attaches to `window.Topbar`) and verify `topbar.test.js` green: `pnpm test -- topbar.test.js`
- [x] 4.2 Create `toast.js` (`createToaster({ container, document, maxVisible, duration })`, factory with injected container/timers, attaches to `window.Toaster`) and verify `toast.test.js` green: `pnpm test -- toast.test.js`

## 5. Layout restructure (index.html + app.js)

- [x] 5.1 Restructure `index.html`: glass navbar (brand + tag, count chip `board-count-chip`, votes pill `votes-pill`, navbar `show-winner` button), hero two-column grid with right `hero__tools` stacking budget (stepper + progress bar + votes-left label), add-by-link form, gist import form; delete status bar, board-head, and below-grid reveal sections; add toast region with `aria-live="polite"` and quiet clear-all at the board edge; kicker copy "NINE SLOTS · ONE PICK" — verify the harness `REQUIRED_IDS` update (task 7.1) drives loud failures for any missed id: `pnpm test`
- [x] 5.2 Rewire `app.js`: replace the inline hydration queue with `window.Queue` (concurrency 3), route all feedback through `window.Toaster`, render navbar chip/pill via `window.Topbar` on every render/vote/remove/budget change, remove `txt-input`/FileReader flow and inline `adder-feedback` logic, keep vote/remove/clear/winner-modal behavior and focus management identical — verify card voting, gist import, clear-all, and reveal flows behave in the suites: `pnpm test`

## 6. Orange glass retheme (styles.css + favicon)

- [x] 6.1 Retheme `styles.css` as a token-level swap per design D1: amber accent family + warm near-black ground + warm ambient blobs, navbar/hero/toast/progress-bar component styles, modals/footer/cards recolored, keep BEM names and glass construction rules (glass lip, hairline borders, unblurred poster wells) — verify by loading `index.html` in a browser and confirming every pane uses amber tokens with no violet remnants: `grep -n "a78bfa\|7c5cf0\|c4b5fd" styles.css` returns nothing
- [x] 6.2 Recolor `favicon.svg` to the amber accent and verify it renders: open `favicon.svg` in a browser

## 7. Test battery refactor

- [x] 7.1 Update `tests/helpers/app-harness.js`: new `REQUIRED_IDS` (`votes-pill`, `board-count-chip`, navbar `show-winner`, `toast-region`; drop `adder-feedback`), keep the fetch router keyed by unwrapped targets — verify all suites load: `pnpm test`
- [x] 7.2 Rewrite `sections.test.js` as navbar + hero-control-column grouping assertions (four-sections assertions deleted) and update `cards.test.js` for the year + IMDb-link badge row (`target="_blank"`, `rel="noopener noreferrer"`, placeholder "—" rating) — verify green: `pnpm test -- sections.test.js cards.test.js`
- [x] 7.3 Remove TXT-import tests and flows from `integration.test.js`/`pipeline.integration.test.js`; add integration coverage: bulk gist import runs with >1 request in flight under the bound, consecutive requests rotate proxies, re-added movie served from cache with zero network calls, 429 + `Retry-After` shifts traffic without a retry storm, navbar pill ticks down on paste/vote/remove, toasts replace inline feedback — verify green: `pnpm test`

## 8. Docs + design-system regeneration

- [x] 8.1 Regenerate DESIGN.md (amber frontmatter tokens + narrative, named rules carried over) and `.impeccable/design.json` from the shipped CSS, fixing the stale cyan-era file — verify frontmatter colors match `styles.css` custom properties: manual diff
- [x] 8.2 Update PRODUCT.md visual-direction clause: amber glass replaces violet as the pinned direction per this explicit instruction — verify the clause no longer references violet: `grep -n "violet" PRODUCT.md` returns nothing

## 9. Full verification

- [x] 9.1 Run the whole suite and confirm every test passes with no skipped TXT remnants: `pnpm test`
- [x] 9.2 Validate the change artifacts: `openspec validate orange-glass-redesign --strict`
- [ ] 9.3 Manual smoke in a browser: load `index.html`, paste a link, import a gist, vote to full allocation, reveal the winner, clear all — confirm toasts, pill, progress bar, and amber glass throughout
