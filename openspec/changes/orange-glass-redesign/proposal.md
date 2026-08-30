## Why

The page wears the violet "Glass Over Night" skin and stacks its controls in a mid-page toolbar, so the two actions that matter — reveal the winner and see how many votes are missing — live below the fold, and bulk imports crawl: metadata hydration is strictly serial (one request in flight, 300–800 ms gaps), which makes a 9-movie gist import take tens of seconds and still trips proxy 429s. The user has pinned a new direction: a modern orange glass redesign (per the provided mockup) with the status surface moved into a glass navbar, plus a faster, gentler fetch pipeline and a test suite that covers the new modules TDD-first.

## What Changes

- **Visual reskin**: violet → amber/orange glassmorphism across the page (navbar, hero, cards, modals, footer, favicon); DESIGN.md and `.impeccable/design.json` regenerate (design.json is stale — still describes the cyan era). Typography pair (Sora/Archivo), glass construction rules, and accessibility floors carry over.
- **Navbar absorbs the status surface** (same frosted style): brand + board-count chip on the left; votes-missing pill and the "Show winner" button on the right (pill right-side only). The below-grid reveal section and the mid-page status bar disappear.
- **Hero becomes two columns**: left keeps kicker/title/lede/CTA; right stacks the vote budget (stepper + progress bar with votes left), the add-by-IMDb-link form, and the gist import form. The board headline section is dropped.
- **Toast feedback**: import/vote/reveal messages render as transient toasts instead of the inline status line.
- **Card badges gain year + IMDb ↗ external link**; per-card remove control stays (revealed on hover/keyboard focus).
- **BREAKING: TXT file import is removed.** Gist import becomes the only bulk path; the file picker, FileReader flow, and its spec requirement/tests go away.
- **Fetch pipeline rewrite**: hydration queue extracted from app.js into `queue.js` with bounded concurrency and proxy round-robin (no single proxy sees a burst), in-flight + per-session dedup cache, `Retry-After` honored on 429, dead `api.imdbapi.dev` provider deleted. New `topbar.js` (navbar status math) and `toast.js` modules.
- **Test battery refactor, TDD-first**: new Jest suites for queue/topbar/toast and new integration flows (parallel hydration, cache dedup, proxy failover, navbar pill, toasts); existing DOM suites rewritten for the new layout; harness `REQUIRED_IDS` updated; TXT-import tests deleted.

## Capabilities

### New Capabilities

- `metadata-fetch`: the hydration pipeline — bounded-concurrency queue with proxy round-robin, in-flight/session dedup cache, 429/`Retry-After` handling, provider chain (suggestion → JSON-LD), placeholder degradation on total failure.

### Modified Capabilities

- `shortlist-import`: TXT import requirement removed; summary feedback re-delivered as toasts; "four dedicated sections" requirement replaced by navbar + hero control-column layout; metadata-throttling requirement moved to `metadata-fetch` (superseded); cards gain year + IMDb link badges; board-count chip moves to the navbar.
- `voting`: reveal control moves into the navbar with a persistent votes-missing pill; blocked reveals report via toast.

## Impact

- **Code**: `index.html` (full body restructure), `styles.css` (full retheme + new components), `app.js` (layout wiring, toast, navbar, queue extraction), new `queue.js` / `topbar.js` / `toast.js`, `imdb.js` (drop dead provider, expose round-robin + cache hooks), `favicon.svg` (amber). `board.js`, `gist.js`, `winner.js` logic unchanged.
- **Specs**: `openspec/specs/shortlist-import/spec.md`, `openspec/specs/voting/spec.md` amended; new `openspec/specs/metadata-fetch/spec.md`.
- **Docs**: DESIGN.md + `.impeccable/design.json` regenerated; PRODUCT.md visual-direction clause superseded (amber glass replaces violet).
- **Tests**: `tests/helpers/app-harness.js` (REQUIRED_IDS, router helpers), `sections.test.js` rewritten, TXT tests removed, new `queue.test.js` / `topbar.test.js` / `toast.test.js` + integration additions in `integration.test.js` / `pipeline.integration.test.js`.
- **No backend/deps changes**: still static vanilla JS, no build step; Jest stays the only dev tooling.
