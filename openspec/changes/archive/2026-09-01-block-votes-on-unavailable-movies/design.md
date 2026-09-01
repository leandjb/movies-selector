## Context

The app is a vanilla-JS static page. Board state lives in `board.js` (statuses `loading | ready | error`, persisted under `shortlistBoard.v1`); vote state lives in `app.js` (`movieVotes.v1`: `{ budget, byId }`); the tally lives in `winner.js`. See proposal.md for the motivation.

Facts that shape the approach (from code exploration):

- `cardHtml` (src/app.js:145-152) computes `canInc = remaining() > 0` and `canDec = votes > 0` — neither consults `movie.status`; the vote cluster renders for every card.
- `addVote`/`removeVote` (src/app.js:600-615) have no status guard; the grid click handler delegates straight to them (src/app.js:630-641).
- `Winner.tallyResults` (src/winner.js:29-42) builds rows from every movie and gates reveal only on the empty board and the missing-votes budget check.
- `hydrateCard` (src/app.js:294-310) updates a card in place after hydration (poster, title, year) but never touches the vote cluster; it exists to avoid a full `render()`, whose `grid.innerHTML` reset replays the `card-in` entrance animation on every card unless `body.has-voted` is set (styles.css:869-883) — and the module-level `voted` flag (src/app.js:16) is false until the visitor's first vote of the session.
- `needsHydration` (src/board.js:158-162) returns **both** `loading` and `error` movies, and boot re-enqueues hydration for them (src/app.js:805-813) — so an error card can become ready on a later page load. Transitions are a loop, not a one-way street.
- `renderTopbar` (src/app.js:270-290) is the only writer of the missing-votes pill and budget progress and is called only from `render()`.
- `normalizeMovie` (src/board.js:24-43) infers `ready` from any present field when the persisted status is missing/unknown.
- `board.hydrate(id, details)` marks `ready` when any single field landed (src/board.js:126-129).

## Goals / Non-Goals

**Goals:**

- Make votability track card status through **both** render paths (full `render()` and in-place `hydrateCard`).
- Enforce the no-vote rule at the state layer, not only the attribute layer.
- Free stranded votes (mid-session failure, legacy persisted votes at boot) with the navbar reflecting it immediately.
- Keep the tally honest: only loaded movies tally, win, or appear in rows.

**Non-Goals:**

- Any change to hydration transport (timeout, retry, proxies, queue) or to import/board capacity rules.
- Per-movie vote caps, vote restoration on retry, or a new visual design of cards.
- Data migration: no persisted-payload shape changes.

## Decisions

**D1 — Votability predicate: exclude `loading`/`error`, don't require `ready`.**
A single helper `isVotable(movie)` returns `movie.status !== "loading" && movie.status !== "error"`. Rationale: `normalizeMovie` infers `ready` loosely for legacy rows without an explicit status (src/board.js:26-34), and the existing winner unit-test helpers build movies with no `status` field — requiring literal `ready` would break both for no behavioral gain. Excluding the two known-bad statuses is the honest contract. Alternatives considered: strict `status === "ready"` (breaks legacy data + tests), adding a `votable` flag to the board model (duplicates derived state).

**D2 — Enforcement in two layers.**
Layer 1 (presentation): `cardHtml` gates both buttons — `canInc = isVotable(m) && remaining() > 0`, `canDec = isVotable(m) && votes > 0` — using the native `disabled` attribute (existing `.vote__btn:disabled` styles already cover it; native disabled also keeps buttons out of the existing `button:not([disabled])` focus-trap queries). Layer 2 (enforcement): `addVote`/`removeVote` look the movie up on the board and return early when `!isVotable(m)`. Rationale: `dispatchEvent(click)` bypasses `disabled` in tests and stale DOM can outlive a status change in the wild; the state guard is the real rule, the attribute is the affordance. Alternative considered: `aria-disabled` + click interception — rejected (keeps buttons in tab order, needs new CSS, still requires the guard).

**D3 — Strip helper and its call sites.**
New `stripUnvotableVotes()` in `app.js`: deletes every `state.byId[id]` whose board movie is not votable, returns whether anything was removed. Call sites:
1. Boot, pinned order: `board.load()` → `pruneOrphanVotes()` → `stripUnvotableVotes()` → `saveState()` → `render()`. The strip must finish before the first `render()` so no user ever sees votable non-ready cards or a counter jump (spec: "before first paint").
2. The hydration-rejection handler (src/app.js:376-380): `board.hydrate(id, null)` → strip → `hydrateCard(id)` (D4 handles the in-place UI) → `renderTopbar()` so the pill unfreezes → info toast "Votes returned — <title> didn't load." Silent at boot (the user never saw those votes this session; the pill already reflects them).
The shape deliberately mirrors `pruneOrphanVotes` (src/app.js:58-62), the established "votes are freed when their movie goes away" precedent. A strip only ever reduces `totalAllocated`, so `trimExcess` never needs to run afterwards. Alternative considered: stripping inside `board.js` — rejected, the board state machine doesn't know votes.

