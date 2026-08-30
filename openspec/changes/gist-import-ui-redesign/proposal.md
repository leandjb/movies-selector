## Why

The board is built by pasting links or importing a TXT file, which means the host has to keep a local file around to set up movie night. The movie list already lives in a GitHub gist (e.g. `https://gist.github.com/leandjb/f14aba6d67faf726ac12a5936ccd14a3`), and gists are fetchable directly from the browser with no CORS proxy — so a "paste a gist URL, import the links" path is the cheapest way to make the board self-serve. At the same time, the current adder panel crams four unrelated jobs into one glass box (paste a link, import TXT, count, clear), voting visibly relocates cards mid-game which feels jarring, and the page has no favicon.

## What Changes

- Add gist import: a field that accepts any GitHub gist URL (or bare gist ID) plus an Import button. The page fetches the gist client-side (GitHub API, no proxy), reads its text file, and feeds the links through the existing add pipeline — duplicates rejected, 9-cap enforced, summary reported, hydration queued. Import merges into the current board; it never clears it.
- Reorganize the controls into four visually distinct sections instead of today's two crowded panels: (1) vote budget, (2) add by IMDb link, (3) import from TXT file or gist, (4) status — feedback messages, movie count, and Clear all.
- Stop re-ordering the card grid when votes change. Cards keep the order they were added; vote totals, the winner hero, and the winner glow still update live — only the physical card order is now stable.
- Add a favicon matching the brand (star mark, cyan on the dark ground).
- Retire the stale curated-catalog requirements that still sit in the `movie-catalog` spec (exact six-movie roster, RT badge, trailer links, curated poster data) so the specs describe the dynamic board that actually exists. Remaining poster/score placeholder behavior moves to `shortlist-import`.

## Capabilities

### New Capabilities

<!-- none — all work lands in existing capabilities -->

### Modified Capabilities

- `shortlist-import`: add gist import (URL/ID field, client-side fetch, merge semantics, error reporting), a poster-fallback requirement absorbed from the retired catalog spec, and a requirement that board tools are grouped into the four dedicated sections.
- `voting`: the grid no longer re-sorts on vote changes (stable insertion order; ranking drives only the winner indicator), and winner tie-breaks are defined without reference to grid ranking.
- `movie-catalog`: remove the curated-catalog requirements (six-movie roster, full-metadata RT/trailer fields, catalog-sourced posters, poster-accuracy curation, missing-score placeholder) — the capability is retired; live behavior is covered by `shortlist-import`.

## Impact

- `index.html`: control area restructured into four sections; favicon `<link>` added; new gist field/button in the import section.
- `styles.css`: four-section layout, section headings, gist field styling (existing glass/dark token system reused).
- `app.js`: gist import handler (reads the field, calls the new gist module, feeds `handleAdd`); remove the vote-driven re-sort; status/summary messaging unchanged.
- New `gist.js` (UMD, like `imdb.js`/`board.js`): gist URL/ID parsing, `fetch https://api.github.com/gists/{id}`, first text-file extraction, `truncated` fallback to the raw URL; plus `gist.test.js`.
- `board.js`: no behavior change (insertion order already preserved); tests added to lock "voting does not reorder".
- No new dependencies, no backend, no keys — GitHub's public API is CORS-open and keyless (60 req/hour per IP, ample for a click-to-import button).
- Specs: `openspec/specs/movie-catalog/spec.md` will be retired at archive; `voting` and `shortlist-import` main specs updated at archive.
