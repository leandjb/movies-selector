# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS — plain `index.html`, `styles.css`, `src/` (`imdb.js`, `queue.js`, `board.js`, `gist.js`, `winner.js`, `topbar.js`, `toast.js`, `app.js`) and `tests/` (`unit/`, `api/`, `integration/`, `ui/`, `helpers/`). No framework, no build step, no backend (confirmed by the user; YAGNI).

## Users

Friends and housemates picking what to watch on movie night. They land on one page, browse a curated catalog, watch trailers, and vote — the crowd's ranking tells them which movie wins the night. Casual, fun, social tone.

## Product Purpose

A single landing page where visitors build a 9-movie shortlist from IMDb links and vote. Browsing matters as much as voting: each movie card shows the poster, title, year, and an IMDb link, and votes decide the winner.

## Positioning

A crowd-ranked shortlist where the IMDb poster, title, and year make the browsing itself the case for each film. The page fetches metadata at runtime from the IMDb suggestion API (direct-first, proxy fallback), so the shortlist is live and the page loads instantly.

## Operating Context

- One static page, opened directly in a browser or served from any static host.
- Votes persist per browser via `localStorage`; no accounts, no server round-trip.
- IMDb metadata is fetched at runtime (direct suggestion API, fallback proxies) and hydrated into cards; failed fetches show placeholders.
- The grid stays in insertion order; the winner is decided on reveal via vote tally.

## Capabilities and Constraints

- Movie cards show: poster, title, year, IMDb link (fetched live).
- Up/down voting with toggle semantics (vote once per movie per browser; clicking again removes the vote).
- Grid in insertion order; winner decided on reveal via vote tally.
- Fetches IMDb metadata at runtime via the suggestion API (direct request, then rotated proxy fallback with bounded retries; see `metadata-fetch` spec).
- Vanilla HTML/CSS/JS; no framework, bundler, or runtime dependencies (deliberate YAGNI).
- Board persists per browser via `localStorage`; gist import merges into the current board.

## Brand Commitments

No pre-existing brand, name, or assets. Established tone: casual, fun, social — a page for a group settling the movie-night debate.

Visual direction pinned by the user: **modern glass orange** (frosted glass panels over a deep *warm-tinted* dark gradient lit by ember glow, one amber accent). The status of the night lives in a glass navbar (board count, missing-votes pill, reveal) and feedback arrives as transient toasts. This replaces the earlier darkroom, Googie, and violet-glass worlds and is the standing look — do not re-roll or restyle without a new explicit instruction.

## Evidence on Hand

- The board is built live from IMDb links; posters/titles/years are fetched at runtime and cached per session.
- No testimonials, press, user data, or imagery beyond the poster URLs — future work must not fabricate any of these.

## Product Principles

1. Browsing is the pitch — posters, titles, and years must carry the case for each movie.
2. The ranking is the point — voting is one click and the order updates instantly.
3. No friction — no accounts, no sign-up, no server; open the page and vote.
4. Honest data — metadata is fetched live from IMDb; never fake titles, years, or posters.
5. Fast and light — vanilla files, zero dependencies, loads anywhere.

## Accessibility & Inclusion

Keyboard-operable vote and modal controls, `aria-pressed`/`aria-label` on vote buttons, `aria-live` score announcements, and sufficient color contrast — enforced via the design audit before shipping.
