## Why

The shipped landing page needs a visual overhaul and three functional fixes. The user wants a modern dark-mode glassmorphism look (a pinned direction, replacing the darkroom world), a visible vote counter with a live winner highlight ("show the winner with more votes"), and a working trailer flow — the in-page modal is unreliable, so trailers should just open as YouTube links. The catalog also changes to a specific six-film roster.

## What Changes

- **BREAKING (visual):** Replace the darkroom visual world with a modern dark-mode glassmorphism style on the single page, designed with the Impeccable skill. Direction is user-pinned ("modern darkmode with glassmorphism") — no concept re-roll.
- **BREAKING (trailer):** Remove the in-page YouTube modal. The trailer control becomes a direct link that opens the movie's YouTube trailer in a new tab.
- Replace the up/down toggle voting with **budgeted allocation**: a section where the visitor sets the total number of votes to distribute, and per-movie counters that increase/decrease allocated votes within that budget, updating live.
- Keep a live winner highlight (most allocated votes) and add a **Show Winner button** that reveals the winner with a dynamic celebration animation.
- Ensure every poster depicts its actual film — re-verify and correct the catalog (The Hot Chick and Crimson Tide currently show wrong posters).
- Replace the movie catalog with the specified roster: Her (2013), Project Hail Mary (2026), One Battle After Another (2025), Crimson Tide (1995), The Hot Chick (2002), The Grand Budapest Hotel (2014).
- Handle missing scores gracefully (e.g., unreleased titles): show a placeholder, never a fabricated number.

## Capabilities

### New Capabilities
<!-- None — both capabilities exist from movie-voting-landing-page. -->

### Modified Capabilities
- `movie-catalog`: The roster is replaced with the six specified films; the trailer behavior changes from an in-page modal to a direct YouTube link; cards must handle missing scores without fabricating values; posters must depict the correct film (two current entries are wrong).
- `voting`: Replaces the up/down toggle with budgeted vote allocation (a vote-budget section and per-movie +/− counters), keeps a live winner highlight, and adds a winner celebration button.

## Impact

- Files changed: `index.html`, `styles.css`, `app.js`, `movies.js` (same four-file vanilla structure, no build step).
- Removed: trailer modal markup and its JS (open/close, focus trap, iframe handling); the darkroom design system and its DESIGN.md tokens.
- Data: 6 movies, each with poster (TMDB CDN, verified), trailer link (YouTube, verified via oEmbed), curated IMDb/Rotten Tomatoes scores or a null placeholder.
- No new runtime dependencies, no backend, no auth, no build step.
