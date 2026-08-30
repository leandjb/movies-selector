## 1. Shape (Impeccable, via pnpm)

- [ ] 1.1 Record the shape brief for the three symmetric panels + status bar + bottom reveal section (reuse design.md D1 diagram); run `pnpm impeccable detect index.html styles.css` for the before-snapshot

## 2. Layout

- [ ] 2.1 Restructure `index.html`: `.controls` holds the three equal panels (Vote budget / Add by IMDb link / Import), the Status section becomes a full-width `.ctl--bar` beneath them, and `#show-winner` moves to a new centered `.reveal` section after `#movie-grid` (same id, no app.js logic change)
- [ ] 2.2 Restyle `styles.css`: `.controls` → `repeat(3, 1fr)` + stretch, slim `.ctl--bar` styles, centered `.reveal` section, mobile stacking at ≤1020px; hero copy updated to match the blind-vote/purple tone

## 3. Purple theme, no halos

- [ ] 3.1 Swap `:root` tokens to the purple family per design.md D2 (accent, glass tints, borders; delete `--accent-glow`) and migrate every `#3ee1ff`/`rgba(62,225,255,…)` literal in `styles.css` + `favicon.svg`
- [ ] 3.2 Remove all chromatic halos (text-shadow glows, zero-offset colored box-shadows) per design.md D3; hover/focus states move to border-color + neutral elevation + solid `:focus-visible` outline
- [ ] 3.3 Update `DESIGN.md` colors/components to the purple system so the detector's design-system checks validate

## 4. Polish + audit (Impeccable, via pnpm)

- [ ] 4.1 Run `pnpm impeccable detect` on all touched files: `dark-glow` findings must be 0; fix any new type-ramp/radius drift introduced by the reskin
- [ ] 4.2 Polish pass: contrast of purple text/controls on dark ≥4.5:1, focus order still DOM = reading order, three panels equal height, status bar and reveal section stack correctly on mobile; fix findings

## 5. Verification

- [ ] 5.1 `node --check` all JS (no logic changes expected); full Jest suite stays 72/72
- [ ] 5.2 Manual browser pass: three equal panels on desktop, stacked on mobile; status bar full-width; reveal button below the grid opens the results modal; purple theme everywhere with no colored glows; favicon purple; hard-refresh check
