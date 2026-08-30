## Context

A static page — no server, no build step, no frameworks. `app.js` renders cards from a hardcoded `MOVIES` array in `movies.js`, votes live in `localStorage` under `movieVotes.v1` keyed by movie id, and the grid is a `repeat(3, 1fr)` glass layout (3×2 today; 9 cards make it a natural 3×3). Network reality (verified during exploration): IMDb sends no CORS headers on any browser-reachable endpoint, and its suggestion API has no rating field — so fetched metadata must come from a third-party, keyless API. Design constraints live in `.impeccable/design.json`: one cyan accent reserved for live decisions, tinted night (`#07090d`, never pure black), frosted panes with top-edge highlights, Sora/Archivo only, `cubic-bezier(0.22, 1, 0.36, 1)` for all motion.

## Goals / Non-Goals

**Goals:**

- One shared add-pipeline serving both the paste field and the TXT import, with identical validation, dedupe, cap, and feedback behavior.
- Modules pure enough for Jest unit tests plus a real integration test across them (parse → board state → persistence) with injected `fetch`/storage — no browser needed.
- Graceful degradation: a card always appears immediately; missing details show placeholders, never fabricated numbers.
- New UI built strictly from existing tokens/typography/motion — zero palette drift.

**Non-Goals:**

- No server, no proxy of our own, no build pipeline.
- No Rotten Tomatoes or trailer data for user-added movies (no source exists; card drops both controls).
- No editing/removing of individual cards (only the all-or-nothing clear).
- No OMDb or other keyed API.

## Decisions

### D1 — Data source: `api.imdbapi.dev` primary, IMDb-page JSON-LD fallback
`GET https://api.imdbapi.dev/titles/{ttId}` (keyless, CORS-friendly) normalized into `{ id, title, year, rating, posterUrl }`. The live response uses IMDb-style **nested** fields — `titleText.text` / `originalTitleText.text`, `startYear` or `releaseDate.year` (an object), `ratings.aggregateRating` (plural key), `primaryImage.url` — with legacy flat fields (`primaryTitle`, `title`, `imDbRating`, `image`) kept as normalization fallbacks. `fetchTitle` runs a **provider chain**: if the API is unreachable, returns an error, or yields no usable fields, the same data is read from IMDb's own title-page `<script type="application/ld+json">` block (`name`, `image`, `datePublished`, `aggregateRating.ratingValue`) fetched through public CORS proxies (allorigins raw, then corsproxy.io). A response with all fields null counts as a provider failure and moves the chain on. Any missing field still renders as the existing `—` placeholder.
*Alternatives*: IMDb direct/suggestion API — no CORS (verified) and no rating; OMDb — requires an account key, violating the page's "no accounts" identity. The proxy fallback was previously deferred as "addable later"; browser testing showed the primary alone was not enough, so it was added.

### D2 — One pipeline, two entrances
`board.addFromText(raw)` is the only way cards enter the board: extract tt-IDs (tolerant, order-preserving) → dedupe within the input → dedupe against the board → cap to free slots → create placeholder cards synchronously → hydrate asynchronously → persist. The paste field calls it with one line; the TXT import with the whole file. Both report through the same summary channel. Duplicate detection happens at ID level, so rapid resubmits can't slip past while a fetch is in flight.
*Alternative*: separate paste/import flows — rejected: duplicated rules, drift-prone feedback.

