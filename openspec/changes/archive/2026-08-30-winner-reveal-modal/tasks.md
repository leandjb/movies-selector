## 1. Tally module

- [x] 1.1 Create `winner.js` as a UMD module (`window.Winner`, `globalThis.Winner` under Jest) exposing `tallyResults(movies, votesById, budget)`
- [x] 1.2 Implement the tally: `missing-votes` (with `remaining`) when any budget is unallocated, `empty-board` for no movies, otherwise `{ ok, total, winnerId, rows }` with rows `{ id, title, year, posterUrl, votes, pct }` (`pct = Math.round(votes/total*100)`), sorted by votes descending, winner = max votes with earliest-added tie-break
- [x] 1.3 Create `winner.test.js`: exact-percentage happy path, tie → first-added, missing-votes `remaining`, empty board, zero-vote rows at 0%, block flips to `ok` when the last vote is allocated
- [x] 1.4 Add `winner.js` script tag to `index.html` (defer, before `app.js`)

## 2. Reveal wiring

- [x] 2.1 In `app.js`, route the Show-the-winner button through `tallyResults`: on `missing-votes` show "Allocate N more votes before revealing the winner." in the status line and open nothing; on `ok` populate and open the results modal
- [x] 2.2 Run `/impeccable shape` on the results modal (glass dialog, celebration burst, focus-glow accents) to lock the styling, then add the modal markup to `index.html` (scrim, `role="dialog"` `aria-modal` glass dialog, ✕ control) mirroring the clear-all modal
- [x] 2.3 Implement modal open/close: focus trap + restore to the button, ✕/Escape/backdrop close, celebration burst on open that stops on close, results recalculated on every open
- [x] 2.4 Render modal content from the tally: winner card (poster, title, year, votes, big percentage) plus summary rows (rank, thumb, title, votes, pct) sorted by votes descending

## 3. Blind-vote removals

- [x] 3.1 Delete the `.hero__winner` aside from `index.html` and all `#hero-winner-*` update logic from `render()` in `app.js`
- [x] 3.2 Delete the leader-glow class toggling in `app.js` and its styles in `styles.css`; neutralize `#board-note` copy (no ranking language)
- [x] 3.3 Re-balance the hero as a single centered panel and add results-modal styles using existing tokens; run `/impeccable polish` and `/impeccable audit` on the new hero/modal

## 4. Integration tests

- [x] 4.1 In `integration.test.js`, add a suite composing `createBoard` + `tallyResults`: add movies in known order, tally an app-shaped votes map, assert winner/rows; assert the block resolves exactly when the last vote is allocated

## 5. Verification

- [x] 5.1 `node --check` all JS; full Jest suite green (`winner.test.js`, board, imdb, gist, integration)
- [ ] 5.2 Manual browser pass: vote partially → button refuses with the missing-count message; allocate everything → modal shows winner card + percentages + summary; tie case → earliest-added wins; close/reopen works; no glow or winner panel anywhere; layout survives mobile
