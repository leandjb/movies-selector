## Context

The page is a four-file vanilla site (`index.html`, `styles.css`, `src/app.js`, plus JS modules) with a dark amber glassmorphism visual world, a localStorage voting system, and two modals (clear-all confirmation and winner reveal). The design system lives in `DESIGN.md` (frontmatter tokens + narrative) and `.impeccable/design.json` (component CSS snippets) — both are validated by `pnpm impeccable detect`. The current radius scale is generous (22-26px panels, 999px pills), hover states brighten borders and backgrounds, and two clipboard paste buttons exist on the IMDb and gist inputs.

## Goals / Non-Goals

**Goals:**
- Squared glass: new radius scale (6-12px) for all components including buttons, badges, and chips — no 999px pills.
- De-glared hover: remove border-brightening, amber-tint backgrounds, and shadow-lift from hover states; keep movement (translateY lifts, entrance animations).
- Brighter panels: raise `--glass-fill` and `--glass-fill-strong` opacity for a mild bright at rest.
- Paste buttons removed: markup, CSS, JS handlers, and the dedicated test file deleted.
- Readability: rewrite broken hero lede copy; brighten `--text-muted` and placeholder colors; fix the 3 low-contrast `impeccable detect` findings.
- Symmetry: hero grid from `1.15fr | 1fr` to `1fr | 1fr`.
- Design docs regenerated: `DESIGN.md` and `.impeccable/design.json` match the shipped CSS so `impeccable detect` returns 0 findings.

**Non-Goals:**
- Changing any behavioral spec beyond the paste-control removal (no new features, no voting logic changes, no layout restructure).
- ~~Altering the ambient ember glow, glass-lip highlight, or static shadow recipe (elevation stays).~~ Superseded by D9 (halo removal) — see below; the ember blob alphas and static shadow recipe are still unchanged.
- Touching the JS modules beyond `src/app.js` paste-handler removal.
- Responsive breakpoints or stacking order changes.

## Decisions

### D1: New radius scale (full sweep)

The rule: **no 999px anywhere**; caps are — panels/dialogs/large surfaces 12px, mid panels and section shells 10px, controls/inputs/wells 8px, chips/badges/small buttons/small controls 6px, hairline-thin elements 3px. The table lists every current `border-radius` declaration in `styles.css` so the sweep is exhaustive:

| Element(s) | Current | New |
|-------|---------|-----|
| hero panel, `celebrating::after` | 26px | 12px |
| movie card (`menu__card`), `menu__empty`, modal dialog | 22px | 12px |
| ctl panels, `winner-hero` | 18px | 10px |
| `site-head__inner`, `site-foot__inner` | 16px | 10px |
| toast, budget shell, poster well, `menu__poster-skeleton` | 14px | 8px |
| `adder__input`, `vote__btn`, `winner-hero__poster`, `gist-picklist__item` | 12px | 8px |
| `winner-row` | 12px | 6px |
| `budget__btn`, `menu__rank`, `modal__x`, skip-link | 10px | 6px |
| `menu__remove` | 12px | 6px |
| chips, badges, status pill, all pill-shaped buttons (CTA, reveal, add, gist btn, clear-all, `adder__file`, `adder__clear`, modal cancel/confirm) | 999px | 6px |
| budget progress track + bar (hairline-thin, 0.4rem tall) | 999px | 3px |
| `winner-row__thumb` | 4px | 4px (keep — tiny thumbnail) |
| `:focus-visible` outline | 3px amber + `border-radius: 4px` mutation | 3px amber, **radius mutation removed** (see D2) |

**Keep round (exceptions, not borders):** the status-pill dot (`border-radius: 50%`, a dot, not a pane) and the vote counter SVG ring (circle geometry).

**Alternative considered**: Keep pills for small buttons only. Rejected — user explicitly requested fully squared including buttons.

**Verification aid**: `grep -n "border-radius" styles.css` must show no 999px and no value above 12px (except the keep-round exceptions) after the sweep.

### D2: Hover de-glare (keep movement)

