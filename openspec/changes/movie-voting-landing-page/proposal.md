## Why

The project is an empty scaffold with no application code. We want a single-page landing page where visitors can browse a curated list of movies (with poster, year, IMDb score, Rotten Tomatoes score, and YouTube trailer) and vote for the one they'd pick for movie night. Keep it deliberately small: vanilla HTML/CSS/JS, no framework, no backend, no auth — per YAGNI.

## What Changes

- Add a single landing page (`index.html`) with a hero section and a grid of movie cards.
- Add a movie catalog data file (`movies.js`) containing a curated list of movies, each with: title, year, IMDb score, Rotten Tomatoes score, YouTube trailer link, and poster image.
- Add vote functionality: up/down voting per movie, with votes persisted in `localStorage` (per-browser, no server).
- Order movie cards by net vote score (best first), with a live count shown on each card.
- Add a trailer viewer: clicking the trailer button opens an in-page modal with the embedded YouTube video.
- Style the page with vanilla CSS (`styles.css`) designed through the Impeccable skill (`/impeccable`) to avoid generic "AI slop" design.
- Add the Impeccable skill setup (`PRODUCT.md`/`DESIGN.md`) as part of the design workflow.

## Capabilities

### New Capabilities
- `movie-catalog`: Displays a curated list of movies on the landing page, each showing title, year, IMDb score, Rotten Tomatoes score, poster, and a YouTube trailer link.
- `voting`: Lets visitors upvote or downvote movies; votes persist locally per browser and cards are ranked by net score.

### Modified Capabilities
<!-- No existing specs; this is a greenfield app. -->

## Impact

- New files: `index.html`, `styles.css`, `app.js`, `movies.js` (at project root, no build step).
- New tooling: Impeccable design skill installed via `npx impeccable install` (writes `.claude/skills/`/`.cursor/skills/` etc. and `PRODUCT.md`/`DESIGN.md`); ephemeral `.impeccable/` state ignored via `.gitignore`.
- No external APIs, no backend, no auth, no new runtime dependencies. Poster images are curated URLs in the data file.
