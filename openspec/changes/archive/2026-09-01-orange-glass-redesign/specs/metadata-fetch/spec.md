## Purpose

Defines how the page fetches IMDb metadata for board movies: a hydration pipeline that keeps bulk imports fast without tripping proxy rate limits, through bounded concurrency, proxy round-robin, request deduplication, caching, and respectful retry behavior.

## ADDED Requirements

### Requirement: Metadata fetching uses a bounded-concurrency queue
The page SHALL fetch movie details through a queue that keeps at most a small fixed number of details requests in flight at a time (bounded concurrency, greater than one) and SHALL distribute consecutive requests across the available CORS proxies in round-robin fashion, so no single proxy receives a burst of consecutive requests. Every movie awaiting details SHALL be fetched through this same queue, including movies whose details are retried when the page loads.

#### Scenario: Bulk import fills the concurrency window
- **WHEN** a gist import adds several movies at once
- **THEN** their details are fetched with more than one request in flight, up to the queue's fixed bound, and never more than that bound

#### Scenario: Consecutive requests rotate across proxies
- **WHEN** the queue issues requests for several movies back to back
- **THEN** consecutive requests are sent through different proxies in rotation rather than hammering one proxy with the whole batch

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
When a details request fails with a rate-limit response, the pipeline SHALL honor the response's `Retry-After` delay when one is present (falling back to the bounded exponential backoff when absent), and SHALL retry the request a bounded number of times before advancing to the next proxy. Timeout, server-error, and network failures SHALL retry with the same bounded, increasing delay.

#### Scenario: Retry-After delays the retry
- **WHEN** a proxy answers a details request with 429 and a `Retry-After` delay
- **THEN** the retry against that path waits at least that delay before repeating the request

#### Scenario: Missing Retry-After falls back to backoff
- **WHEN** a rate-limit response carries no `Retry-After` delay
- **THEN** the retry waits a bounded, increasing backoff delay before repeating

#### Scenario: Bounded retries end in placeholders
- **WHEN** every attempt for a movie fails even after retries
- **THEN** the card remains with placeholder dashes for the missing values and the queue moves on to the next movie

### Requirement: Provider chain starts with the suggestion API and skips dead providers
The pipeline SHALL resolve each movie's details through an ordered provider chain that tries the lightweight IMDb suggestion API first (title, year, poster) and the IMDb title-page JSON-LD second (adds the rating). The chain SHALL NOT attempt providers known to be dead, and a provider that yields no usable fields SHALL advance the chain. If every provider fails, the card degrades to placeholder dashes and MUST NOT display fabricated data.

#### Scenario: Suggestion API alone hydrates the card
- **WHEN** the suggestion API returns usable fields for a movie
- **THEN** the card hydrates with title, year, and poster without touching the heavier title-page provider

#### Scenario: Rating is added from the title page
- **WHEN** the suggestion result lacks a rating and the title-page JSON-LD provides one
- **THEN** the card's rating is filled from the JSON-LD data

#### Scenario: No fabricated data on total failure
- **WHEN** every provider fails for a movie
- **THEN** the card shows placeholder dashes and no invented title, year, rating, or poster
