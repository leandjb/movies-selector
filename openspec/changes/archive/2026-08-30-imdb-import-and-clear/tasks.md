## 1. Spike & Test Setup

- [x] 1.1 Connectivity spike: from a browser context confirm `GET https://api.imdbapi.dev/titles/tt0118881` returns 200 and note the actual field paths for title/year/rating/poster; record the confirmed mapping as the normalization contract at the top of `imdb.js`. Verify: request succeeds and the mapping comment matches the observed JSON
- [x] 1.2 Add Jest config to the ESM-typed package (`"test": "jest"` in `package.json` with `--experimental-vm-modules` or `.cjs` test naming as needed; jsdom environment for integration tests). Verify: `pnpm test` runs green with `--passWithNoTests`

## 2. Core Modules (unit-tested first)

- [x] 2.1 Create `imdb.js` with `extractImdbIds(text)` (case-insensitive `imdb.com/title/tt\d{7,10}`, any subdomain/scheme, surrounding text ignored, bare tt-IDs rejected) exposed to both the browser (global) and Jest (module.exports guard). Verify: unit tests cover valid links, junk lines, duplicates within input, multiple links per line, order preservation
- [x] 2.2 Add `fetchTitle(id, fetchImpl)` to `imdb.js`: fetch + defensive normalization to `{ id, title, year, rating, posterUrl }` with per-field fallbacks; 10s timeout. Verify: unit tests with mocked fetch cover happy path, missing fields, HTTP error, and network failure
- [x] 2.3 Create `board.js` state machine: `addFromText(raw)` (extract → in-input dedupe → board dedupe → cap to 9 free slots → placeholder entries), `hydrate(id, details)`, `clear()`, `toJSON`/`fromJSON`, injected storage. Verify: unit tests cover the 9-cap, duplicates, invalid input, clear, and persistence round-trip

## 3. Page Wiring

- [x] 3.1 Update `index.html`: remove `movies.js`, add `imdb.js` + `board.js` scripts, "Add movies" glass toolbar (paste input + Add, hidden file input with "Import .txt" label, `n / 9` counter pill, disabled "Clear all" button), `aria-live` feedback region, empty-state pane in the grid, and the confirmation modal markup. Verify: page loads without console errors and all new controls are visible
- [x] 3.2 Extend `styles.css` using existing tokens only (`--glass-*`, `--accent`, `--text*`, `--ease`): toolbar layout, counter pill, modal + tinted scrim with focus styles, skeleton shimmer for `loading` cards, dash/`error` states, empty-state pane. Verify: visual pass at 1120/1020/640px widths; no new colors, fonts, or easing curves introduced
- [x] 3.3 Rewire `app.js` onto `board.js`: boot restores the persisted board, prunes orphaned vote ids, retries movies missing details once; sequential hydration; render handles `loading`/`ready`/`error`; toolbar events call `board.addFromText` and render the counter, feedback summary, and disabled states when full. Verify: paste of a valid link creates a card immediately and fills in details; paste of an invalid link shows the error and no card
- [x] 3.4 Strip the Rotten Tomatoes badge and trailer link from `cardHtml` and delete `movies.js`. Verify: no references to `MOVIES` remain (`grep -r MOVIES --include=*.js` is clean); cards render the four fields plus vote controls
- [x] 3.5 Empty-board behavior: zero movies renders the empty pane, hero winner placeholder, and disables "Show the winner" + "Clear all"; first added card replays the entrance animation. Verify: fresh localStorage load shows the empty state; adding a movie transitions out of it
- [x] 3.6 TXT import flow: FileReader.readAsText → `board.addFromText` → summary in the feedback region (`Imported X · duplicates · invalid · skipped`). Verify: importing a mixed file (valid links, junk, duplicates, over-cap) adds up to 9 total and shows the exact counts

## 4. Clear-All Confirmation Modal

- [x] 4.1 Implement the glass modal interaction: open on "Clear all", focus trap, Esc/backdrop/Cancel dismiss without changes, Confirm erases all cards and their votes (both storage keys), focus restored to the trigger. Verify: keyboard-only pass (Tab, Esc, Enter) and confirm clears the board with the empty state restored

## 5. Integration Tests (module ↔ module)

- [x] 5.1 Add an integration test (jsdom) walking paste → `extractImdbIds` → `board.addFromText` → `fetchTitle` (mocked) → hydration → `toJSON` → restored `fromJSON` on a fresh storage, asserting cap/dedupe/summary at each boundary. Verify: `pnpm test` passes including this test
- [x] 5.2 Add an integration test for the clear path: populated board + votes → `clear()` → both storage keys empty and state reset. Verify: `pnpm test` passes

## 6. Review & Finish

- [x] 6.1 Run the Impeccable design review (`pnpm exec impeccable`) against the new toolbar/modal/cards; fix any flagged deviations so the palette, typography, and motion stay exactly on the `.impeccable/design.json` system. Verify: review passes with no palette or motion drift findings
- [x] 6.2 Full spec pass: walk every scenario in `specs/shortlist-import` and `specs/movie-catalog` deltas manually; run `pnpm test` and `openspec validate --change imdb-import-and-clear --strict`. Verify: all scenarios observed, tests green, validation clean
