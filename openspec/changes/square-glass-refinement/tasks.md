## 1. Paste button removal (D4)

- [x] 1.1 Delete `tests/unit/paste-controls.test.js` entirely and verify `pnpm test` still passes (nothing else references the paste buttons)
- [x] 1.2 Remove the two `<button class="paste-btn">` elements from `index.html` (IMDb link input and gist input) and verify `grep -n "paste-btn" index.html` returns nothing
- [x] 1.3 Remove the `.paste-btn` CSS block from `styles.css` and verify `grep -n "paste-btn" styles.css` returns nothing
- [x] 1.4 Remove `handlePaste`, `tryExecPaste`, and the `imdbPasteBtn`/`gistPasteBtn` listener wiring from `src/app.js` and verify `grep -rn "paste-btn\|handlePaste\|tryExecPaste" index.html styles.css src/ tests/` returns nothing while `pnpm test` passes
- [x] 1.5 Extend the "removed UI stays removed" test in `tests/ui/fixture.test.js` with `.paste-btn` absence assertions and verify the new assertions pass (and the suite covers the removal as a regression guard)

## 2. Design tokens and radius sweep (D1, D3, D5)

- [x] 2.1 Update `--glass-fill` to `rgba(245, 165, 36, 0.08)` and `--glass-fill-strong` to `rgba(245, 165, 36, 0.12)` in `styles.css` `:root` and verify panels read brighter at rest per D3
- [x] 2.2 Update `--text-muted` from `#b0a698` to `#c9beb0` in `styles.css` and verify placeholders, board note, and secondary text are brighter while keeping ≥4.5:1 contrast (Frosted-Enough rule)
- [x] 2.3 Sweep every `border-radius` declaration in `styles.css` per the D1 table (use `grep -n "border-radius" styles.css` as the checklist): 12px panels/dialogs/`menu__empty`/`celebrating::after`, 10px ctl/header/footer/`winner-hero`, 8px inputs/wells/toasts/skeleton, 6px chips/buttons/badges/small controls, 3px progress track/bar, keep-round exceptions only — verify the grep shows no 999px and nothing above 12px outside the keep-round list
- [x] 2.4 Drop the `border-radius: 4px` mutation from the global `:focus-visible` rule and verify a focused button keeps its own radius while the 3px amber outline remains

## 3. Hover de-glare (D2)

- [x] 3.1 Reduce `.menu__card:hover` to `transform: translateY(-4px)` only and verify no border-color, background, or box-shadow change remains on card hover
- [x] 3.2 Strip the glare (border-color brightening, background tints, `var(--shadow-lift)`) from the hover states of `.navbar__reveal`, `.budget__btn`, `.vote__btn`, `.gist__btn`, `.board__clear`, `.menu__remove`, `.modal__cancel`, `.gist-picklist__item`, `.toast__close`, and the footer credit link; split the shared `.badge--link` hover/focus rule keeping only the `:focus-visible` half — verify no hover rule changes color, background, border-color, or box-shadow, and translateY movement still works on CTA/reveal/cards
- [x] 3.3 Run `pnpm test` and verify the suite passes after the CSS-only changes

## 4. Readability and symmetry (D5, D6)

- [x] 4.1 Rewrite the hero lede in `index.html` (lines 65-66) to: "Paste an IMDb link, set your votes in the movie panel — the winner stays hidden until you reveal the night's film." and verify the paragraph reads correctly in the rendered page
- [x] 4.2 Align the board note copy: `index.html:127` "import a file" → "import a gist" to match `app.js:238` and verify both static and dynamic variants agree
- [x] 4.3 Change `.hero` grid from `grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)` to `grid-template-columns: 1fr 1fr` in `styles.css` and verify both columns render equal width above the 1020px breakpoint

## 5. Jest test refactor audit (D8)

- [x] 5.1 Audit the remaining UI/integration suites (`fixture`, `sections`, `cards`, `modals`, `pipeline.integration`) for assertions coupled to markup or copy this change touches (class hooks, ids, placeholder text, rendered copy) and record the findings list — verify no assertion depends on removed UI outside the paste work already done in group 1
- [x] 5.2 Update every flagged assertion for the new UI and verify `pnpm test` passes with the updated suites

