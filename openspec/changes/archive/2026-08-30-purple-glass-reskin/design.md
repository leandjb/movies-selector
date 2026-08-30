## Context

The app is a dark glassmorphism page with a single cyan accent. The control area is a 2×2 grid of unequal panels; the reveal button lives inside the Vote budget panel; the results modal (winner-reveal-modal) carries the cyan winner glow. The impeccable detector flags 15 anti-patterns — 12+ are chromatic halos (`text-shadow` / zero-offset colored `box-shadow`), the rest are the pinned glass recipe (border + wide shadow) and hero copy. `pnpm impeccable` works (skills v4.1.1 installed in `.agents/skills/impeccable`); `DESIGN.md` holds the token system (type ramp, radius scale, colors) the detector checks against.

## Goals / Non-Goals

**Goals:**
- Three symmetric, equal control panels; status as a slim full-width bar.
- The reveal button as a centered bottom section below the grid.
- Purple single-accent theme, purple-tinted glass.
- Zero chromatic halos — `dark-glow` detector findings 15 → 0.
- DESIGN.md updated so the detector's design-system checks pass against the new tokens.

**Non-Goals:**
- No behavior changes: voting, reveal gating, gist import, board rules, hydration all untouched.
- No type-ramp or radius-scale changes (existing steps reused).
- No new fonts, no layout framework — CSS tokens + grid only.
- Not touching the glass recipe itself (border + soft neutral shadow stays; only the *color* of shadows changes).

## Decisions

### 1. Symmetric control layout

```
┌──────────────────────────────────────────────────────────────┐
│  HERO (single centered panel, unchanged)                     │
├──────────────────┬──────────────────┬────────────────────────┤
│  VOTE BUDGET     │  ADD BY LINK     │  IMPORT                │
│  (equal third)   │  (equal third)   │  (equal third)         │
├──────────────────┴──────────────────┴────────────────────────┤
│  STATUS — feedback · count · Clear all   (full-width bar)    │
├──────────────────────────────────────────────────────────────┤
│  BOARD HEAD (title · note)                                   │
│  MOVIE GRID                                                  │
├──────────────────────────────────────────────────────────────┤
│  ✦ SHOW THE WINNER   (centered, bottom of the landing page)  │
└──────────────────────────────────────────────────────────────┘
```

- `.controls` becomes `grid-template-columns: repeat(3, 1fr)` with `align-items: stretch` so all three panels match height; the status section moves out of the grid into a full-width `.ctl--bar` (same glass, slimmer padding, single wrapping row).
- Panels keep their kickers; each keeps exactly one primary action (Add / Import gist) — budget panel's primary is the stepper itself.
- Mobile (≤1020px): three panels stack; status bar stays full-width; reveal section keeps its padding.
- The reveal button moves after `#movie-grid` as `<section class="reveal glass">` — one centered button, generous padding; same id/handler, so `app.js` needs no logic change.

**Rationale:** the three setup jobs are peers — equal weight reads symmetric; status is state, not a peer, so it becomes a bar; the reveal is the finale and now sits where the eye lands last.

### 2. Purple token swap (single accent, tokens only)

`:root` changes (type ramp, radius scale, spacing untouched):

```
--accent:      #a78bfa   (violet-400 — the one accent)
--accent-deep: #7c5cf0
--accent-ink:  #231a45   (dark ink for on-accent text, ≥7:1 on accent)
--glass-fill/-strong: white overlays dropped to ~0.05/0.08 with a violet
              cast via background layers, e.g. rgba(167,139,250,0.05)
--glass-border: rgba(196,181,253,0.16)
--glass-hi:    rgba(196,181,253,0.12)
--accent-glow: DELETED (halo token removed, not recolored)
--shadow / --shadow-lift: stay neutral (black-based) — unchanged
```

Every `#3ee1ff`/`rgba(62,225,255,…)` literal in styles.css and favicon.svg migrates to the purple family; the hero's indigo ambient blob (`rgba(99,102,241,…)`) already harmonizes and stays.

### 3. Halo removal inventory (the actual slop signatures)

Delete, not recolor: `.budget__value` text-shadow; `.brand__mark` glow; CTA/add/show-winner/winner-pct box-shadow halos; `.winner-hero` outer glow ring; `.gist__btn`/`.menu__remove` focus glow shadows (focus keeps the solid 3px `:focus-visible` outline, which is not a halo); `--accent-glow` token. Hover states shift to border-color + neutral `--shadow-lift` + small `translateY`, no color bloom. Elevation = neutral black shadows only.

**Rationale:** "no halos" is absolute — recoloring them purple would keep the detector failing and the slop signature; solid outline focus + neutral elevation is the modern-dark look the host asked for.

### 4. Impeccable via pnpm

`pnpm impeccable detect` before/after; the shape brief covers the three-panel symmetry + bottom reveal before markup; `/impeccable`-skill polish + audit after (focus order, contrast of purple-on-dark ≥4.5:1 for text, responsive stacking); `DESIGN.md` colors/component section updated to the purple tokens so `design-system-*` detector rules validate against reality.

## Risks / Trade-offs

- [Purple accent weakens "cyan = winner" association built in the reveal modal] → The accent swap is global and simultaneous; the winner moment keeps its glow-free emphasis via the bordered hero card + big pct.
- [Equal thirds squeeze the Import row on mid-size screens] → Grid drops to 1 column ≤1020px (same breakpoint as today); Import row already wraps internally.
- [Focus visibility without glow] → Solid 3px accent outline at 3px offset (existing global rule) — contrast-checked, not blurred.
- [Detector's remaining non-halo findings (hero eyebrow, all-caps slab, border+shadow glass)] → Out of scope: this change fixes halos + theme only; those stay documented pinned choices.
