## 1. Gist module

- [x] 1.1 Create `gist.js` as a UMD module (`window.Gist`, `globalThis.Gist` under Jest) exposing `parseGistRef(text)` and `fetchGistText(ref, fetchImpl)`
- [x] 1.2 Implement `parseGistRef`: accept `gist.github.com/<user>/<32-hex>` URLs (with optional `?ref`/trailing slash) and bare 32-hex IDs; return the ID or `null`
- [x] 1.3 Implement `fetchGistText`: `GET https://api.github.com/gists/{id}`, pick the first `.txt`/`text/plain` file, return `{ name, content }`; fall back to the file's `raw_url` when `truncated` is true; throw typed errors for unparseable ref, HTTP failure, rate limit, and "no text file"
- [x] 1.4 Create `gist.test.js`: URL/ID parsing cases, happy path (map gist like the `leandjb` one), file picking, truncated fallback, and each error path, using an injected `fetchImpl`

## 2. App wiring

- [x] 2.1 In `app.js`, add the gist import handler: read the field, `parseGistRef`/`fetchGistText`, feed content into the existing `handleAdd` pipeline, reuse the summary line; disable the button while fetching
- [x] 2.2 Map error types to distinct feedback messages (bad reference, not found/network, rate-limited, no text file) and verify the board is untouched on every failure path
- [x] 2.3 Add integration tests: gist text merges via `handleAdd` (duplicates/cap reported) and a failed fetch leaves the board unchanged

## 3. Stable grid order

- [x] 3.1 Remove the vote-driven sort in `render` and display cards in `board.list()` insertion order
- [x] 3.2 Compute the winner as max-by-(allocated votes, earliest added) for the hero pane and leader glow, keeping their live updates
- [x] 3.3 Add a board test locking that vote allocation never changes `board.list()` order, and update any tests asserting re-sort behavior

## 4. Four-section layout

- [x] 4.1 Run `/impeccable shape` on the four-section control area (budget / add-link / import / status) before editing markup
- [x] 4.2 Restructure `index.html` into the four `.glass` sections with kicker labels, moving Show the winner with the budget and count/Clear all into status
- [x] 4.3 Add the gist field + Import gist button to the import section and restyle `styles.css` for the four-panel layout using existing tokens
- [x] 4.4 Run `/impeccable polish` and `/impeccable audit`; fix findings (focus order, contrast, responsive stacking of the four sections)

## 5. Favicon

- [x] 5.1 Create `favicon.svg` (cyan ★ on the dark rounded square, matching `.brand__mark`) and link it from `index.html` with `<link rel="icon" type="image/svg+xml">`

## 6. Verification

- [x] 6.1 `node --check` all JS; full Jest suite green (`gist.test.js`, board, imdb, integration)
- [ ] 6.2 Manual browser pass: import `https://gist.github.com/leandjb/f14aba6d67faf726ac12a5936ccd14a3` (9 cards hydrate through the queue), vote and confirm no card moves, winner hero/glow still follows, favicon shows, sections stack correctly on mobile