## 6. Design docs and final verification (D7)

- [x] 6.1 Run `pnpm impeccable detect index.html styles.css` and triage every finding: fix real issues in CSS; register documented ignores via `pnpm impeccable ignores` for confirmed false positives (e.g. gradient-simulated contrast) — verify no unexplained findings remain
- [x] 6.2 Regenerate `DESIGN.md`: frontmatter `rounded:` scale and `colors:` (muted → `#c9beb0`, glass-fill → 0.08, glass-fill-strong → 0.12), Shapes section narrative, and component tokens to match the shipped CSS
- [x] 6.3 Regenerate `.impeccable/design.json`: `extensions.colorMeta` tonal ramp (0.08/0.12 alphas) and component CSS snippets matching the new radii, hover behavior, and glass fills — verify a spot-check of three components against `styles.css`
- [x] 6.4 Run `pnpm impeccable detect index.html styles.css` one final time and verify zero unexplained findings
- [x] 6.5 Run `pnpm test` and verify all tests pass
- [x] 6.6 Visual check against the user's after mockup — verify: squared corners everywhere (no pills), brighter panels, no paste buttons, symmetric hero columns, hover produces movement without glare

## 7. Halo / bright-effect removal (D9)

- [x] 7.1 Triage the halo against the rendered page (before/after mockup): toggle each source in DevTools and record which ones produce the visible halo — (a) `saturate(1.5)` amplifying the ember glow through the glass (`styles.css:71-72`, `styles.css:440-441`, `styles.css:1499-1500`), (b) the `--glass-hi` top-edge hairline (`styles.css:16`, applied at 75, 443, 1341, 1502), (c) the body ember radial gradients (`styles.css:59-61`) — 7.2-7.4 below cover all three by default — **Trialed: the streaks paint *outside* the panel bounds on hover/repaint, which `backdrop-filter` clipping forbids for any in-panel source; root cause is the `background-attachment: fixed` gradient mis-compositing behind glass (see D9), amplified by saturate**
- [x] 7.2 Tame the glass bloom: drop `saturate(1.5)` to `saturate(1)` (or remove the saturate clause) in the three `backdrop-filter` declarations (`styles.css:71-72`, `styles.css:440-441`, `styles.css:1499-1500`) and verify panels no longer amplify the glow behind them while blur depth is preserved
- [x] 7.3 Dim the glass-lip highlight: reduce `--glass-hi` (`styles.css:16`) from `rgba(255, 200, 87, 0.12)` to a subtle value (e.g. `rgba(255, 200, 87, 0.06)`) or drop the `inset 0 1px 0` clause from `.glass` (75), the ctl panel (443), winner lip (1341), and modal (1502) — verify no bright amber hairline reads along panel tops
- [ ] 7.4 Soften the ambient ember blobs if they still pool behind panels: lower the alpha of the two lit body radial gradients (`styles.css:59-60`, `rgba(217, 119, 6, 0.32)` and `rgba(245, 165, 36, 0.16)`) and verify the ground reads as a deep warm night without bright halos
- [x] 7.5 Revise `design.md` for this change: delete the Non-Goal "Altering the ambient ember glow, glass-lip highlight, or static shadow recipe (elevation stays)" and add Decision D9 documenting the values chosen in 7.2-7.4; fold the halo removal into `proposal.md` Goals so proposal/design/tasks agree
- [x] 7.6 Regenerate `DESIGN.md` and `.impeccable/design.json` (glass-hi and backdrop-filter snippets) to match the shipped CSS, then run `pnpm impeccable detect index.html styles.css` (expect 0 findings) and `pnpm test` (expect all passing)
- [x] 7.7 Root-cause fix (D9): move the ambient gradient stack from the body's `background-attachment: fixed` background onto a dedicated fixed composited layer (`body::before`, `position: fixed; inset: 0; z-index: -1; pointer-events: none`) with the body solid `var(--bg-deep)`, so Chromium no longer smears the fixed background into bright streaks behind `backdrop-filter` panes on hover/repaint
