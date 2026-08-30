## Why

Three small polish items the host wants on the landing page:

1. **The reveal action is buried.** `#show-winner` currently sits inside the Vote-budget panel, far from where the night actually ends — below the movie grid. Moving it into its own section at the bottom of the page makes the reveal the closing beat: vote through the grid, scroll to the end, call the winner.
2. **The IMDb score badge is untested for correctness.** The `badge badge--imdb` element is the only place a movie's rating is shown, and nothing pins what it must display. Tests should verify the badge shows the correct per-movie score when metadata provides one, and the `—` placeholder when it doesn't (the suggestion-first pipeline intentionally carries no rating — this is coverage, not a behavior change).
3. **The footer has no authorship.** The host wants a modern credit line: "Developed with passion by leandjb" linking to `https://github.com/leandjb`.

## What Changes

- **Move the reveal button**: relocate `<button id="show-winner">` out of the Vote-budget panel into a new section rendered after `#movie-grid` (a centered `.reveal` glass strip at the bottom of the landing page, above the footer). Same id, same class, same handler — `app.js` needs no logic change; only markup + CSS.
- **Badge score tests**: add Jest coverage asserting the `badge badge--imdb` element displays the hydrated rating when the metadata supplies one and `—` when it doesn't, per movie (never another movie's score).
- **Footer credit**: add the authorship line with a link to the GitHub profile, styled to match the muted footer (`text-muted`, accent hover on the link).
- **Test-suite alignment**: the DOM harness reads the real `index.html`, so the relocation is picked up automatically; the fixture contract test asserts the `show-winner` id (stable across the move) and gains a footer-credit assertion.

## Capabilities

### New Capabilities

<!-- none — layout move + tests + static footer credit; no behavior delta (skip_specs).
     No spec pins the reveal control's location: the voting spec references it by
     name and gating behavior only, so relocating it changes no requirement. -->

### Modified Capabilities

<!-- none -->

## Impact

- `index.html`: remove the `#show-winner` button from the Vote-budget `.ctl`; add a `<section class="reveal glass">` after `#movie-grid` containing the button (same `id="show-winner"`, same `board__show-winner` class); add the credit line to `.site-foot`.
- `styles.css`: `.reveal` section styles (centered glass strip, bottom of the page, mobile padding) + footer link styling; remove the budget panel's now-dead show-winner spacing rules if any.
- `cards.test.js` (or a new `badges.test.js`): two badge-correctness tests — rating shown when provided (via the JSON-LD fallback route), `—` when not (suggestion-success route), asserted per movie.
- `fixture.test.js`: footer-credit assertion (link to `https://github.com/leandjb` present).
- `app.js`: **unchanged** — `showWinnerBtn` binds by id and the button's disabled gating (`render()`) is location-independent.
- **Follow-up (out of scope here):** `purple-glass-reskin` task 2.1 contains the same relocation; when that change is applied, its task 2.1 should be trimmed to only the three-symmetric-panels + status-bar work so the move isn't implemented twice.
- Suite must stay green (112 tests + the new ones).
