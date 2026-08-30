# Per-Card Delete

## Why

Visitors can add movies one by one or in bulk, but the only removal path is "Clear all" behind a confirmation modal — one mistaken link in a TXT import forces destroying the entire board and re-adding everything. The board needs a per-card removal control, and the removal must respect the existing guarantees the board already enforces (no duplicate cards, no invalid links, vote bookkeeping, persistence).

## What Changes

- Add an "X" remove button to every movie card, styled with the impeccable design system (frosted glass square matching the Vote Button component; cyan reserved for focus per the One Light Rule).
- Add `Board.remove(id)` to the board state machine: removes exactly one movie, persists, returns success. Unknown ids are a safe no-op.
- Removing a movie deletes any votes allocated to it (reusing the existing orphan-vote pruning) and frees budget.
- A removed movie can be added again — re-submitting its link creates a fresh card instead of being rejected as a duplicate.
- No confirmation dialog for single removal (low-stakes and reversible); "Clear all" keeps its modal.
- In-flight hydration of a removed movie must not resurrect it (hydrate application already no-ops for unknown ids; add a regression test).
- Tests: new suite for remove behavior (state, persistence, re-add, hydration safety, empty state) plus regression coverage re-affirming duplicate and invalid-link rejection still hold.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shortlist-import`: Add a requirement for removing a single movie from the board via a per-card control — instant removal, votes freed, persisted, re-addable, accessible by keyboard.

## Impact

- `board.js`: new `remove(id)` method exported on the board API (state machine only, no DOM).
- `app.js`: `cardHtml` gains the X button (`data-remove` attribute, accessible name); one new delegated click listener on the grid mirroring the vote-button pattern; delete handler calls `remove` → orphan-vote pruning → save → render; focus management after removal.
- `styles.css`: one new `.menu__remove` component following `.impeccable/design.json` tokens (glass-fill, glass-border, Sora, ease-out-quint, focus-visible accent ring).
- `board.test.js`, `integration.test.js`: new remove/re-add/hydration-safety tests; existing duplicate and invalid-link tests must keep passing unchanged.
- `index.html`: no change (the button is rendered per card by `cardHtml`).
- No backend, no storage migration; `shortlistBoard.v1` and `movieVotes.v1` shapes unchanged.