Remove from all hover states:
- `border-color` brightening (e.g. `rgba(255,255,255,0.24)`, `rgba(245,165,36,0.5)`)
- Background amber tint (e.g. `rgba(245,165,36,0.08)`)
- `box-shadow` lift (`var(--shadow-lift)`) — this includes `.menu__card:hover` **and** `.navbar__reveal:hover`, which both apply it today

Keep:
- `transform: translateY(-2px)` / `translateY(-4px)` movement (CTA, navbar reveal, cards, add button, modal confirm)
- `:focus-visible` amber outline (accessibility — not hover)
- Static `var(--shadow)` at rest (not a hover effect)
- Entrance animations (`card-in`, `toast-in`, `pill-breathe`)
- `.vote__btn:disabled:hover` suppression (it restores the rest state on a disabled control — not glare)

**Selector split**: `.badge--link:hover, .badge--link:focus-visible` share one rule today. Strip the hover half; keep the `:focus-visible` half (amber focus on the IMDb link stays).

**Focus radius mutation**: the global `:focus-visible` rule also sets `border-radius: 4px`, which reshapes any focused element's corners — with squared elements this reads as visible morphing on focus. Drop the `border-radius` line; the 3px amber outline alone indicates focus and follows the element's own radius.

**Alternative considered**: Keep shadow-lift as "not glare." Rejected — it adds visual noise on hover without aiding comprehension; the movement alone communicates interactivity.

### D3: Brighter glass fill

- `--glass-fill`: `rgba(245, 165, 36, 0.05)` → `rgba(245, 165, 36, 0.08)`
- `--glass-fill-strong`: `rgba(245, 165, 36, 0.08)` → `rgba(245, 165, 36, 0.12)`

These values must also be documented in `DESIGN.md` frontmatter `colors:` and the `accent.tonalRamp` in `.impeccable/design.json`. The Frosted-Enough rule (≥4.5:1 text contrast) is preserved — the fill is still very translucent over the deep ground.

### D4: Paste button removal

Files touched:
- `index.html`: Remove two `<button class="paste-btn">` elements (lines 100, 112)
- `styles.css`: Remove `.paste-btn` block (lines 1142-1169)
- `src/app.js`: Remove `handlePaste`, `tryExecPaste`, and the `imdbPasteBtn`/`gistPasteBtn` listener wiring (lines ~587-640)
- `tests/unit/paste-controls.test.js`: Delete entirely

No other files reference paste buttons. `showFeedback` is used elsewhere and stays.

### D5: Readability improvements

- **Hero lede** (index.html:65-66): Rewrite from garbled "Paste an IMDb links, set your votes in the movie panel, then The winner stays hidden until you reveal the night's film." to: "Paste an IMDb link, set your votes in the movie panel — the winner stays hidden until you reveal the night's film."
- **`--text-muted`**: `#b0a698` → `#c9beb0` (brighter, target ≥7:1 contrast on the deep ground)
- **Placeholder color**: Currently inherits `--text-muted` via `.adder__input::placeholder`. The brighter `--text-muted` fixes this; no separate placeholder override needed.
- **Board note**: Currently italic muted — the brighter `--text-muted` lifts it. Also align its copy with the app's variant: `index.html:127` says "import a file" while `app.js:238` renders "import a gist" — both become "import a gist" so the static and dynamic copy agree.

### D6: Symmetry

Hero grid: `grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)` → `grid-template-columns: 1fr 1fr`. The three control panels already stack evenly in `.hero__tools`; no further symmetry changes needed.

### D7: Design docs regeneration

