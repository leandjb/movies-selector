# metadata-fetch Specification

## Purpose

Defines how the page fetches IMDb metadata for board movies: a hydration pipeline that keeps bulk imports fast without tripping proxy rate limits, through bounded concurrency, proxy round-robin, request deduplication, caching, and respectful retry behavior.

## Requirements

### Requirement: Metadata fetching uses a bounded-concurrency queue
The page SHALL fetch movie details through a queue that keeps at most a small fixed number of details requests in flight at a time (bounded concurrency, greater than one) and SHALL pace the start of each request with a short delay, so a bulk import never fires a simultaneous burst. When the fallback proxy chain is used, consecutive fallback chains SHALL start at successive proxies in round-robin fashion, so no single proxy receives the whole batch; requests that succeed directly SHALL NOT touch any proxy. Every movie awaiting details SHALL be fetched through this same queue, including movies whose details are retried when the page loads.

#### Scenario: Bulk import fills the concurrency window
- **WHEN** a gist import adds several movies at once
- **THEN** their details are fetched with more than one request in flight, up to the queue's fixed bound, and never more than that bound

#### Scenario: Consecutive requests rotate across proxies
- **WHEN** the fallback proxy chain runs for several movies in the same session
- **THEN** their fallback chains start at successive proxies in rotation rather than hammering one proxy with the whole batch

#### Scenario: Direct requests bypass the proxy chain
- **WHEN** a movie's details are fetched and the direct request succeeds
- **THEN** no proxy receives any request for that movie

#### Scenario: Reload retry uses the queue
- **WHEN** the page loads with movies whose details never loaded
- **THEN** their retries are fetched through the same bounded-concurrency queue

### Requirement: Duplicate metadata requests are deduplicated and cached
The pipeline SHALL deduplicate concurrent fetches for the same movie ID so only one network request runs for that ID, and SHALL serve repeat requests for the same movie ID from a per-session cache instead of refetching, while the cached value remains valid within the page session.

#### Scenario: Concurrent fetches for the same movie share one request
- **WHEN** two fetches for the same movie ID start before either completes
- **THEN** only one network request is issued and both callers receive the same result

#### Scenario: A re-added movie is served from cache
- **WHEN** a movie that was already hydrated in this session is removed and added again
- **THEN** its details are served from the session cache without a new network request

### Requirement: Rate-limit responses are respected and retried gently
When a details request fails with a rate-limit response, the pipeline SHALL honor the response's `Retry-After` delay when one is present (falling back to the bounded exponential backoff when absent), and SHALL retry the request a bounded number of times before advancing to the next proxy. A gateway failure from a proxy (request timeout or bad gateway) SHALL advance to the next source immediately instead of retrying the same proxy. The total number of network requests issued for one movie SHALL stay within a small fixed bound regardless of how many sources fail.

#### Scenario: Retry-After delays the retry
- **WHEN** a proxy answers a details request with 429 and a `Retry-After` delay
- **THEN** the retry against that path waits at least that delay before repeating the request

#### Scenario: Missing Retry-After falls back to backoff
- **WHEN** a rate-limit response carries no `Retry-After` delay
- **THEN** the retry waits a bounded, increasing backoff delay before repeating

#### Scenario: Bounded retries end in placeholders
- **WHEN** every attempt for a movie fails even after retries
- **THEN** the card remains with placeholder dashes for the missing values and the queue moves on to the next movie

#### Scenario: Proxy gateway failures advance instead of retrying
- **WHEN** a proxy answers a details request with a gateway timeout or bad-gateway status
- **THEN** the pipeline advances to the next source without retrying the same proxy

#### Scenario: Retry amplification is bounded
- **WHEN** every source for a movie keeps failing
- **THEN** the total requests issued for that movie never exceeds a small fixed bound

### Requirement: Fetching starts with a direct suggestion request before any proxy fallback
The pipeline SHALL resolve each movie's details by fetching the IMDb suggestion API directly from the browser first (title, year, poster), without any intermediary proxy. Only after a direct failure (network error, blocked request, timeout, or unusable response) SHALL the pipeline fall back to the proxy chain for the same endpoint. The pipeline SHALL NOT attempt providers known to be dead, and a source that yields no usable fields SHALL advance the chain. If every source fails, the card degrades to placeholder dashes and MUST NOT display fabricated data.

#### Scenario: Suggestion API alone hydrates the card
- **WHEN** the direct suggestion request returns usable fields for a movie
- **THEN** the card hydrates with title, year, and poster, and no other request is made for that movie

#### Scenario: Direct failure falls back to the proxy chain
- **WHEN** the direct suggestion request fails before returning usable fields
- **THEN** the same endpoint is retried through the fallback proxy chain, and its first usable result hydrates the card

#### Scenario: No fabricated data on total failure
- **WHEN** every source fails for a movie
- **THEN** the card shows placeholder dashes and no invented title, year, or poster
