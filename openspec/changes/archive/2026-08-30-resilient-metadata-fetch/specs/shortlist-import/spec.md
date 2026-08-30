# shortlist-import Delta

## ADDED Requirements

### Requirement: Metadata fetching is throttled and retried
The page SHALL fetch movie details through a queue that keeps at most one details request in flight at a time and SHALL wait a short randomized delay between fetching different movies. When an individual request fails with a rate-limit response, a timeout response, a server error, or a network error, the page SHALL retry that request with a bounded, increasing delay before falling back to the next data source. Every movie awaiting details SHALL be fetched through this same queue, including movies whose details are retried when the page loads.

#### Scenario: Bulk import does not burst
- **WHEN** a file import adds several movies at once
- **THEN** their details are fetched one movie at a time with a delay between movies, not all simultaneously

#### Scenario: Rate-limited or failed attempt is retried
- **WHEN** a details request fails with a rate-limit, timeout, server-error, or network failure
- **THEN** the page waits a bounded, increasing delay and retries before falling back to the next data source

#### Scenario: Bounded retries end in placeholders
- **WHEN** every attempt for a movie fails even after retries
- **THEN** the card remains with placeholder dashes for the missing values and the queue moves on to the next movie

#### Scenario: Reload retry uses the queue
- **WHEN** the page loads with movies whose details never loaded
- **THEN** their retries are also fetched one at a time through the same queue
