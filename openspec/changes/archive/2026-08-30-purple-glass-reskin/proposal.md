## Why

The control area grew organically: four unequal panels where the budget panel shares space with the reveal button, the status line floats, and the reveal action sits far from where the night actually ends — below the board. Visually, the cyan accent plus its chromatic halo shadows (text-shadow / zero-offset box-shadow glows) are the "AI slop" signature the impeccable detector keeps flagging (15 findings at last audit), and the site has no purple in it despite glassmorphism's natural affinity for it. The host wants a calm, symmetric, purple-tinted dark glass surface with clean neutral elevation — no halos anywhere.

## What Changes

- Reorganize the control area into a symmetric layout: three equal-width glass panels in one row — **Vote budget**, **Add by IMDb link**, **Import (TXT + gist)** — collapsing to a single column on mobile; the **Status** section (feedback, count, Clear all) becomes a full-width slim bar directly beneath the three panels.
- Move the **Show the winner** button out of the budget panel into its own centered section at the **bottom of the landing page, below the movie grid** — the reveal becomes the closing beat of the page, where the night ends.
- Re-theme the design system from cyan to a **dark modern purple glass**: purple accent (single accent, replacing cyan everywhere — kickers, CTAs, counter arcs, focus states, the winner moment in the results modal), purple-tinted glass fills/borders, updated `favicon.svg`.
- **Remove all halos**: no chromatic `text-shadow` or zero-offset colored `box-shadow` glows anywhere; elevation is neutral shadows only; focus indication keeps a solid (non-blurred) accent outline. The impeccable detector's `dark-glow` findings go to zero.
- Run the Impeccable workflow via **pnpm** (`pnpm impeccable`, skills already installed): shape the new control area before markup, then polish + audit after; update `DESIGN.md` to the purple system.

## Capabilities

### New Capabilities

<!-- none — pure visual/layout re-skin; no behavior delta (skip_specs) -->

### Modified Capabilities

<!-- none — the voting spec's "Show the winner button" and the sections
     requirement do not pin location or palette, so no behavior contract
     changes. The visual contract lands in DESIGN.md + design.md. -->

## Impact

- `styles.css`: `:root` token swap (accent family cyan → purple, glass tints neutralized to purple-gray, `--accent-glow` halo token deleted), removal of every chromatic `text-shadow`/`box-shadow` halo (budget value, brand mark, CTAs, winner hero, counter arc strokes), `.controls` grid → three equal columns + status bar, new bottom reveal section styles, hero copy accents.
- `index.html`: control area restructured (three equal panels + status bar); `#show-winner` relocated to a new bottom section after `#movie-grid`; hero lede/slab copy updated.
- `app.js`: no logic changes — the reveal button handler only re-binds to the relocated `#show-winner` (same id).
- `favicon.svg`: star recolored to the purple accent.
- `DESIGN.md`: colors and component tokens updated to the purple system via the Impeccable workflow.
- Detector: `dark-glow` findings 15 → 0; no new type-ramp or radius drift.
- Tests: no behavior changes — full Jest suite must stay green (72/72).
