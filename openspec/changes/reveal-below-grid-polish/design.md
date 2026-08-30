## Context

`index.html` renders the reveal control inside the Vote-budget panel (`.ctl` for `ctl-budget-title`), directly under the budget stepper. The board section ends with `#movie-grid`; the footer follows `<main>`. The DOM test harness (`tests/helpers/app-harness.js`) extracts `<body>` from the real `index.html` and runs the real `app.js`, so markup moves are absorbed by the suite as long as ids stay stable. `app.js` grabs `#show-winner` by id and toggles `.disabled` in `render()` — nothing about its position. The badge under test is rendered by `cardHtml()` as `<span class="badge badge--imdb">{scoreOrDash(movie.rating)}</span>` and updated in place by `hydrateCard()` after hydration. The suggestion-first provider carries no rating (renders `—`); the rating only arrives through the JSON-LD page fallback when the suggestion provider fails.

## Goals / Non-Goals

**Goals:**
- Reveal button lives in its own centered section below the grid, above the footer.
- Badge correctness pinned by tests (rating when provided, `—` when not, per movie).
- Footer credit line linking `https://github.com/leandjb`.
- Zero `app.js` changes; existing 112 tests stay green.

**Non-Goals:**
- No purple theme / symmetry / halo work — that stays in `purple-glass-reskin` (its relocation task gets trimmed later).
- No pipeline change to fetch ratings in the happy path (decided: test-only).
- No changes to reveal gating, modal behavior, or storage.

## Decisions

### 1. Relocation mechanics (markup-only move)

Cut the `<button class="board__show-winner" id="show-winner">…</button>` element out of the budget `.ctl__body` and paste it — unchanged — inside a new section placed immediately after the `<ol id="movie-grid">` closing tag, still inside `<section class="board">`:

```html
<ol id="movie-grid" class="menu" aria-label="Movie shortlist"></ol>

<section class="reveal glass" aria-label="Reveal the winner">
  <button class="board__show-winner" id="show-winner" type="button">
    <span aria-hidden="true">🎉</span> Show the winner
  </button>
</section>
```

- Same `id`, same class → `app.js` binding, `render()`'s disabled toggling, the modal focus-return (`revealFocusReturn`), and every existing modals/fixture test keep working untouched.
- `aria-label="Reveal the winner"` on the section (no heading needed — the button is self-describing; adding a kicker heading would duplicate the button text).

**Rationale:** the cheapest correct move; the harness re-reads the real markup so the suite validates the new structure for free.

### 2. `.reveal` styling (current theme, no reskin)

Keep the shipped cyan/glass tokens — do **not** pre-apply any purple work:

```css
.reveal {
  margin-top: 1.6rem;
  padding: 1.2rem;
  border-radius: 18px;
  display: flex;
  justify-content: center;
}
```

(`.glass` supplies fill/blur/border/shadow; radius 18px matches `.board__head`/`.ctl`.) The button keeps its existing `.board__show-winner` pill styles. Mobile: the section is full-width within `.board`'s padding; the button stays centered, existing ≤640px rules for `.board__show-winner` continue to apply.

### 3. Badge tests assert per-movie correctness through the real pipeline

Two tests in `cards.test.js` using the existing harness routes — no new harness helpers:

- **Rating shown when metadata provides it:** route the suggestion provider to 404 for `tt0111161` and serve the JSON-LD fallback with `rating: 8.4` → after add + hydration, that card's `.badge--imdb` reads `8.4` (exactly, not `8.40`/`"8.4 "`), while a second movie hydrated without a rating still reads `—`. This proves the badge binds the **correct per-movie** score.
- **Placeholder when no rating:** suggestion-success route (no rating in payload) → badge reads `—` exactly.

(An equivalent happy-path assertion already exists for `—`; the new pairing pins both branches side by side so a regression that bleeds one movie's score into another fails loudly.)

### 4. Footer credit (static, accessible)

Inside `.site-foot__inner`, append a second line below the existing `<p>`:

```html
<p class="site-foot__credit">
  Developed with passion by
  <a href="https://github.com/leandjb" target="_blank" rel="noopener noreferrer">leandjb</a>
</p>
```

CSS: `.site-foot__credit { margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-muted); }` with the link in `var(--accent)` (hover → `var(--accent-deep)`), matching the footer's muted tone. `rel="noopener noreferrer"` because it opens in a new tab. Fixture test gains: the footer contains an anchor to `https://github.com/leandjb`.

## Risks / Trade-offs

- [Visual regression if `.reveal` spacing collides with the board's bottom padding] → `.board` already carries `padding-bottom: 4rem`; `.reveal`'s `margin-top: 1.6rem` matches the existing section rhythm; manual browser pass confirms.
- [Harness re-reads markup → any accidental id loss breaks the suite loudly] → intended; `fixture.test.js` is the guard.
- [Badge tests depend on route-table specifics (404 suggestion → JSON-LD)] → reuses the exact routes proven in `pipeline.integration.test.js`; no new mocking surface.
- [purple-glass-reskin still lists the relocation in task 2.1] → flagged in the proposal as a follow-up trim; applying both unchanged would move the button twice (second move is a no-op if the section already exists — but the reskin's markup edit would conflict), so trim before applying the reskin.
