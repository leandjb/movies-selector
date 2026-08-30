## Context

Jest 30 runs as ESM (`"type": "module"`, `node --experimental-vm-modules`), `testEnvironment: "node"`, `testMatch: **/*.test.js`. The five pure-module suites (imdb/board/gist/winner + integration) import the UMD-style sources via `import "./x.js"` and assert against `globalThis.X` — no DOM anywhere. `app.js` is a classic IIFE that grabs its DOM refs at eval time and binds listeners; `index.html` keeps all `<script>` tags in `<head>` with `defer`, so `<body>` is pure markup. The hydration queue sleeps 300–800ms between movies. `jest-environment-jsdom` is not installed. pnpm 11.21.0 is pinned via `devEngines` (npm/npx installs fail).

## Goals / Non-Goals

**Goals:**
- jsdom suites for sections, modals, cards, and the fetch/hydration pipeline through the real `app.js`.
- The fixture IS the shipped markup — zero copied HTML to drift.
- Fully offline: mocked `fetch`, fake timers for queue gaps.
- README.md with mermaid architecture diagrams.

**Non-Goals:**
- No app-code refactors to make things "testable" — the harness adapts to the code.
- No screenshot/visual testing, no e2e browser driver (Playwright etc.).
- Not touching the existing 72 tests except where a helper can replace duplicated logic.
- No coverage-threshold tooling.

## Decisions

### 1. jsdom per file, installed via pnpm

Add `jest-environment-jsdom` + `jsdom` as devDependencies (`pnpm add -D jest-environment-jsdom jsdom`). Keep `testEnvironment: "node"` globally; each DOM suite opts in with a docblock:

```js
/** @jest-environment jsdom */
```

This keeps the pure-module suites on the fast node env and makes the DOM requirement explicit per file.

### 2. The fixture is the real index.html (no drift)

The harness helper reads `index.html` from disk, parses it with `JSDOM`, extracts `<body>`'s inner markup, and assigns it to the test env's `document.body`. Scripts are in `<head>`, so the body carries no executable tags — what the tests see is exactly what ships. A sanity test asserts the required ids exist (`movie-grid`, `show-winner`, `winner-modal`, `clear-modal`, `budget-value`, `adder-form`, `gist-import`, `adder-feedback`, `board-count`, `clear-all`, `board-note`), so a markup restructure (like the queued reskin) fails loudly here instead of silently degrading the suite.

### 3. app.js loads by indirect eval, fresh per test

`app.js` has no import/export statements — it's a classic IIFE. The helper reads the source with `fs` and runs it via `(0, eval)(source)` after the fixture DOM is in place and `localStorage` is cleared. Indirect eval executes in the jsdom global scope, so `document`, `window`, `localStorage`, and the already-imported `globalThis.Board/Imdb/Gist/Winner` resolve naturally. Because eval re-runs the IIFE from scratch, **every test gets a fresh app instance** — no module-cache gymnastics, no `jest.resetModules()` fragility, listeners never accumulate across tests (each eval re-binds onto a fresh DOM). Each test file owns its harness instance via `beforeEach`.

### 4. Fetch is mocked per unwrapped target URL

`imdb.js` fetches through proxies (allorigins → codetabs → workers.dev) wrapping IMDb-owned targets; the existing integration suite already contains an `unwrapProxy()` mapper. That logic moves into the harness (`tests/helpers/app-harness.js`) so mocks are written against the **real target** (`v3.sg.media-imdb.com/...`, `imdb.com/title/...`, `api.github.com/...`) regardless of which proxy wraps them. The mock is a `jest.spyOn(globalThis, "fetch")` with a route table: `url → { status, body }`, plus a call log so tests can assert the provider chain order and backoff attempt counts. Routes default to 5xx so an unmocked network touch fails loudly and offline stays offline.

### 5. Fake timers drive the hydration queue

The queue's 300–800ms gap would make multi-movie tests crawl. Suites use `jest.useFakeTimers()` and drain with `await jest.advanceTimersByTimeAsync(1000)` between assertions. Vote/budget/modal interactions are synchronous and need no timer work; only hydration scenarios advance time.

### 6. Suite layout and the test map

| Suite (docblock jsdom) | Covers |
|---|---|
| `sections.test.js` | Budget stepper: render, clamp 1–99, trim-over-budget on shrink, persistence. Add form: submit adds + clears input, disabled + placeholder swap at 9/9. Import panel: gist Enter-key handler, button disabled while pending. Status bar: count `n / 9`, feedback message classes, Clear all disabled when empty. |
| `modals.test.js` | Clear-all: opens only when board non-empty, Escape/backdrop/Cancel close, focus trap cycles, focus returns, confirm wipes board + votes + storage. Winner reveal: button disabled when empty; blocked with exact "Allocate N more…" message while budget unallocated; opens with winner hero (title, pct), ranked rows (votes-desc, winner highlighted, tie → earliest-added); ✕/Esc/backdrop close + focus return; fresh tally on reopen after vote changes. |
| `cards.test.js` | Card markup: rank order = insertion order (votes never move cards), remove button per card, badge content (score or "—"), poster fallback class on img error, empty state block. Vote cluster: counter arc dash share scales with votes/max, +/− disabled at budget edges, aria-labels. |
| `pipeline.integration.test.js` | Add-by-link happy path: suggestion API first (single proxied call), card hydrates title/year/poster, rating renders "—". Suggestion fails → JSON-LD fallback adds rating. All providers fail → capped backoff (assert call gaps/order via fake timers + call log), card lands in error state ("Unavailable"). TXT multi-add: dedupe + full-board skip summary in feedback. Gist import: success via mocked api.github.com (cards added, input cleared), typed failures surface exact messages (`not-found`, `rate-limited`, `bad-ref`). Persisted board restores on reload (re-eval with same storage). |

### 7. README structure (the doc deliverable)

1. What it is (one paragraph + screenshot slot) · 2. Quick start (`pnpm install`, `pnpm test` — the pinned devEngines note) · 3. **Architecture** — mermaid `flowchart` module graph (index.html → app.js → board/imdb/gist/winner → localStorage), **mermaid `sequenceDiagram`** for add → hydration queue → provider chain → card update, **mermaid `stateDiagram-v2`** for the reveal gate (voting → fully-allocated → modal open/closed) and modal open/close · 4. IMDb data pipeline: provider table (suggestion / JSON-LD / dead api.imdbapi.dev) + proxy chain + backoff rules · 5. Storage schema (`movieVotes.v1`, `shortlistBoard.v1`) · 6. Testing: the test map above + how to run one suite · 7. Project layout tree.

## Risks / Trade-offs

- [jsdom lacks `backdrop-filter`, `scrollTo`, layout] → Tests assert structure/classes/aria and JS behavior, never computed visual layout. The reskin's visual checks stay manual.
- [Indirect eval is unusual] → It is confined to the harness helper with a comment explaining why; app code stays untouched and the harness is the only place that knows about it.
- [Fake timers + async queue interleaving can hang a suite on a mistake] → Harness exposes one `flushHydration()` helper; suites never hand-roll timer math.
- [`jest-environment-jsdom` adds install weight] → Dev-only; pinned via the lockfile like everything else.
- [Fixture sanity test couples the suite to markup ids] → Deliberate: ids are the app's DOM contract; a rename should break tests, not the app.
