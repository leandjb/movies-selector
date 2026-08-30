## Why

The current 72-test suite covers the pure modules (imdb, board, gist, winner) and a DOM-less simulation of the pipeline — but nothing exercises the actual UI layer: `app.js` rendering, the control sections, the modals, the vote cluster, or the hydration flow through the real DOM. Every UI change so far (sections reshuffles, modal reworks, reskins) has been verified by hand. At the same time the repo has no README: a newcomer can't see the module graph, the IMDb provider/proxy chain, the storage schema, or how voting and reveal fit together. The host wants the UI pinned by tests and the architecture documented with diagrams.

## What Changes

- Add a **DOM test harness** (jsdom) that loads the real `index.html` markup and the real `app.js` (no copied fixture markup, no app-code changes), with `fetch` mocked and a controllable clock for the hydration queue's randomized gaps.
- Add **unit tests for the UI components**: the three control sections (budget stepper, add-by-link form, import controls), the status bar (count, feedback, Clear all), movie cards (rank, badges, remove, poster fallback), and the vote cluster (counter arc share, disabled states).
- Add **tests for both modals**: clear-all confirmation (open/close paths, focus trap, confirm wipes board + votes) and the winner reveal (blocked while votes are unallocated, winner card + percentage rows, ties, focus return, fresh tally per open).
- Add **integration tests for the IMDb fetch/hydration pipeline through the DOM**: paste-a-link → hydration queue → proxied fetch → card hydrates (title/year/poster, rating "—" from the suggestion API); proxy failure chains with capped backoff → error card; TXT multi-import; gist import success and typed failure paths, all with mocked network (suite stays fully offline).
- Add a **README.md** documenting the architecture with **mermaid diagrams**: module graph, add→hydrate data flow (sequence), reveal gating (state diagram), the IMDb provider chain + CORS proxy fallback, storage schema, and a test map.

## Capabilities

### New Capabilities

<!-- none — tests and docs only; no behavior delta (skip_specs) -->

### Modified Capabilities

<!-- none — app behavior is untouched; app.js/index.html changes are not part
     of this change (the harness must work against the code as it ships). -->

## Impact

- `package.json`: adds `jest-environment-jsdom` (and `jsdom`) as devDependencies via pnpm; jest config gains nothing global — DOM env is opted into per file via `@jest-environment jsdom` docblocks.
- New files: `tests/helpers/app-harness.js` (DOM fixture loader + fetch mock + app.js eval loader), `sections.test.js`, `modals.test.js`, `cards.test.js`, `pipeline.integration.test.js` (names indicative), `README.md`.
- No changes to `app.js`, `index.html`, `styles.css`, or the pure modules — if the harness hits a genuine app bug, it is reported, not patched around silently.
- Existing 72 tests must stay green; the suite remains offline and fast (fake timers for queue gaps, mocked fetch).
- Note: `purple-glass-reskin` (10 tasks, untouched) remains queued ahead of this change; the reskin only touches colors/layout, so the DOM harness — built from the real markup — is unaffected either way it lands.
