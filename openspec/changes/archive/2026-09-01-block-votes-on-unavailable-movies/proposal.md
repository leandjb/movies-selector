## Why

When a card's IMDb hydration fails (timeout / exhausted proxy chain), the card degrades to an "Unavailable" card (status `error`) — but its vote buttons still render and still work, so votes can be allocated to a movie nobody could confirm exists, and the winner tally counts them. An Unavailable card can literally win movie night. Loading cards have the same hole while hydration is in flight. This is both a code bug and a gap in the `voting` spec, which never says anything about non-ready cards.

## What Changes

- **Vote gating**: vote controls are disabled on every card whose details are not loaded (`loading` or `error` status); the counter stays visible. Only `ready` cards are votable. `addVote`/`removeVote` gain a status guard so the rule holds even against stale-DOM or programmatic clicks, not just the disabled attribute.
- **Vote stripping**: when a card transitions to `error`, its allocated votes are freed back to the budget (mirrors `pruneOrphanVotes`). At boot, persisted votes attached to a non-ready card (legacy data from before this rule) are stripped before the first render. Votes freed this way are never restored automatically if the card later loads.
- **Tally exclusion**: the winner tally includes only cards with loaded details; `loading`/`error` movies can neither win nor appear in the results rows, and percentages are computed over votable movies only. The missing-votes gate still counts the full budget (stripped votes are genuinely unallocated and re-allocatable).
- **Reveal UX**: activating the reveal when no movie on the board has loaded details reports a distinct message (not the missing-votes deadlock toast, not the empty-board toast).
- **Related rendering bugs fixed** (surfaced by the exploration): `hydrateCard`'s in-place update path never touches the vote cluster, so votability and counters go stale across `error → ready` retries and after a strip; the mid-session strip leaves the navbar pill/progress frozen unless the topbar is re-rendered; focus silently drops to the page body when the focused vote button becomes disabled.
- **Non-goals**: no change to hydration itself (retry, timeout, proxy behavior), no change to import/board rules, no per-movie vote cap, no visual redesign of cards.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `voting`: new requirement — only movies with loaded details are votable (controls disabled on `loading`/`error` cards, counter remains visible, retried cards become votable again); new requirement — votes are freed when a movie cannot be tallied (strip on error transition, legacy persisted votes discarded before first render, no automatic restore); modified "Winner is revealed on demand" requirement — tally covers loaded movies only, excluded movies neither win nor appear in rows, and a zero-votable-board reveal reports a distinct message.

## Impact

- `src/app.js`: `cardHtml` (gate `canInc`/`canDec` on status), `addVote`/`removeVote` (status guard), `hydrateCard` (sync vote cluster in place), new strip helper wired into boot and the hydration-failure path, reveal click handler (new toast branch), focus fallback after render.
- `src/winner.js`: `tallyResults` filters out `loading`/`error` movies and reports a new `no-votable-movies` reason.
- `styles.css`: no new styles expected — native `disabled` vote buttons are already styled (`.vote__btn:disabled`). If any styling tweak proves necessary, it follows the Impeccable design system (`DESIGN.md` / `.impeccable/design.json`) and passes `pnpm impeccable detect`.
- Tests: `tests/unit/winner.test.js`, `tests/ui/cards.test.js`, `tests/ui/sections.test.js`, `tests/ui/modals.test.js`, `tests/integration/pipeline.integration.test.js` (and/or a new gating-focused UI test file); a new seeded-non-ready-storage test pattern.
- Persisted state: no migration — `movieVotes.v1` and `shortlistBoard.v1` payloads are unchanged; stale legacy votes on non-ready cards are cleaned at boot by the strip step.
- No collision with the in-flight `square-glass-refinement` change (its only remaining task is a CSS gradient tweak).
