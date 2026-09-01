## Why

The current glass UI has two issues that reduce polish: the generous border-radii (22-26px on panels) feel soft rather than sharp, and hover states brighten borders/backgrounds (a "glare" effect) that adds visual noise without aiding comprehension. Additionally, two clipboard paste buttons on the IMDb and gist inputs are rarely used (users paste with native keyboard shortcuts) and clutter the form layout. The hero copy is also grammatically broken and reads poorly. This change squares the design, cleans the hover behavior, removes the paste buttons, and improves text readability — producing a sharper, calmer, more symmetric landing page.

## What Changes

- **Squared borders**: Every panel, card, input, button, badge, and chip switches from generous radii (14-26px, 999px pills) to a tight radius scale (6-12px) — a fully squared glass look including buttons, not just panels.
- **Hover de-glare**: Remove border-brightening, amber-tint backgrounds, and shadow-lift on hover from all interactive elements; keep only movement (translateY lifts, entrance animations).
- **Panel brightness**: Raise glass fill opacity a notch (`--glass-fill` 0.05→0.08, `--glass-fill-strong` 0.08→0.12) so panels read slightly brighter at rest, while preserving the Frosted-Enough ≥4.5:1 contrast rule.
- **Paste buttons removed**: The two 📋 clipboard paste buttons (IMDb link input + gist input) are removed from markup, CSS, and JS handlers; their dedicated test file is deleted and the DOM contract fixture gains a regression guard asserting the buttons stay gone.
- **Jest test refactor**: The UI-coupled test suites are audited and updated for the changed UI — paste-control tests removed, an absence-regression added to the fixture suite, and any assertions coupled to changed markup or copy updated so the suite describes the new UI.
- **Readability**: Rewrite the broken hero lede copy; brighten `--text-muted` and placeholder colors for better contrast on glass; resolve the 3 low-contrast findings `impeccable detect` reports.
- **Symmetry**: Hero grid changes from asymmetric `1.15fr | 1fr` to symmetric `1fr | 1fr`.
- **Halo removal**: Kill the bright halo/streak artifact on glass panels — move the fixed-attachment ambient gradient to a dedicated composited layer (Chromium smears fixed backgrounds behind `backdrop-filter` on repaint), drop `saturate(1.5)` from the glass blur, and dim the `--glass-hi` top-edge highlight.
- **Design system docs**: Regenerate `DESIGN.md` (frontmatter `rounded:` scale, Shapes section, component tokens) and `.impeccable/design.json` (component CSS) so `pnpm impeccable detect` validates cleanly against the shipped CSS.

## Capabilities

### New Capabilities

(None — this is a visual refinement, not a new feature.)

### Modified Capabilities

- `shortlist-import`: The "Paste control on import inputs" requirement is removed. The page no longer provides clipboard paste buttons on the IMDb link or gist inputs. Manual typing and native browser paste (Ctrl/Cmd+V) remain fully functional. The layout and positioning requirement ("Board controls live in the navbar and hero control column") is unchanged — controls stay in the hero column.

## Impact

- **Markup**: `index.html` — remove two `<button class="paste-btn">` elements and their IDs.
- **CSS**: `styles.css` — new radius scale across all components, adjusted hover states, brighter glass fill values, brighter muted text, removed `.paste-btn` block, symmetric hero grid.
- **JS**: `src/app.js` — remove `handlePaste`, `tryExecPaste`, paste-button listeners (lines ~587-640).
- **Tests**: `tests/unit/paste-controls.test.js` deleted (all its tests assert paste-button existence/behavior); `tests/ui/fixture.test.js` gains a `.paste-btn` absence guard in its existing "removed UI stays removed" test; remaining UI/integration suites audited for assertions coupled to changed markup or copy.
- **Docs**: `DESIGN.md` and `.impeccable/design.json` regenerated to match the new CSS.
- **Verification**: `pnpm impeccable detect` must return 0 findings; `pnpm test` must pass; visual check against the user's "after" mockup.
