## Context

See proposal.md — Why. The extraction happens in exactly one place: `src/imdb.js` `extractImdbIds`, whose `LINK_RE` regex demands `title/` immediately after `imdb.com/`. Both paste and gist/TXT import funnel through `board.addFromText` → `extractImdbIds` (board.js:79), and everything downstream (hydration via the suggestion API, the canonical IMDb badge link) operates on the bare `tt` ID. Locale only matters at extraction time.

## Goals / Non-Goals

**Goals:**

- Accept localized IMDb title links in the shared extractor with a minimal, contained change.
- Keep rejection rules as tight as they are today (non-IMDb domains, bare IDs).
- Preserve the existing ID-based dedup: locale variants must collapse to the same movie.

**Non-Goals:**

- Not normalizing or persisting the pasted URL — stored movies keep bare `tt` IDs and badges keep building canonical links.
- Not accepting bare `tt` IDs (spec requires a real link).
- Not supporting multi-segment path prefixes (`imdb.com/a/b/title/...`).

## Decisions

**1. Allow any single optional path segment between the domain and `title/`.**

Chosen regex shape: `imdb\.com\/(?:[^\/\s]+\/)?title\/(tt\d{7,10})` (keeping the `tt\d{7,10}` ID group and `gi` behavior; `extractImdbIds` already clones the regex per call via `LINK_RE.source`, so that pattern stays).

Alternative considered — locale-list pattern `imdb\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?title\/` (precise `it`/`es`/`pt-br` codes). Rejected: both options capture the identical `tt` ID, so the narrower pattern buys nothing behaviorally, while the any-segment form is immune to IMDb introducing other interstitial segments. An accidental match on a garbage segment still yields the correct movie ID, so the looser pattern has no practical downside.

**2. No per-entry-point changes.** Paste and import share `addFromText`; fixing the extractor once covers both. No changes to board, storage, hydration, or UI code.

**3. Test coverage pins both sides of the boundary.** Unit cases in `tests/unit/imdb.test.js` (`extractImdbIds` suite): two-letter locales (`it`, `es`), region locales (`pt-br`), dedup across locale variants, and a non-IMDb domain with a locale segment still rejected. One integration case through `board.addFromText` proves the paste/import path end-to-end.

## Risks / Trade-offs

- [Looser regex matches IMDb URLs with an unexpected single segment] → Accepted deliberately: the captured `tt` ID is the canonical key, so any such match still adds the correct movie; behavior can only be "more accepting", never wrong.
- [IMDb someday uses multi-segment prefixes] → The pattern stays one optional segment; widening later is the same one-line change.
