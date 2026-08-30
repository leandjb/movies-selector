## Why

The hero currently carries a permanent "now winning" glass panel that spoils the vote before movie night even starts, and the existing Show-the-winner action is an ambient highlight rather than an event. The host wants voting to be blind — no live winner signals anywhere — and the winner to be revealed deliberately, as a moment: one button press that tallies every card and presents the result in a modal with percentages and a votes summary. The reveal must refuse to run while votes are still unallocated, so a half-voted board can never crown a premature winner.

## What Changes

- Remove the `winner.glass` panel (the "now winning" poster aside) from the top of the landing page.
- Remove all live winner marking: no leader glow, no "ranked" announcements that hint at the leader. Voting is fully blind; vote counters on each card remain visible, but nothing aggregates them on screen.
- Repurpose the Show-the-winner button to open a **results modal**: the winning movie card (poster, title, year) with its winning percentage, plus a per-movie votes summary (each movie with its vote count and share). Celebration animation moves inside the modal. The modal, its celebration, and the remaining glow accents are styled through the Impeccable workflow so the glass/motion language stays consistent with the rest of the page.
- Block the reveal: if any vote budget is unallocated, the button MUST NOT compute or show a winner — it shows an error message stating how many votes are still missing. Also blocked (disabled) while the board is empty.
- Winner determination is deterministic: most allocated votes wins; ties go to the movie added first.
- Add unit and integration tests for the tally (percentages, tie-break, missing-votes block, empty-board block) and keep the Jest suite green.
- Note: this change builds on `gist-import-ui-redesign` (stable grid order, sectioned controls) and should be implemented and archived after it.

## Capabilities

### New Capabilities

<!-- none — all behavior lands in existing capabilities -->

### Modified Capabilities

- `voting`: remove "Winner is highlighted" (no live leader marking — blind voting) and "Winner celebration button" (replaced by an on-demand reveal); add "Winner is revealed on demand" (button → results modal with percentage + votes summary; blocked while any votes are unallocated).
- `shortlist-import`: modify "Empty board state" — the winner display placeholder no longer exists (panel removed); the show-winner control stays disabled on an empty board.

## Impact

- `index.html`: delete the `.hero__winner` aside (poster well, "now winning" label, `#hero-winner-*` nodes); hero becomes a single centered panel; add the results-modal markup (mirroring the clear-all modal's dialog/scrim/focus pattern); script tag for the new `winner.js`.
- `styles.css`: delete `.hero__winner*` and leader-glow styles; add results-modal styles; hero re-balance.
- New `winner.js` (UMD like `board.js`/`imdb.js`): pure `tallyResults(movies, votesById, budget)` returning either `{ ok, winnerId, total, rows }` (each row: id, title, year, votes, pct) or `{ ok: false, reason, remaining }`; plus `winner.test.js`.
- `app.js`: button handler routes through `tallyResults` (blocked → feedback message with the missing-votes count; ok → populate and open the modal); delete hero-winner DOM updates and leader-glow logic.
- `board.test.js` / `integration.test.js`: extend for tally outcomes via the new module; existing suite stays green.
- No backend, no new dependencies; persistence untouched.
