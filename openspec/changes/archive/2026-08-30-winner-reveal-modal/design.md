## Context

The page currently leaks the leader three ways at all times: the `.hero__winner.glass` aside ("now winning" + poster), the leader's card glow, and the Show-the-winner celebration that rides on top of that ambient marking. The host wants blind voting with a deliberate reveal moment that refuses to run early. The reveal needs a hard precondition — every vote allocated — and a deterministic result, which today exists nowhere as testable logic: winner selection is scattered through `app.js` render code tied to DOM nodes that are about to be deleted.

## Goals / Non-Goals

**Goals:**
- Blind voting: zero live winner signals on the page.
- One reveal action → modal with the winning card, its percentage, and a full votes summary.
- Hard block while any budget is unallocated, with a message saying how many votes are missing.
- Deterministic winner (most votes; ties → earliest added), consistent with `gist-import-ui-redesign`.
- Tally logic extracted into a pure, unit-tested module.

**Non-Goals:**
- No change to vote allocation mechanics, budget stepper, persistence, or the 9-cap board.
- No per-card percentage labels during voting (that would re-leak the leader).
- No history/audit of past reveals.
- No new dependencies or backend.

## Decisions

### 1. New `winner.js` UMD module with a pure `tallyResults`

`window.Winner.tallyResults(movies, votesById, budget)` where `movies` is `board.list()` (insertion order), `votesById` is the app's `movieVotes.v1` map, `budget` the configured budget:

```js
{ ok: true,  total, winnerId, rows: [{ id, title, year, posterUrl, votes, pct }] }
{ ok: false, reason: "missing-votes", remaining }   // budget - allocated > 0
{ ok: false, reason: "empty-board" }                // movies.length === 0
```

- `pct` per row = `Math.round(votes / total * 100)`; rows sorted by votes descending inside the modal only (grid untouched). Rounding may make rows sum to 99/101 — accepted for integer display.
- Winner = first row in insertion order among the max-vote movies (ties → earliest added).
- Zero-vote movies still appear in the summary at 0%.

**Rationale:** pure function → every acceptance rule (percentages, tie, block) is a Jest case without a browser. Putting it in `board.js` was rejected: votes live app-side (`movieVotes.v1`), and `board.js` should not grow a second concern.

### 2. Block rule — enabled control, refused action

Button stays enabled whenever the board is non-empty (disabled only when empty, as specced). On click with `ok: false`, no modal opens; the existing status line (aria-live) reads "Allocate N more votes before revealing the winner." Clicking through the error repeatedly is harmless and keeps the block testable as a message, not a mystery-disabled button.

### 3. Results modal mirrors the clear-all modal

Same pattern as `#clear-modal`: fixed scrim + `role="dialog"` `aria-modal` glass dialog, focus trapped on open, restored to the button on close, ✕ / Escape / backdrop all close. Content: winner card (poster, title, year, vote count, big `pct`), celebration burst on open, then the summary rows (rank, poster thumb, title, votes, `pct`). Closing clears the celebration (animation tied to open state). Reopening re-runs `tallyResults` — always fresh. Styling follows Decision 6 (Impeccable-driven consistency).

### 4. Blind-vote removals in `app.js` / `styles.css` / `index.html`

Delete: the `.hero__winner` aside; `#hero-winner-*` update logic in `render()`; leader-glow class toggling and its CSS; ranking copy in `#board-note` (neutral wording, e.g. "Vote with your budget."). Hero re-balances to a single centered panel via the Impeccable polish pass — no new palette, existing tokens only.

### 5. Tests

- `winner.test.js`: full-allocation happy path (exact `pct` values), tie → earliest-added winner, `missing-votes` with correct `remaining`, empty board, zero-vote rows included at 0%, unallocated-then-completed transitions.
- `integration.test.js`: `tallyResults` composed with a real `createBoard` — add movies in a known order, hydrate, tally a votes map shaped like `app.js`'s, assert winner and rows; assert the block flips to `ok` exactly when the last vote is allocated.
- Modal interactions (open/close/focus/celebration) verified manually in the browser pass, consistent with the repo's app.js-is-an-IIFE testing boundary.

### 6. Impeccable-driven styling consistency

The results modal and its celebration MUST be styled through the Impeccable skill so the reveal reads as part of the existing design language, not a bolt-on: same `.glass` recipe (translucent fill, backdrop blur, hairline border, top-edge highlight), the cyan `--accent` glow reserved for the winner moment and `:focus-visible` states, and motion reusing the site's `--ease` curve and durations for the modal entrance and celebration burst. `/impeccable shape` runs on the modal + celebration before markup; `/impeccable polish` and `/impeccable audit` close the change. No new palette, no new easing tokens. This covers the glow/animation accents that remain after the blind-vote removals — it does not reintroduce live leader glows, which stay deleted.

## Risks / Trade-offs

- [Blind voting hides momentum that some groups enjoy] → Deliberate host request; the per-card counters are still visible, only aggregation is hidden.
- [Percentage rounding shows 99%/101% totals] → Accepted; integers read better than decimals on a party screen.
- [Button click with missing votes does nothing visible if the status line is missed] → Status line is `aria-live="polite"` and the message names the exact number missing.
- [`gist-import-ui-redesign` not yet implemented] → This change builds on its stable-order/sectioned layout; implement and archive it first. Deltas here are written against its end state (e.g. "Winner is highlighted" as its MODIFIED text defines it, then removed here).
