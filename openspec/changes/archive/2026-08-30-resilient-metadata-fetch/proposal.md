# Resilient Metadata Fetch

## Why

Bulk-importing a movie list (e.g. `movies_list.txt`, ~10 titles) fires roughly 9 network requests per movie in a single burst (~90 requests in seconds). Public CORS proxies respond with 429 (rate limit), 500/502/408 (overload/timeout), and every corsproxy.io call is a wasted 401, so most cards end up stuck on placeholders even though the data sources themselves are reachable one request at a time. A single pasted link works; only bulk fan-out fails.

## What Changes

- Route all metadata fetching (paste, file import, and boot-time retry of unresolved movies) through a client-side fetch queue with bounded concurrency (1 in-flight request at a time) and a small randomized stagger between movies.
- Replace the parallel proxy race with sequential proxy fallback per provider, so a successful first proxy costs 1 request instead of 4.
- Retry individual failed attempts (429, 408, 5xx, network errors) with capped exponential backoff and jitter before moving to the next proxy/provider.
- Remove corsproxy.io from the proxy list (keyless requests always return 401 — pure waste).
- Reorder providers to suggestion-first, then IMDb page JSON-LD (needed only for the rating), then the legacy api.imdbapi.dev endpoint: the suggestion endpoint is lightweight, IMDb-owned, and not bot-blocked, so most movies hydrate with 1 request.
- Keep all existing user-visible behavior: cards still hydrate or degrade to placeholders after bounded retries; no fabricated data.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shortlist-import`: Add a requirement that metadata fetching is throttled, staggered, and retried with backoff, so bulk imports hydrate without tripping provider rate limits; failed fetches still end in placeholder cards after bounded retries.

## Impact

- `imdb.js`: provider chain rewritten from parallel race to sequential fallback with per-attempt backoff/retry; corsproxy.io removed; provider order changed (suggestion first).
- `app.js`: hydration calls go through a new queue helper (shared by paste, file import, and boot retry of unresolved movies) instead of unbounded `Promise` fan-out.
- `imdb.test.js`, `integration.test.js`: tests updated for sequential fallback, retry/backoff, and queue-serialized hydration.
- No new dependencies; no backend; behavior contract for card display, limits, and persistence unchanged.
