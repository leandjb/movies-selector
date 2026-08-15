## Context

Greenfield project — the repo is an empty scaffold (package.json, openspec config, no app code). See proposal.md for the motivation. We are building a single static landing page in vanilla HTML/CSS/JS with a curated movie catalog and a localStorage-backed voting system. Design quality is a stated goal: the page must be styled using the Impeccable design skill to avoid generic "AI slop" output.

## Goals / Non-Goals

**Goals:**
- Zero build step: plain `index.html`, `styles.css`, `app.js`, `movies.js` — opens directly in a browser or serves from any static host.
- All movie data lives in one curated data file; no external API calls at runtime.
- Votes persist per browser in `localStorage` and rank the grid.
- A distinctive, polished visual design produced through Impeccable's workflow (`init` → `shape` → `polish` → `audit`).

**Non-Goals:**
- No framework, bundler, or package runtime dependencies.
- No backend, database, auth, or accounts (deliberately YAGNI).
- No global/shared leaderboard, comments, or user profiles.
- No live data fetching (TMDB/OMDb) or dynamic movie search.

## Decisions

### 1. File layout — flat static site
```
index.html     # page shell: hero + <main id="movie-grid">
styles.css     # design tokens + layout + components (via Impeccable)
movies.js      # const MOVIES = [ { id, title, year, imdb, rt, posterUrl, trailerEmbedUrl, trailerWatchUrl, initialVotes } ]
app.js         # render grid, vote handling, localStorage, modal, sorting
```
**Rationale:** smallest possible surface for a single page; matches "vanilla HTML, JS, and CSS modern".
**Alternatives considered:** Vite + React (rejected — build step and dependency for no benefit at this scope); Next.js (rejected — server needs).

### 2. Movie data model — single source of truth
Each movie entry:
```js
{ id: "dune-2021", title: "Dune", year: 2021, imdb: 8.0, rt: 83,
  posterUrl: "...", trailerEmbedUrl: "https://www.youtube.com/embed/<ID>",
  trailerWatchUrl: "https://www.youtube.com/watch?v=<ID>", initialVotes: 12 }
```
- `initialVotes` seeds a non-flat ranking so the page doesn't start at all zeros; it represents "community votes so far" as curated data.
- IMDb shown as `x.x` (out of 10); RT as a percentage. Scores are plain curated numbers, not fetched.
- Poster URLs are curated to stable sources (e.g., TMDB image CDN paths or locally hosted images). ~10–15 movies.
**Rationale:** keeps all five required fields (title, year, IMDb, RT, trailer) plus poster in one place; no API keys.

### 3. Voting — per-movie delta stored in localStorage
- `localStorage` key `movieVotes.v1` → `{ [movieId]: 1 | -1 | 0 }` (versioned key for future migrations).
- Net score displayed = `initialVotes + userDelta`.
- Toggle semantics: clicking the already-active control removes the vote (→ 0); clicking the opposite control switches it (1 → -1).
- Grid re-sorts after every vote change; stable tie-break by `id` so ordering never flickers.
**Rationale:** satisfies "vote once per movie per browser" with the simplest possible state model; no server round-trip.
**Alternatives considered:** star ratings (rejected — heavier UI, less decisive); single like button (rejected — user asked for a voting system and up/down gives ranking tension); backend counter (rejected — YAGNI).

### 4. Trailer — in-page modal with embedded YouTube
- One modal in the DOM containing an `<iframe>`; clicking a card's ▶ button sets `iframe.src` to that movie's `trailerEmbedUrl`.
- Close via ✕ button, Escape key, or backdrop click; closing clears `iframe.src` to stop playback.
- Movies with no trailer link render no button (see specs).
**Rationale:** satisfies the "plays in an in-page modal" requirement with minimal JS.
**Risk:** some trailers disallow embedding → fall back to the `trailerWatchUrl` "Watch on YouTube" link shown inside the modal.

### 5. Visual design — driven by the Impeccable skill
1. `npx impeccable install` (installs the skill for the detected harness).
2. `/impeccable init` → writes `PRODUCT.md` (audience, positioning, constraints) and offers `DESIGN.md` (colors, type, components).
3. `/impeccable shape` before coding → plan the hero + card layout and interaction states.
4. Style with Impeccable's anti-pattern rules: no Inter/system-default font, no purple-to-blue gradients, no cards-nested-in-cards, no pure black/gray, no bounce easing.
5. `/impeccable polish` the page, then `/impeccable audit` (a11y, performance, responsive) before finishing.
**Rationale:** the user explicitly asked for this design skill; it gives the page a deliberate, non-generic look and its deterministic rules catch a11y/responsive issues that a fresh vanilla page tends to miss.

### 6. Accessibility baseline
- Vote controls are real `<button>`s with `aria-pressed`/`aria-label`; score is `aria-live="polite"`.
- Modal traps focus while open and returns it to the trigger on close.
- Color contrast for score badges vs. page background checked via Impeccable audit.
**Rationale:** cheap to do in vanilla and prevents rework; the audit step enforces it.

## Risks / Trade-offs

- [Poster hotlinks break (hotlink protection, expired CDN paths)] → Curate stable URLs at build time; every `<img>` has an `onerror` fallback placeholder (required by specs).
- [YouTube video disallows embedding] → Modal shows a "Watch on YouTube" fallback link using `trailerWatchUrl`.
- [localStorage unavailable (private mode, disabled)] → Guard reads/writes in try/catch and render with votes = initial votes; page still works, votes just don't persist.
- [Design drift if Impeccable isn't actually installed] → Make skill install a first-class task (task 1); `npx impeccable install` is quick and idempotent.
- [Curated scores become stale] → Accepted: data is curated by design; refreshing the JSON is a one-line change per movie.

## Migration Plan

Not applicable — greenfield static page; no previous deployment or data to migrate. Deployment (if any) is copying four files to any static host.

## Open Questions

- Exact movie roster and poster URLs — deferred to implementation; changing them doesn't affect specs, approach, or tasks.
- Page copy/tone for the hero — decided during `/impeccable init` (it writes `PRODUCT.md`), no impact on specs.
