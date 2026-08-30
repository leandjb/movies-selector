## 1. Move the reveal button

- [x] 1.1 `index.html`: remove the `#show-winner` button from the Vote-budget panel's `.ctl__body`; add `<section class="reveal glass" aria-label="Reveal the winner">` immediately after `#movie-grid` containing the button unchanged (same id + `board__show-winner` class)
- [x] 1.2 `styles.css`: add `.reveal` (centered glass strip, `margin-top: 1.6rem`, radius 18px, flex-center) using current theme tokens only; verify no leftover budget-panel spacing rules for the button; check ≤640px stacking

## 2. Badge score tests

- [x] 2.1 `cards.test.js`: rating-correctness test — suggestion 404 for `tt0111161` + JSON-LD fallback route with `rating: 8.4` → that card's `.badge--imdb` reads exactly `8.4` while a second no-rating movie reads `—` (per-movie binding)
- [x] 2.2 `cards.test.js`: placeholder test — suggestion-success route (no rating) → badge reads exactly `—`

## 3. Footer credit

- [x] 3.1 `index.html`: append the credit line to `.site-foot__inner` — `Developed with passion by` + link to `https://github.com/leandjb` (`target="_blank" rel="noopener noreferrer"`)
- [x] 3.2 `styles.css`: `.site-foot__credit` styling (muted, accent link with hover)

## 4. Test-suite alignment + verification

- [x] 4.1 `fixture.test.js`: add footer assertion (anchor to `https://github.com/leandjb` present in `.site-foot`)
- [x] 4.2 Full Jest suite green (112 existing + new tests); `node --check` on touched JS; confirm `app.js` is byte-identical (no logic change)
- [ ] 4.3 Manual browser pass: reveal button sits centered below the grid and still opens the results modal / shows the blocked message; footer credit renders and the link opens the GitHub profile; mobile layout intact
