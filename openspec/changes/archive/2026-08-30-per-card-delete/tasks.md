## 1. Board state machine (board.js)

- [x] 1.1 Add `remove(id)` to `createBoard`: deletes the matching movie, `save()`s, returns `true`; unknown id returns `false` without saving; export it on the returned API. Verify: `node --check board.js`.
- [x] 1.2 Add board tests: remove deletes only that movie and persists (fresh board sees it gone); unknown id is a no-op returning `false`; re-adding a removed movie via `addFromText` succeeds (not a duplicate); `hydrate` on a removed id returns `false` and never resurrects the movie; removing the last movie leaves `count() === 0`. Verify: `node --experimental-vm-modules node_modules/jest/bin/jest.js board.test.js`.

## 2. Card UI (app.js + styles.css)

- [x] 2.1 Add the X button to `cardHtml`: `type="button"`, `class="menu__remove"`, `data-remove="{id}"`, `aria-label="Remove {title or id}"`, `×` glyph in an `aria-hidden` span. Verify: rendered HTML in a quick manual render check.
- [x] 2.2 Extend the grid delegated click listener with a `[data-remove]` branch: `board.remove(id)` → `pruneOrphanVotes()` → `saveState()` → `render({ focusMovieId: nextId })` targeting the next (or previous) card's remove button, else the paste input when the board is empty (design D4). Verify: integration test simulating the click flow at the state level.
- [x] 2.3 Add `.menu__remove` to `styles.css` per `.impeccable/design.json`: 2.5rem frosted square (glass-fill, glass-border, 12px radius, Sora), top-right of the pane with a scrim for ≥4.5:1 contrast over posters, hover border tint, `:focus-visible` cyan ring, transitions on `ease-out-quint` (design D3). Verify: visual check over a light and a dark poster.
- [x] 2.4 Confirm no special cases needed elsewhere: rank renumbering, winner chip, 9-counter, adder re-enable after removal, and the empty state all come from the existing `render()` recomputation. Verify: existing suite green unchanged.

## 3. Integration tests and regression coverage

- [x] 3.1 Add integration test: add two movies, allocate votes (state-level), remove one → its votes pruned, other intact; re-add the removed movie → new card accepted; remove all → empty state conditions (`count() === 0`, clear/show-winner would be disabled). Verify: jest passes.
- [x] 3.2 Regression re-affirmation of validation guarantees: existing duplicate tests (in-input and on-board) and invalid-link tests (bare tt-IDs, non-links, foreign domains) pass unmodified after the feature lands. Verify: full suite run in 3.3.
- [x] 3.3 Full verification: `node --check board.js app.js && node --experimental-vm-modules node_modules/jest/bin/jest.js` (0 failures), `openspec validate per-card-delete --strict`, and a manual browser pass: X removes only its card, votes freed (budget remaining increases), reload keeps it removed, re-add works, Tab reaches the X with a visible cyan focus ring and Enter deletes, focus lands on the next card's X (or the paste input when empty), and duplicate/invalid paste messages still behave.
