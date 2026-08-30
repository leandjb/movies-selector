## Context

The board is a static vanilla-JS page: `board.js` owns state (insertion-ordered, capped at 9, persisted), `imdb.js` fetches details through CORS proxies with a throttled retry queue in `app.js`, and the adder panel handles paste and TXT import. GitHub serves `api.github.com` with `Access-Control-Allow-Origin: *`, so gist content is reachable directly from the browser — none of the IMDb proxy machinery is needed. The verified example gist (`leandjb/f14aba6d67faf726ac12a5936ccd14a3`) holds one 508-byte `imbd-list.txt` with 9 links. Meanwhile the control area stacks four jobs into one panel, voting re-sorts the grid mid-game, and the page has no favicon.

## Goals / Non-Goals

**Goals:**
- One-field gist import that merges links into the board through the exact same pipeline as TXT import.
- Four clearly separated control sections (budget / add-link / import / status) in the existing glass design language.
- Cards never move when votes change; the winner indication still tracks the leader live.
- A branded favicon.
- Specs that describe the real app: retire the curated-catalog leftovers in `movie-catalog`.

**Non-Goals:**
- No GitHub authentication, OAuth, or tokens (keyless public API only).
- No gist *writing* (the list is still edited in the gist itself).
- No auto-sync on page load — import happens only when the button is pressed.
- No change to board cap, dedupe, persistence, hydration queue, or proxy chain.
- No re-introduction of curated data (RT badges, trailers).

## Decisions

### 1. Four-section control layout

```
┌──────────────────────────────────────────────────────────────┐
│  HERO (untouched)                                            │
├──────────────────────────────────────────────────────────────┤
│  SECTION 1 · VOTE BUDGET                                     │
│    votes-to-give stepper · remaining · Show the winner       │
├──────────────────────────────────────────────────────────────┤
│  SECTION 2 · ADD BY LINK                                     │
│    IMDb link input · Add                                     │
├──────────────────────────────────────────────────────────────┤
│  SECTION 3 · IMPORT                                          │
│    Import .txt (file) · gist URL/ID field · Import gist      │
├──────────────────────────────────────────────────────────────┤
│  SECTION 4 · STATUS                                          │
│    feedback message · 3 / 9 · Clear all                      │
├──────────────────────────────────────────────────────────────┤
│  MOVIE GRID (unchanged position)                             │
└──────────────────────────────────────────────────────────────┘
```

Each section is a `.glass` panel with a small uppercase kicker label, mirroring the existing hero/board styling. `Show the winner` stays with the budget (it is a voting action). Implementation via the Impeccable workflow (`/impeccable shape` before markup, `/impeccable polish`, `/impeccable audit` after), reusing the existing tokens (`--accent`, `--glass-*`, `--ease`) — no new palette.

**Rationale:** the four jobs have different rhythms (set once / add one / bulk / read state) and today share one box; separation also gives the status line a stable home instead of shifting as controls wrap.

### 2. Gist fetching — public GitHub API, one request

- Accept a full gist URL (`gist.github.com/<user>/<id>`, with or without `?ref`) or a bare 32-hex ID; extract the ID with a strict regex, reject anything else with the existing feedback line.
- `GET https://api.github.com/gists/{id}` — keyless, CORS-open, returns JSON with `files` and inline `content` for small files (the target use: ≤ ~1 MB, `truncated: false`).
- Pick the first file whose filename ends in `.txt` or whose `type` is `text/plain`; if none, error. If `truncated: true`, re-fetch that file's `raw_url` (also CORS-open) as fallback.
- Unauthenticated rate limit is 60 req/hour per IP — irrelevant for a click-to-import button; a 403 with exhausted limit surfaces as the same error message path.

**Alternatives:** `gist.githubusercontent.com/.../raw` (lighter, but no file listing or truncation flag; kept as the `truncated` fallback); hardcoded gist ID (rejected — the field accepts any gist at no extra cost).

### 3. New `gist.js` UMD module (testable like the others)

`window.Gist` with `parseGistRef(text) → id | null` and `fetchGistText(ref, fetchImpl) → { name, content }`. Pure parsing and fetch-shape logic go here so Jest can cover URL forms, file picking, `truncated` fallback, and error paths without a browser. `app.js` only wires the button: read field → `fetchGistText` → `handleAdd(content)` (which already reports the merge summary and queues hydration). A `gist.test.js` mirrors `imdb.test.js` conventions (injected `fetchImpl`).

**Alternative:** bury the fetch in `app.js`'s IIFE like the hydration queue — rejected; the queue is glue, this is parseable network logic with real edge cases.

### 4. Merge semantics — reuse the pipeline, clear never

`handleAdd` already runs `board.addFromText` (dedupe, 9-cap, order) and reports added/duplicates/invalid/skipped. Gist import is literally a new text source feeding it; no new board behavior. A failed fetch leaves the board untouched (checked before any add).

### 5. Stable grid order — delete the display sort

`board.list()` is already insertion-ordered; `app.js`'s render currently sorts a copy by allocated votes. The fix is to render in insertion order and delete the vote-sort. The winner computation moves to a pure max-by-(votes, earliest-added) over the list, feeding the hero pane and the leader's glow exactly as today — those still move live; only cards stay put. The hydration queue, focus handling, and remove flow are untouched. Board tests gain a lock: "allocating votes does not change `board.list()` order".

### 6. Favicon — inline SVG star mark

A small `favicon.svg` (★ glyph in `--accent` cyan on the dark `#0d1017` rounded square, matching `.brand__mark`) referenced with `<link rel="icon" type="image/svg+xml" href="favicon.svg">`. Inline data-URI was considered and dropped: a real file keeps `index.html` readable and caches properly.

## Risks / Trade-offs

- [Gist owner edits the list mid-party] → Re-import merges by design; duplicates are reported, nothing is silently removed. Replace semantics were rejected (would wipe votes).
- [GitHub API unreachable or rate-limited (60/hr/IP)] → Same error-message path as a failed TXT read; board unchanged. CDN raw fallback covers truncation, not outages.
- [Gist text file contains junk or non-IMDb lines] → `extractImdbIds` only lifts `tt\d{7,10}` patterns; junk lines are "invalid" in the summary, never cards.
- [Unmarshalled HTML from gist?] → No: gist text only ever flows through the ID-extraction regex; it is never injected as markup.
- [Stable order lets a popular film sit at the bottom] → Accepted deliberately (user request); the winner hero, glow, and Show the winner still make the leader unmistakable.
- [`movie-catalog` retirement leaves a one-line Purpose pointing at nothing] → The whole main spec is deleted at archive (all requirements REMOVED), so no orphan file remains.
