## Why

Smart TV browsers (confirmed on LG webOS) have no right-click, no keyboard shortcut, and no reliable Clipboard API, so a visitor cannot paste a gist URL — or an IMDb link — into the import inputs. On the device most likely to display the board, the core "build the shortlist" flow is unusable.

## What Changes

- Add a paste control next to both text inputs (IMDb link and gist URL). Best-effort only: `navigator.clipboard.readText()` first, legacy `document.execCommand('paste')` second, and on any failure a guidance toast plus focusing the field (which summons the TV on-screen keyboard). It must never block or replace manual entry.
- Add a TV-first gist discovery flow: the visitor types a GitHub username, the page fetches that user's public gists from `api.github.com` (keyless, CORS-open, same trust model as the existing gist fetch), and shows a D-pad/keyboard-operable picklist of gists that contain a `.txt` file. Selecting one runs the existing gist import pipeline.
- Remember the last username in `localStorage` so repeat movie nights need zero typing. No username is hardcoded in the site; the username is typed at runtime and stored only in that visitor's browser.
- Existing gist URL / bare-ID entry stays exactly as it is.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shortlist-import`: The "Import from a GitHub gist" requirement gains a third accepted reference — a GitHub username that resolves to a pickable list of that user's importable public gists. Two new requirements cover the picklist interaction (D-pad/keyboard operable, error handling) and the paste control on text inputs (clipboard tiers with graceful fallback).

## Impact

- New module `src/gists-list.js` (no-DOM, tested) calling `GET https://api.github.com/users/{user}/gists`; error codes follow the existing `gist.js` pattern (`bad-user | network | rate-limited | no-importable-gist`). Shares the unauthenticated GitHub rate budget (60 req/hr/IP) with the existing gist fetch.
- `index.html`: paste controls on both inputs, "find gists" control, picklist container.
- `styles.css`: picklist and paste-control styles (frosted-glass language, visible focus for D-pad navigation).
- `src/app.js`: wiring, picklist rendering/selection, `gistUser.v1` localStorage key (same pattern as `movieVotes.v1`).
- `tests/`: unit tests for the list module and the paste fallback matrix.
- No backend, no new dependencies, no breaking changes.