After all CSS changes, run `pnpm impeccable detect` to identify any remaining findings. Then regenerate:
- `DESIGN.md` frontmatter: update `rounded:` scale, `colors:` (muted, glass-fill, glass-fill-strong), Shapes section narrative, component tokens
- `.impeccable/design.json`: update `extensions.colorMeta` (the tonal ramp's 0.05/0.08 alpha entries become 0.08/0.12) and component CSS snippets to match the new radii/hover/glass values

**Finding triage**: 3 low-contrast findings already exist on `index.html` before this change (text evaluated against light backgrounds like `#fdf1dc` that do not exist literally in the CSS — likely the detector simulating text over the amber CTA gradient). Do not distort the design chasing them blind: diagnose each finding first; fix the real ones in CSS; for confirmed false positives, register a documented ignore via `pnpm impeccable ignores` with the reason. The goal is zero *unexplained* findings, not zero by distortion.

### D8: Jest test refactor (UI change follows into the tests)

Grounded audit facts: no test asserts CSS styles (no `getComputedStyle` anywhere); `REQUIRED_IDS` in `tests/helpers/app-harness.js` does not include the paste-button ids, so deleting them cannot break the DOM contract test; `tests/ui/fixture.test.js` already has a "removed UI stays removed" test (`.controls`, `.ctl--bar`, `.board__head`, `.reveal` asserted null) — the established pattern for this kind of regression guard.

The refactor:
1. Delete `tests/unit/paste-controls.test.js` — every test in it asserts paste-button existence or clipboard behavior that no longer exists.
2. Extend `fixture.test.js`'s "gone" test with `.paste-btn` absence assertions (both former positions), so the removal is guarded the same way as the status bar removal.
3. Audit the remaining UI/integration suites (`fixture`, `sections`, `cards`, `modals`, `pipeline.integration`) for assertions coupled to markup or copy this change touches — class hooks and ids are preserved by design, so the expected outcome is a short list; anything found gets updated in the same pass.

**Alternative considered**: Rewrite the paste tests to assert absence only. Rejected — `fixture.test.js` is the single home for absence contracts; a second file duplicates that role.

### D9: Halo / bright-effect removal (background compositing + glass bloom)

Reported with a screenshot: bright streaks smear along the hero panel's right edge and spill beyond its bottom corner when the gist input is hovered/focused (i.e. on repaint). `backdrop-filter` output is strictly clipped to the element's bounds, so a glow painting *outside* the panel can only come from the backdrop itself — this is the known Chromium artifact where a `background-attachment: fixed` background is mis-composited behind `backdrop-filter` layers on repaint, amplified here by `saturate(1.5)` pulling the ember blobs through the glass. Fixes, in styles.css:

1. **Root cause**: move the ambient gradient stack off the body's `background-attachment: fixed` onto a dedicated fixed composited layer — `body::before { position: fixed; inset: 0; z-index: -1; pointer-events: none; }` carrying the three radial blobs + the base linear gradient; body itself gets a solid `var(--bg-deep)`. Visually identical (still viewport-fixed ambient), but no fixed-attachment compositing behind glass.
2. **Bloom**: drop `saturate(1.5)` from all three `backdrop-filter` declarations (`.glass` hero/board panels, `.ctl` panels, modal dialog) → plain `blur(16px)`.
3. **Edge hairline**: dim `--glass-hi` from `rgba(255, 200, 87, 0.12)` to `0.06` so the glass-lip top highlight no longer reads as a bright edge.
4. **Ember blob alphas unchanged** (0.32 / 0.16): the blobs are the intended ambient warmth, not the artifact; revisit only if pools still read after 1-3.

Docs (`DESIGN.md`, `.impeccable/design.json`) must be regenerated for the changed backdrop-filter/glass-hi snippets so `impeccable detect` stays at 0 findings.

## Risks / Trade-offs

- **[Reduced radius may feel less "glass-like"]** → The glass-lip highlight, backdrop blur, and ambient glow still communicate glassmorphism. The tighter radius reads as modern/sharp rather than losing the glass identity.
- **[Brighter fill reduces perceived depth]** → Mitigated by keeping the deep ground unchanged and the shadow recipe at rest. Depth comes from the gradient and shadows, not from translucent fill alone.
- **[Paste button removal hurts TV/remote users]** → The paste buttons were designed for TV remotes that can't native-paste. Mitigation: the inputs remain fully typeable with an on-screen keyboard, and the existing guidance toast (shown when clipboard fails) already covers this case. The paste handlers degrade to showing that toast anyway on TV WebKit.
- **[Impeccable detect may flag new issues after changes]** → The regeneration step (D7) catches and fixes these before final verification.
