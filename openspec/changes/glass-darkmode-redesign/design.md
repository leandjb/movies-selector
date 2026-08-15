## Context

The page is a four-file vanilla site (`index.html`, `styles.css`, `app.js`, `movies.js`) with a shipped darkroom visual world, a localStorage voting system, and a trailer modal. See proposal.md for the motivation. The user has pinned the new visual direction explicitly — "modern darkmode with glassmorphism" — which per the Impeccable workflow overrides the concept roll (a pinned direction beats the roll). PRODUCT.md and the Impeccable skill remain in place; the workflow reuses `/impeccable init` context and documents the new world in DESIGN.md at finish.

## Goals / Non-Goals

**Goals:**
- A modern dark-mode glassmorphism single page: deep gradient ground with ambient glow, frosted glass panels (translucent fills + backdrop blur), hairline glass borders, one neon accent.
- A vote budget section where the visitor sets the total number of votes to distribute, with per-movie counters that allocate/return votes within the budget, updating live.
- A live winner highlight (most allocated votes) plus a Show Winner button that reveals the winner with a celebration animation.
- Trailers open as direct YouTube links in new tabs — no modal.
- Catalog replaced with the six specified films.
- Zero build step preserved; no new dependencies, no backend, no auth.

**Non-Goals:**
- No in-page video player or modal of any kind.
- No authentication, accounts, or server-side persistence.
- No framework or build tooling.
- No movies outside the six-film roster.

## Decisions

