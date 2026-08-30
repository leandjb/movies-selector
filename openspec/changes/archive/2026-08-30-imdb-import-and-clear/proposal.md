## Why

The landing page ships with a hardcoded six-film roster, so visitors can only vote on curated titles. Movie-night hosts need to build their own shortlist straight from IMDb: paste one link and get a card instantly, or import a whole TXT file of links at once — with a hard ceiling of 9 cards and a safe way to wipe the board and start over.

## What Changes

- **BREAKING** — The static six-film catalog is removed. The board starts empty and is built entirely by the visitor; `movies.js` is deleted.
- New "Add movies" toolbar on the board: a paste field + Add button, an "Import .txt" button, a live `n / 9` card counter, and a danger "Clear all" button.
- Pasting an IMDb title link creates a card immediately (placeholder poster/skeleton), then hydrates with title, year, IMDb rating, and portrait fetched from `api.imdbapi.dev` (free, keyless). If the fetch fails, the card stays with placeholder dashes instead of fabricated data.
- TXT import reads the file locally (FileReader), extracts valid IMDb title IDs line by line, dedupes against the board, fills free slots up to 9, and reports a summary (imported / duplicates / invalid / skipped).
- Cards for user-added movies show exactly: portrait, title, year, IMDb rating badge, plus the existing vote counter. The Rotten Tomatoes badge and trailer link are removed from the card (no data source exists for them in a user-built board).
- "Clear all" opens a glass confirmation modal (Esc / backdrop / Cancel to dismiss); confirming erases every card and the votes tied to them.
- The board persists in localStorage (new key) alongside the existing vote persistence; an empty board shows an inviting empty state and disables winner actions.
- Jest unit tests for the new modules and an integration test across them (parse → board state → persistence); `test` script wired up.
- All new UI reuses the existing glass design tokens (`.impeccable/design.json`, `styles.css` variables) — no new colors, fonts, or motion curves.

## Capabilities

### New Capabilities

- `shortlist-import`: Building the board from IMDb links — paste-to-add, TXT file import, tt-ID validation and dedupe, the 9-card cap with feedback, board persistence, the clear-all flow with confirmation modal, and the empty-board state.

### Modified Capabilities

- `movie-catalog`: **BREAKING** — the fixed six-film roster requirement is removed (catalog is now user-built and starts empty); card metadata becomes title, year, IMDb rating, and poster fetched from IMDb data, with the Rotten Tomatoes badge and trailer link removed; poster images now come from fetched data instead of the static catalog.

## Impact

- **Code**: `index.html` (toolbar, modal, empty state, hidden file input), `styles.css` (toolbar, counter, modal, skeleton/error card states — existing tokens only), `app.js` (empty-state render, hydration, modal wiring), new `imdb.js` (link parsing + API fetch/normalize) and `board.js` (board state, cap, dedupe, persistence); `movies.js` deleted.
- **Dependencies**: none added at runtime; external API dependency on `api.imdbapi.dev` (keyless; unverified reachability from this machine — needs a connectivity spike during implementation). Jest already in devDependencies; `package.json` test script updated.
- **Data**: new localStorage key for the persisted board; existing vote key retained, now keyed by IMDb tt-IDs.
- **Specs**: `openspec/specs/movie-catalog/spec.md` amended via delta; new `openspec/specs/shortlist-import/spec.md`.