### D3 — Module split for testability
- `imdb.js` — `extractImdbIds(text)` (regex `imdb\.com\/title\/(tt\d{7,10})`, case-insensitive, optional scheme/subdomain; surrounding text ignored; bare `tt` IDs rejected — only real links count) and `fetchTitle(id, fetchImpl)` with fetch injected. Zero DOM.
- `board.js` — plain state machine: `{ movies, MAX_CARDS }`, `addFromText`, `hydrate(id, details)`, `clear`, `toJSON`/`fromJSON`; storage injected. Zero DOM.
- `app.js` — DOM glue only: render, toolbar/modal wiring, aria-live feedback, skeleton states.
`movies.js` is deleted. Jest tests import the pure modules directly (jsdom for the integration test's storage), which is exactly the unit + between-modules coverage requested.

### D4 — Persistence shape
Board state persists under a new key `shortlistBoard.v1` (array of normalized movies with their fetch status); votes stay in `movieVotes.v1`, which already keys by id — tt-IDs are just the new id space. On boot, restored movies rehydrate; movies still missing details are retried once. Orphaned vote entries (old slug ids) are pruned on boot so ranking logic only sees board ids. Clear-all removes both keys' relevant data. Storage access stays guarded (try/catch) as today — an unavailable storage degrades to a session-only board.
*Alternative*: one merged key — rejected: pointless migration risk for existing vote persistence.

### D5 — Optimistic cards with three states
Each movie carries `status: "loading" | "ready" | "error"`. `loading` renders the existing poster well with a skeleton shimmer and dash placeholders; `ready` renders full fields (RT badge and trailer link removed from `cardHtml` everywhere); `error` keeps the card with dashes and an aria-live hint. Hydration runs sequentially (≤9 items; simple, deterministic error attribution). The existing `esc()` and poster `onerror` fallback apply to all fetched data — API responses are untrusted input.

### D6 — Clear-all confirmation modal
A single glass dialog: `role="dialog"`, `aria-modal="true"`, labelled by its title; focus trapped on open (Tab cycles within), Esc and backdrop-click cancel, focus restored to the trigger on close. Confirm empties the board and its votes in one action. Styling follows the design rules: frosted pane with glass lip, tinted scrim over the page, Sora title / Archivo body, standard ease curve. "Clear all" itself stays a frosted glass button — the one-light rule forbids introducing a second saturated "danger" color; the wording plus the confirm step carry the destructive weight. Button is disabled when the board is empty.

### D7 — Cap and feedback UX
A frosted counter pill `n / 9` in the new toolbar (Sora label per design meta). When full: paste input and Add button disabled, file import still selectable (it fills nothing and reports why) — the summary, not a color change, communicates the state. Feedback renders in an `aria-live="polite"` region under the toolbar: import summaries (`Imported 5 · 2 duplicates · 1 invalid · 1 skipped (board full)`), errors, and clear confirmations. Cyan is never used for errors — muted text keeps the one-light rule.

### D8 — Empty board state
With zero movies the grid shows one frosted empty pane ("Paste an IMDb link or import a .txt to build tonight's shortlist"), the hero winner shows its existing star placeholder with an em-dash title, and "Show the winner" is disabled. The `has-voted` body class is not applied on an empty first render, so the entrance animation plays for the first added card.

### D9 — Toolbar placement
The new "Add movies" toolbar is a glass panel between the board head and the grid: paste input + Add (primary, cyan — it's the page's live decision), "Import .txt" label over a hidden `input[type=file]` accepting `.txt,text/plain`, the counter pill, and the "Clear all" glass button. Desktop single row, wrapping columns on small screens; no new breakpoints needed.

## Risks / Trade-offs

- [api.imdbapi.dev down, rate-limited, or unreachable from the user's network] → `fetchTitle` moves down the provider chain to IMDb's page JSON-LD via CORS proxies; cards still appear instantly and the board remains votable with placeholders if everything fails.
- [API response shape drift] → Normalization reads the documented nested shape plus legacy flat fallbacks; a usable-field check treats an all-null payload as a provider failure and tries the next provider. A total failure can only degrade a card to placeholders, never crash the page or fabricate data.
- [Public CORS proxies (allorigins/corsproxy) are third-party and occasionally flaky] → They are the fallback, not the primary; each is tried in turn and IMDb may still 403 a proxy intermittently — the card then shows placeholders and auto-retries on the next page load.
- [Scrim-modal focus edge cases (screen readers, Tab cycling)] → Follow the standard trap-and-restore pattern with Esc/backdrop/cancel; covered in the integration test for the modal wiring.
- [Large TXT files (thousands of lines)] → Parsing caps work at free slots after dedupe; scanning is a single linear pass, no per-line DOM work.
- [Users expect bare `tt…` IDs or non-English IMDb domains to work] → Parser accepts any subdomain/scheme of imdb.com title URLs only; the error message explains the accepted format. Spec-true and unambiguous.

## Migration Plan

No server deploy — replace `index.html`/`styles.css`/`app.js` contents, add `imdb.js`/`board.js`, delete `movies.js`, wire the `test` script. Rollback is a git revert. Old persisted vote entries under slug ids are pruned on first boot (D4); no user data is migrated because the old catalog never came from user input.

## Open Questions

None blocking. The live response shape is now confirmed from the provider's published documentation (nested IMDb-style fields) and the normalizer covers it plus legacy shapes. The sandbox still cannot reach the API, so a one-time in-browser check of the full chain (paste a link → card fills) is the remaining human verification step.
