## 1. Design setup (Impeccable)

- [x] 1.1 Confirm PRODUCT.md context and record the pinned glass direction (user-pinned "modern darkmode with glassmorphism" — no concept re-roll)
- [x] 1.2 Define glass tokens in `styles.css`: dark gradient ground, ambient glow blobs, frosted panel fills, hairline glass borders, one neon accent, top-edge glass highlight
- [x] 1.3 Rewrite `DESIGN.md` + `.impeccable/design.json` for the glass world at finish (documenter pass)

## 2. Movie data

- [x] 2.1 Replace `MOVIES` in `movies.js` with the six-film roster: Her (2013), Project Hail Mary (2026), One Battle After Another (2025), Crimson Tide (1995), The Hot Chick (2002), The Grand Budapest Hotel (2014)
- [x] 2.2 Resolve and verify poster URLs (TMDB page `og:image`, confirmed 200) for all six films
- [x] 2.3 Resolve and verify trailer IDs (YouTube oEmbed) for each film; leave trailer fields null where none exists
- [x] 2.4 Curate IMDb/RT scores; set `null` (renders "—" placeholder) for any unavailable score
- [x] 2.5 Re-verify and replace the poster URLs for The Hot Chick (2002) and Crimson Tide (1995): resolve the correct film's poster (TMDB/Wikipedia), verify it depicts the right movie and returns 200

## 3. Glass layout & style

- [x] 3.1 Rebuild `index.html`: hero + board in the glass world, remove the trailer modal markup entirely
- [x] 3.2 Rewrite `styles.css`: frosted glass panels with backdrop blur, glow accents, responsive grid, `prefers-reduced-motion`, `backdrop-filter` fallback

## 4. Voting — budget, allocation, celebration (rework)

- [x] 4.0 Shipped on the toggle model (superseded by the rework below): net-score counter + live winner highlight
- [x] 4.1 Build the vote budget section: a control where the visitor sets the total number of votes to distribute, with an available-votes readout
- [x] 4.2 Per-movie counters with + / − controls that allocate/return votes within the budget; counters update live
- [x] 4.3 Enforce the cap: total allocated never exceeds the budget; lowering the budget trims excess allocations
- [x] 4.4 Keep the live winner highlight (most allocated votes): winner class + accent glow + "WINNER" chip, following the leader; aria-live board note
- [x] 4.5 Add the Show Winner button that reveals the winner with a dynamic celebration animation (respects `prefers-reduced-motion`)

## 5. Trailer links

- [x] 5.1 Replace the trailer button with a direct link to the movie's YouTube watch URL (`target="_blank" rel="noopener noreferrer"`)
- [x] 5.2 Remove all modal JS from `app.js` (open/close, focus trap, Escape handling, iframe clearing) and its related markup/IDs
- [x] 5.3 Keep the no-trailer state: cards without a trailer link render no control (per specs)

## 6. QA

- [x] 6.1 Run `node --check` on JS, `html-validate` on HTML, and the Impeccable detector — all clean
- [ ] 6.2 Verify in a browser: vote → counter updates, winner mark moves, trailer opens a new tab, all six films render, mobile layout, glass legibility/contrast
