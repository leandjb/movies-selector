# Resilient Metadata Fetch — Design

## Context

`imdb.js` currently resolves each movie by racing 4 CORS proxies in parallel per provider (page JSON-LD → suggestion API → legacy `api.imdbapi.dev`), and `app.js` fires one `fetchTitle` per movie with no coordination. For a bulk import of N movies that is up to 9·N requests in a burst. Observed under `movies_list.txt` (~10 movies): Cloudflare worker proxies return 429, allorigins returns 500/502/408 under load, corsproxy.io always returns 401 (keyless), and `api.imdbapi.dev` remains dead (DNS `ERR_NAME_NOT_RESOLVED`). A single movie (~9 requests) survives; the burst does not. The provider chain lives entirely behind `window.Imdb.fetchTitle(id, fetchFn)`, so queueing can be introduced without touching `board.js` state logic.

## Goals / Non-Goals

**Goals:**
- Keep total in-flight metadata requests to 1 across the whole page (paste, file import, boot retry all share one queue).
- Cut the per-movie request count from ~9 to typically 1–2 via sequential proxy fallback and suggestion-first ordering.
- Survive transient 429/408/5xx/network failures with capped exponential backoff + jitter instead of failing the movie immediately.
- Preserve every existing user-visible behavior: immediate card creation, placeholder degradation, no fabricated data, 9-cap, persistence.

**Non-Goals:**
- No backend, no self-hosted proxy, no API keys (a keyed API like OMDb remains a possible future change).
- No persistent "permanently failed" state — unresolved cards stay retryable on reload, as today.
- No changes to board state machine, vote logic, cap enforcement, or card rendering.
- No UI for queue progress beyond existing loading placeholders.

## Decisions

- **D1 — One shared sequential queue, not per-import concurrency.** All hydration goes through a single FIFO queue with concurrency 1 and a 300–800 ms randomized gap between movies. Alternative considered: concurrency 2–3 (faster, but doubles burst pressure on the same proxy for zero functional gain — the queue exists to stay under rate limits). Placed in `app.js` as a small module-scope helper (it orchestrates UI calls; `imdb.js` stays a pure fetch library).
- **D2 — Sequential proxy fallback replaces the parallel race.** Try proxy 1 → on failure proxy 2 → etc., each with an 8 s timeout. Rationale: `Promise.any` racing was the main request multiplier (4 requests to learn what 1 could tell us); sequential costs 1 request when the first proxy works, and the queue hides added latency. Alternative considered: keep a 2-way race for latency — rejected: still 2× requests, and per-attempt timeout already bounds worst case.
- **D3 — Suggestion-first provider order.** `v3.sg.media-imdb.com` suggestion JSON is lightweight, IMDb-owned, and not bot-blocked (verified live, including for `tt29355505`); it resolves title/year/poster with one request for most movies. IMDb page JSON-LD (via proxies) runs second, only to add the rating; legacy `api.imdbapi.dev` stays last and self-heals if it ever returns.
- **D4 — Bounded retry with backoff and jitter, per attempt.** On 429, 408, any 5xx, or a rejected fetch: wait `min(1.5s · 2^attempt, 6s) + 0–500 ms jitter`, retry the same proxy, at most 2 retries per proxy before advancing. A movie is abandoned (placeholder) after ~6 failed requests across providers — bounded worst case ≈ 6 requests + ~15 s per movie, amortized by the queue. Retry-After headers are not honored (proxies rarely set them; fixed backoff is simpler and testable).
- **D5 — corsproxy.io removed from the proxy list.** Every keyless request returns 401; it only adds noise and a guaranteed failed request per provider. Remaining proxies: allorigins, codetabs, `test.cors.workers.dev`.
- **D6 — Boot retry reuses the queue.** The existing boot loop over `needsHydration()` movies enqueues instead of firing directly, so a reload with 10 unresolved movies can't re-create the burst. Cards already on the board from a previous session keep their existing card elements; only their fetches are serialized.

## Risks / Trade-offs

- [Slower bulk hydration: 10 movies ≈ 15–40 s instead of near-parallel] → Cards appear instantly and fill in progressively; loading placeholders already communicate this. Acceptable for a movie-night page.
- [A hanging proxy burns up to 8 s + 2 retries (~24 s) before fallback] → Timeouts are per attempt; the queue keeps everything else orderly; total per-movie budget stays bounded (~6 requests).
- [Public proxies can still all be down at once] → Same degradation as today (placeholders, retry next load); no regression, and request volume is now ~10× lower so quota-based outages become rarer.
- [Queue is fire-and-forget; a card cleared mid-queue would hydrate a detached movie] → Queue entries check `board.hasId(id)` before applying results, mirroring the existing boot-retry guard.

## Migration Plan

Single static-site deploy (file copy). No storage migration: persisted board shape is unchanged. Rollback = restore previous `imdb.js`/`app.js`; localStorage stays compatible both ways.

## Open Questions

None.
