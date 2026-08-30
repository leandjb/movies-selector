# Per-Card Delete — Design

## Context

`board.js` is a DOM-free state machine (`addFromText`, `hydrate`, `clear`, `hasId`, …) persisted under `shortlistBoard.v1`; it has no single-movie removal today — only `clear()`. `app.js` renders cards through `cardHtml()` into `#movie-grid` and binds card buttons via one delegated click listener (`[data-vote]`), so a remove button can follow the same pattern without per-card listeners. Vote state (`movieVotes.v1`, `state.byId`) already has an orphan-pruning helper (`pruneOrphanVotes`) used by boot and clear-all. `board.hydrate` returns `false` for unknown ids and `hydrateCard` early-returns when the movie is gone, so an in-flight fetch for a deleted movie cannot resurrect state or DOM. The design system (`.impeccable/design.json`) defines the Vote Button component (2.5rem frosted square, glass fill/border, Sora, `ease-out-quint`) and the One Light Rule (cyan only for live decisions, focus, CTA).

## Goals / Non-Goals

**Goals:**
- Remove exactly one movie with one interaction, keeping every other card, rank number, and vote untouched.
- Keep votes, persistence, cap logic, and the 9-counter consistent after removal with zero special-case code in `render()`.
- Make the control accessible (named per movie, keyboard operable, sensible focus target after removal).
- Lock the re-add-after-delete and hydration-safety behaviors in tests, alongside the existing duplicate/invalid-link guarantees.

**Non-Goals:**
- No confirmation dialog for single removal (reversible by re-adding; "Clear all" keeps its modal).
- No undo/tombstone UI, no toast, no animation beyond the existing render.
- No changes to the clear-all modal, voting math, cap enforcement, or the fetch pipeline (rate-limit resilience is `resilient-metadata-fetch`'s scope).

## Decisions

- **D1 — `Board.remove(id)` in the state machine.** Removes the movie from the list, calls `save()`, returns `true`; unknown id returns `false` without saving. Alternative considered: app-side list surgery — rejected: board contents must only change through `board.js` or persistence guarantees drift.
- **D2 — Button in `cardHtml`, delegated handler.** Each card gets `<button type="button" class="menu__remove" data-remove="{id}" aria-label="Remove {title or id}">×`. The grid listener grows a `[data-remove]` branch mirroring `[data-vote]`: `board.remove(id)` → `pruneOrphanVotes()` → `saveState()` → `render()`. Alternative considered: per-card listeners — rejected: `render()` rebuilds all card HTML, so delegation is the established pattern.
- **D3 — Style mirrors the Vote Button component.** 2.5rem frosted square (`glass-fill`, 1px `glass-border`, 12px radius, Sora), text `--text`, hover raises border tint, `:focus-visible` accent ring in electric cyan (focus is a live decision per the One Light Rule), all transitions `ease-out-quint`, positioned top-right of the pane, above poster z-order, with a scrim so it stays ≥4.5:1 over any poster.
- **D4 — Focus after removal.** `render()` accepts an optional focus target: focus the next card's remove button, falling back to the previous card, else the paste input when the board is empty. Keeps keyboard users anchored instead of dumping them to `<body>`.
- **D5 — Hydration safety is asserted, not re-engineered.** `hydrate` on a removed id is a state no-op (`false`) and `hydrateCard` early-returns; a board-level test pins this ("no resurrection") so future refactors can't regress it.
- **D6 — Persistence.** `remove()` persists via the existing `save()` (empty list is written as `[]`; `load()` already accepts it). No migration; `clear()` semantics untouched.

## Risks / Trade-offs

- [Accidental tap deletes a card with no dialog] → Deliberate trade-off: removal is one paste to undo; adding a modal per delete would make bulk curation tedious. The 2.5rem target and top-right placement keep it out of poster-tap paths.
- [Focus management after full re-render is fiddly] → Implemented via the existing `render({ focusMovieId })` option pattern, so it reuses the vote-button focusing mechanism already in the code.
- [Deleted movie's in-flight fetch resolves later] → Pinned by the D5 test; `hydrate`/`hydrateCard` both no-op for unknown ids.
- [Rank numbers and winner chip shift after removal] → Desired behavior; `render()` already recomputes rank/winner from the list, verified by existing render logic plus a new test asserting the leader changes when the winner is removed.

## Migration Plan

Single static-site change; storage shapes unchanged, no migration. Rollback = restore previous `board.js`/`app.js`/`styles.css`; localStorage remains compatible both ways.

## Open Questions

None.