**D4 — Extend `hydrateCard` to sync the vote cluster in place.**
`hydrateCard` gains: set/clear `disabled` on the card's vote buttons per the votable predicate, rewrite `.vote__score` text, recompute the card's counter arc `stroke-dasharray`, and (when allocation changed) call `renderTopbar()`. Extract the vote-cluster markup so `cardHtml` and `hydrateCard` share one source. Rationale: a full `render()` here would replay the `card-in` animation on all cards exactly in the pre-first-vote window when boot retries resolve (the `voted` flag is false then); the in-place path is why `hydrateCard` exists. Known accepted staleness: other cards' decorative arc shares can go stale if the stripped card held `maxAllocated()` — arcs are `aria-hidden` decoration and self-correct on the next full render (D7). Also remove the dead `menu__card--loading` class removal (src/app.js:309) while touching the function — nothing adds it and no CSS defines it.

**D5 — Tally: filter first, then gate.**
`tallyResults` drops movies whose status is `loading` or `error` (D1 predicate) before building rows; the empty check then fires on the filtered list; a new early return `{ ok: false, reason: "no-votable-movies" }` is checked before the missing-votes gate so a board of 9 unavailable movies yields a truthful toast ("None of tonight's movies loaded — nothing to reveal yet.") instead of the deadlock message "Allocate N more votes…" with all buttons disabled or "Add some movies to the board first." with 9 cards on screen. The missing-votes gate keeps comparing the ready-only total against the **full** budget — stripped votes are genuinely unallocated, the pill already shows them as missing, and every ready card can absorb the whole budget (no per-movie cap), so redistribution is always possible. Percentages compute over the filtered total only. `showWinnerBtn` stays enabled whenever the board is non-empty; the click toast is the teacher (disabling it would hide the affordance with no explanation).

**D6 — Focus never lost to the body.**
After `render({ focusMovieId, focusDirection })` resolves its target: if the target vote button is disabled, focus falls back to the same card's remove button (never disabled, keyboard-reachable); same fallback inside `hydrateCard` when it disables the currently focused vote button. Rationale: a focused button that gains `disabled` drops focus to `body`, stranding keyboard/D-pad users — and D3/D4 make that reachable (strip + in-place update).

**D7 — Arc-share staleness accepted.**
Only the stripped card's own counter must update immediately (spec). Re-syncing every card's share arc in place would be possible without a full render but is decoration polish on an `aria-hidden` element; skip it.

**D8 — CSS: no changes expected; Impeccable if forced.**
Native `disabled` vote buttons are already styled (styles.css:755-763). If implementation surfaces any styling need, it MUST go through the Impeccable design system — reuse `DESIGN.md` / `.impeccable/design.json` tokens, no new palette or easing, and `pnpm impeccable detect` must stay at zero unexplained findings (per the project's standing convention and the standing baseline ignores).

## Risks / Trade-offs

- [Disabled attribute bypassed by programmatic clicks / stale DOM] → D2's state-layer guard is the enforcement; tests cover both layers (attribute + a dispatchEvent click asserting no state change).
- [`normalizeMovie` loose inference can boot a legacy field-bearing row as `ready`] → accepted: a card with real data is genuinely usable; the D1 predicate keys off the two bad statuses only. Pinned by a unit test with a status-less movie row.
- [Strip + in-place update can strand focus] → D6 fallback; covered by a test asserting focus lands on the card's remove button.
- [`hydrateCard` regression would silently re-break votability on the retry path] → tests drive the real fetch router (`statusRoute` failure → `flushHydration` → success retry) through `tests/helpers/app-harness.js`, asserting buttons re-enable.
- [`trimExcess` reduce throws on an empty board with corrupt state] → out of scope but cheap hardening while nearby; optional task, must not expand behavior.
- [Existing winner tests build movies without `status`] → D1's exclude-semantics keeps them green; a dedicated test pins the semantics.

## Migration Plan

No payload migration: `shortlistBoard.v1` and `movieVotes.v1` shapes are unchanged. Deploy is a plain static-file swap; the boot strip (D3) cleans any legacy votes on non-ready cards on first load. Rollback is a plain revert — re-introduced votes on error cards are the pre-change state quo.

## Open Questions

None — all decisions were settled during exploration with the user (block on `loading`+`error`; strip on transition; exclude from tally; distinct no-votable toast; native `disabled`; remove-button focus fallback; never restore stripped votes; arc staleness accepted).
