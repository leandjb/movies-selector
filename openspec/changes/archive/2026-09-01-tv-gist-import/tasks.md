## 1. Gists list module

- [x] 1.1 Create `src/gists-list.js` as a no-DOM IIFE module attaching `window.GistsList` and `module.exports`, with `listUserGists(username, fetchImpl)` calling `GET https://api.github.com/users/{user}/gists?per_page=100`; verify it loads in Node via a quick `node -e` import smoke check
- [x] 1.2 Filter the list response to gists whose `files` contain a `.txt` file and map to `[{ id, title, date }]` (title = description or first file name); verify mapping against a fixture in a new `tests/unit/gists-list.test.js`
- [x] 1.3 Implement coded errors `bad-user | network | rate-limited | no-importable-gist` (404 → bad-user, 403 → rate-limited, fetch throw → network, empty filtered list → no-importable-gist) and verify each path with unit tests using an injected fake fetch
- [x] 1.4 Add the `<script src="src/gists-list.js" defer>` tag to `index.html` before `gist.js` consumers need it and verify the page loads without console errors (`pnpm test` still green)

## 2. Shape dispatch and discovery wiring

- [x] 2.1 In `src/app.js`, extend the gist submit handler to dispatch on the value: gist URL regex or 32-hex ID → existing direct import; else if matching `^[a-zA-Z0-9-]{1,39}$` → username discovery; verify with unit tests for the dispatch function covering URL, bare ID, username, and invalid input
- [x] 2.2 On username submit, call `GistsList.listUserGists`, map each coded error to a toast message (following the `GIST_ERRORS` pattern), show a loading/disabled state on the button while fetching, and leave the board unchanged on failure; verify error paths in `tests/ui` with jsdom
- [x] 2.3 Store the username to `gistUser.v1` (try/catch pattern of `movieVotes.v1`) only after a successful list fetch, and prefill the field on boot when present; verify persistence and replacement with unit tests

## 3. Picklist UI

- [x] 3.1 Add a picklist container to the gist card in `index.html` and frosted-glass styles (including a strong visible focus outline) to `styles.css`; verify markup renders and styles load by viewing the page
- [x] 3.2 Render each discovered gist as a native `<button>` in a vertical list showing title and date, in DOM order after the Import button; verify keyboard Tab/Enter navigation and focus visibility in jsdom UI tests
- [x] 3.3 On activation, blur/hide the list, call the existing `Gist.fetchGistText(id)` and route through `handleAdd` with the standard summary toast; verify with jsdom UI tests that duplicates/limit/skipped messaging matches direct import
- [x] 3.4 Clear the picklist when a new username is submitted or Escape is pressed while the list is focused; verify with a jsdom UI test

## 4. Paste controls

- [x] 4.1 Add a paste button adjacent to `imdb-input` and `gist-input` in `index.html` with accessible names, and layout styles in `styles.css`; verify the buttons are reachable in D-pad/Tab order (input → paste → submit)
- [x] 4.2 Implement the tiered read (async clipboard API when `isSecureContext`, then `document.execCommand('paste')` on the adjacent input) inside the click gesture, filling the field without submitting; verify success paths in unit tests with stubbed `navigator.clipboard`
- [x] 4.3 On failure or empty clipboard, show the guidance toast ("type with your remote or on-screen keyboard") and focus the input; verify the fallback path in unit tests and that manual typing/submission is untouched
- [x] 4.4 Add unit tests covering the full fallback matrix (API success, API absent, API rejects, empty clipboard) and run `pnpm test` until green

## 5. End-to-end verification

- [x] 5.1 Run `pnpm test` and `openspec validate tv-gist-import --strict` until both pass
- [ ] 5.2 Manual browser pass: paste a URL, a bare ID, and a real username; confirm import, picklist selection, error toasts for an unknown user, and prefill after reload
- [ ] 5.3 Manual LG webOS TV checklist: OSK opens on focus, picklist navigable by D-pad with visible focus, OSK coverage of the picklist checked (scroll into view works), paste button degrades to guidance toast without blocking