### 1. Visual world — user-pinned modern dark glass
Run through the Impeccable skill with the pinned direction (no concept roll): a dark, glassy, modern surface. Working tokens (final values set at implementation within DESIGN.md's documented scale):
- Ground: deep dark gradient (near-black, tinted — never pure black) with two or three large ambient glow blobs (muted indigo/violet + one neon accent) for the "glass over light" feel.
- Panels: `rgba` white fills at low opacity with `backdrop-filter: blur()` + a 1px translucent white border; a subtle top-edge highlight (inset 1px white) for the glass lip.
- Accent: one neon color (e.g., electric violet/cyan family) reserved for interactive states, the winner glow, and focus.
- Type: modern geometric sans for display (avoid the banned defaults — not Inter; e.g., Sora) over Archivo body; keep the existing copy.
- Glass legibility rule: frosted panels behind text must stay dark enough to hold ≥4.5:1 contrast; posters stay inside clear (non-blurred) wells so artwork isn't fogged.
- Winner: the top card gets an accent glow + a "WINNER" chip; also conveyed by layout/badge, not color alone.
- Motion: soft ease-out entrances, gentle glow pulse on the winner; `prefers-reduced-motion` respected; no bounce.
- `backdrop-filter` fallback: panels fall back to a more opaque solid tint where blur is unsupported, preserving contrast.

**Rationale:** glassmorphism is the user's explicit choice; the contrast/legibility guardrails are what keep it from becoming unreadable slop.
**Alternatives considered:** the previous darkroom world (rejected by the user), re-rolling the concept deck (rejected — direction is pinned).

### 2. Trailer — direct YouTube link, modal removed
- Delete the booth/modal markup from `index.html` and its entire JS block (open/close, focus trap, Escape handling, iframe src clearing, `booth-watch` fallback).
- The card's trailer control becomes `<a class="menu__trailer" href="{trailerWatchUrl}" target="_blank" rel="noopener noreferrer">`.
- Movies without a trailer link render no control (spec scenario).
- Trailer IDs are verified at build time via YouTube oEmbed (as in the previous change) and only verified IDs ship.

**Rationale:** the modal proved unreliable; a plain link is the user's stated fix and removes ~60 lines of JS.

### 3. Voting — budgeted allocation + winner celebration
- Replace the per-movie up/down toggle model entirely.
- **Budget section:** a control (e.g., a stepper, 3–20, default 10) where the visitor sets the total number of votes they can distribute, with an available-votes readout ("N votes left").
- **Per-movie counters:** each card gets a counter with **+ / − controls**. `+` allocates one vote to that movie (capped by the remaining budget); `−` returns one vote to the pool. Counters update live via the existing render-on-vote architecture.
- **State model:** the `localStorage` payload under `movieVotes.v1` becomes `{ budget, byId: { <movieId>: allocatedVotes } }`. Read defensively; on parse/validation failure, reset rather than migrate. `initialVotes` seeding is dropped — the budget replaces it.
- **Ranking:** by allocated votes desc, then the existing id tie-break — winner is always deterministic.
- **Winner highlight:** the ranked list's first entry keeps the `winner` class (accent glow + "WINNER" chip) and follows the leader live; the aria-live board note announces it ("★ {title} is winning — X votes").
- **Celebration button:** a "Show winner" button triggers the celebration moment — the winner card is announced and animated (accent burst: glow pulse + brief scale, a few non-flashing particles), then settles back. `prefers-reduced-motion` collapses it to a static reveal with no animation.

**Rationale:** this is the user's specified interaction — decide the vote count, then allocate votes per movie, then celebrate the winner. It still falls out of the existing render-on-vote architecture, with the state model widened to budget + allocations.

### 4. Data — the six-film roster
Replace `MOVIES` with exactly these entries (fields unchanged: `id`, `title`, `year`, `imdb`, `rt`, `initialVotes`, `posterUrl`, `trailerEmbedUrl`/`trailerWatchUrl`):
- Her (2013) — IMDb 8.0, RT ~94 (curated at implementation)
- Project Hail Mary (2026) — recent release; verify score at implementation, placeholder if none
- One Battle After Another (2025) — verify score at implementation, placeholder if none
- Crimson Tide (1995) — IMDb 7.3, RT ~88 (curated at implementation)
- The Hot Chick (2002) — IMDb 5.5, RT ~37 (curated at implementation)
- The Grand Budapest Hotel (2014) — IMDb 8.1, RT ~92

- `imdb`/`rt` are nullable: a `null` renders the spec's placeholder ("—"), never a fabricated number.
- Posters resolve at build time from TMDB page `og:image` (media.themoviedb.org) and each URL is verified to return 200; **the poster must also depict the correct film**. The initial resolution returned wrong posters for The Hot Chick and Crimson Tide, so those two are re-resolved against TMDB/Wikipedia and re-verified (correct film + 200) before shipping. The existing `onerror` fallback placeholder stays.
- Trailers resolve from official YouTube videos verified via oEmbed; unreleased/obscure titles may legitimately have no trailer (spec handles it).
- `initialVotes` seeds the ranking so the page doesn't start flat; values chosen at implementation.

**Rationale:** same proven data pipeline as the previous change (no API keys, fully verified).

## Risks / Trade-offs

- [Glassmorphism hurts legibility (blur + low-opacity fills over busy posters)] → Panels hold ≥4.5:1 contrast; posters live in unblurred wells; audit checks contrast.
- [`backdrop-filter` unsupported (older browsers)] → Panels fall back to a more opaque translucent fill; page still reads.
- [Unreleased films lack scores or trailers] → Spec mandates placeholders and no-control states; verified data only.
- [Winner tie ambiguity] → Deterministic id tie-break inherited from ranking; no ambiguous states.
- [Celebration animation is noisy or ignores reduced motion] → `prefers-reduced-motion` collapses it to a static reveal; the burst is brief, non-flashing, accent-only.
- [Direct links leave the page] → `target="_blank"` with `rel="noopener noreferrer"`; expected and intended per the user's requirement.

## Migration Plan

In-place replacement of the four files. The `movieVotes.v1` payload changes shape (budget + per-movie allocations replace the toggle deltas), so existing stored votes are reset defensively on read rather than migrated. DESIGN.md and `.impeccable/design.json` are rewritten at finish to document the glass world.

## Open Questions

- Exact poster URLs, trailer IDs, and score values for the six films — resolved at implementation against TMDB/oEmbed/IMDb; doesn't change specs, approach, or tasks.
- Hero copy/branding: keep the existing page copy and restyle, or rename with the new world — cosmetic, decided during implementation.
- Accent color choice within the neon family — a design-time decision with no spec impact.
