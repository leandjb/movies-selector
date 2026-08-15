# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS — plain `index.html`, `styles.css`, `app.js`, `movies.js`. No framework, no build step, no backend (confirmed by the user; YAGNI).

## Users

Friends and housemates picking what to watch on movie night. They land on one page, browse a curated catalog, watch trailers, and vote — the crowd's ranking tells them which movie wins the night. Casual, fun, social tone.

## Product Purpose

A single landing page that ranks a curated catalog of great movies by visitor votes. Browsing matters as much as voting: each movie card shows the poster, title, year, IMDb score, Rotten Tomatoes score, and a playable trailer, and votes decide the order.

## Positioning

A crowd-ranked, curated movie catalog where the scores and trailers make the browsing itself the case for each film. The page doesn't fetch anything — every score, poster, and trailer is hand-curated, so the ranking is honest and the page loads instantly.

## Operating Context

- One static page, opened directly in a browser or served from any static host.
- Votes persist per browser via `localStorage`; no accounts, no server round-trip.
- Trailers play in an in-page modal; a "Watch on YouTube" fallback covers videos that disallow embedding.
- The grid re-sorts live by net score (upvotes minus downvotes).

## Capabilities and Constraints

- Movie cards show: poster, title, year, IMDb score (x.x/10), Rotten Tomatoes score (%), YouTube trailer button.
- Up/down voting with toggle semantics (vote once per movie per browser; clicking again removes the vote).
- Grid ranked by net score, highest first, stable tie-break.
- Curated static data only — no runtime APIs, no API keys, no live data fetching.
- Vanilla HTML/CSS/JS; no framework, bundler, or runtime dependencies (deliberate YAGNI).
- Undecided: the exact movie roster and poster URLs — chosen during implementation, safe to change later.

## Brand Commitments

No pre-existing brand, name, or assets. Established tone: casual, fun, social — a page for a group settling the movie-night debate.

Visual direction pinned by the user: **modern dark-mode glassmorphism** (frosted glass panels over a deep dark gradient, one neon accent). This replaces the earlier darkroom and Googie worlds and is the standing look — do not re-roll or restyle without a new explicit instruction.

## Evidence on Hand

- The curated catalog itself (movies.js) is the only real content; scores are hand-entered reference values.
- No testimonials, press, user data, or imagery beyond the poster/trailer URLs — future work must not fabricate any of these.

## Product Principles

1. Browsing is the pitch — posters, scores, and trailers must carry the case for each movie.
2. The ranking is the point — voting is one click and the order updates instantly.
3. No friction — no accounts, no sign-up, no server; open the page and vote.
4. Honest curation — scores and picks are curated by hand; never silently fetch or fake data.
5. Fast and light — vanilla files, zero dependencies, loads anywhere.

## Accessibility & Inclusion

Keyboard-operable vote and modal controls, `aria-pressed`/`aria-label` on vote buttons, `aria-live` score announcements, and sufficient color contrast — enforced via the design audit before shipping.
