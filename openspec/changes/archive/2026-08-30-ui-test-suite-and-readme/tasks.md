## 1. Test infrastructure

- [x] 1.1 `pnpm add -D jest-environment-jsdom jsdom` (respect the pinned pnpm 11.21.0 devEngines; do not use npm/npx)
- [x] 1.2 Create `tests/helpers/app-harness.js`: read `index.html` → extract `<body>` markup into the jsdom document; `loadApp()` clearing `localStorage` then indirect-evaling `app.js` source; fetch route table keyed by unwrapped target URL (port `unwrapProxy` from integration.test.js) with a call log and 5xx-by-default; `flushHydration()` fake-timer drainer; fixture sanity helper listing required ids
- [x] 1.3 Sanity test: fixture contains the app's DOM contract ids (`movie-grid`, `show-winner`, `winner-modal`, `clear-modal`, `budget-value`, `adder-form`, `gist-import`, `adder-feedback`, `board-count`, `clear-all`, `board-note`)

## 2. Component unit tests (jsdom)

- [x] 2.1 `sections.test.js` — Vote budget: renders persisted value, clamps 1–99, shrinking below allocation trims largest first and updates remaining; Add-by-link: submit adds + clears input, duplicate/invalid feedback, disabled + placeholder swap at 9/9; Import: gist button disabled while pending, Enter in gist field triggers import; Status bar: count `n / 9`, feedback error/neutral classes, Clear all disabled when empty
- [x] 2.2 `modals.test.js` — Clear-all: no-op when board empty, opens on click, Escape/backdrop/Cancel close, focus trapped in dialog, focus returns to Clear all, confirm wipes board + votes + both storage keys, feedback "Board cleared."; Winner reveal: button disabled when board empty, blocked with exact "Allocate N more vote(s)…" while budget unallocated (message lands in status feedback), opens modal with winner hero (title/year/votes/pct) + ranked rows (votes-descending, winner row highlighted, tie → earliest-added), ✕/Esc/backdrop close and focus returns to the reveal button, reopening after vote changes re-tallies fresh
- [x] 2.3 `cards.test.js` — Insertion order is display order after voting (no re-sort), rank chips 1..n, remove button removes the right card and prunes its votes, badge shows score or "—", broken poster URL swaps to fallback class, empty-state block on empty board, vote cluster: counter arc dasharray scales votes/max, + disabled when budget spent, − disabled at 0 votes, aria-labels name the movie

## 3. Fetch pipeline integration tests (jsdom + mocked network)

- [x] 3.1 `pipeline.integration.test.js` — Add-by-link happy path: suggestion API is the first and only fetch, card hydrates title/year/poster with rating "—"; suggestion 5xx → JSON-LD fallback fetch supplies title+rating; every provider + proxy fails → capped backoff sequence asserted via call log and fake timers, card lands in error state ("Unavailable")
- [x] 3.2 TXT multi-import through the form: N links → N queued hydrations drained, duplicates skipped, board-full skip reported, feedback summary text exact
- [x] 3.3 Gist import through the app: success path adds cards + clears input (api.github.com mocked), typed failures surface exact messages (`bad-ref`, `not-found`, `rate-limited`, `no-text-file`), failed fetch leaves board untouched
- [x] 3.4 Reload persistence: seed storage, re-run `loadApp()`, board + votes + budget restore without re-fetching hydrated movies

## 4. README.md

- [x] 4.1 Write `README.md`: what-it-is, quick start with pnpm (devEngines pin), project layout tree, storage schema (`movieVotes.v1`, `shortlistBoard.v1`), IMDb provider chain + CORS proxy fallback + backoff table
- [x] 4.2 Mermaid diagrams in README: module graph (flowchart), add→hydrate data flow (sequenceDiagram), reveal gating + modal states (stateDiagram-v2)
- [x] 4.3 Testing section: how to run all/one suite, the test map from design.md D6, offline/no-network note

## 5. Verification

- [x] 5.1 `node --check` on all touched JS; full Jest suite green (existing 72 + new suites), zero network access during tests
- [x] 5.2 Manual pass: devDeps added via pnpm (lockfile resolves, `pnpm test` green at 112/112); README mermaid blocks authored — eyeball in a mermaid viewer to confirm they render
