## 1. Design setup (Impeccable)

- [x] 1.1 Install the Impeccable skill via `npx impeccable install` from the project root
- [x] 1.2 Run `/impeccable init` to create `PRODUCT.md` and the starting `DESIGN.md` scaffold (audience, positioning, colors, type, components)
- [x] 1.3 Add the recommended `.impeccable/` ephemeral-file ignore block to `.gitignore`
- [x] 1.4 Run `/impeccable shape` to plan the hero + movie card layout and interaction states before coding

## 2. Page shell

- [x] 2.1 Create `index.html` with the hero section, `<main id="movie-grid">` container, trailer modal markup, and script/style tags for the four files
- [x] 2.2 Create `styles.css` with design tokens (colors, type scale, spacing) from `DESIGN.md`, plus layout for hero, responsive grid, and modal

## 3. Movie data

- [x] 3.1 Create `movies.js` with a curated `MOVIES` array of 10–15 entries, each with `id`, `title`, `year`, `imdb`, `rt`, `posterUrl`, `trailerEmbedUrl`, `trailerWatchUrl`, and `initialVotes`
- [x] 3.2 Verify every poster URL and trailer URL resolves; record fallback placeholders for any poster that can't be verified

## 4. Voting & ranking

- [x] 4.1 Create `app.js` that renders movie cards from `MOVIES` (title, year, IMDb badge, RT badge, poster, trailer button, vote controls, score)
- [x] 4.2 Implement vote logic: per-movie delta in `localStorage` (`movieVotes.v1`), toggle semantics (repeat click removes, opposite click switches), net score = `initialVotes + delta`
- [x] 4.3 Implement sorting of the grid by net score (highest first, stable tie-break by id) and re-render on every vote change
- [x] 4.4 Guard all `localStorage` access in try/catch so the page works (without persistence) when storage is unavailable
- [x] 4.5 Add poster `onerror` fallback so a broken image shows a placeholder instead of an error icon

## 5. Trailer modal

- [x] 5.1 Implement the modal: clicking a trailer button sets the iframe to `trailerEmbedUrl`, opens the overlay, and traps focus
- [x] 5.2 Implement close paths: ✕ button, Escape key, backdrop click; clear the iframe src on close to stop playback
- [x] 5.3 Add a "Watch on YouTube" fallback link inside the modal using `trailerWatchUrl` for trailers that disallow embedding
- [x] 5.4 Hide the trailer button entirely for movies without a trailer link (per specs)

## 6. Accessibility & polish

- [x] 6.1 Make vote controls real buttons with `aria-pressed`/`aria-label` and announce score changes via `aria-live="polite"`
- [x] 6.2 Run `/impeccable polish` on the page (alignment, spacing, typography, color, interaction states, motion, copy)
- [x] 6.3 Run `/impeccable audit` and fix any accessibility, performance, or responsive findings
- [ ] 6.4 Verify manually in a browser: vote, reload to confirm persistence, open/close the trailer modal, and check mobile layout
