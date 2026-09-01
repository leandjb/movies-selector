## 1. Extractor fix

- [x] 1.1 In `src/imdb.js`, change `LINK_RE` to allow one optional path segment between `imdb.com/` and `title/` (shape per design.md Decision 1, keeping the `tt\d{7,10}` capture group). Verify: `npm test -- tests/unit/imdb.test.js` passes existing suite with no regressions

## 2. Tests

- [x] 2.1 Add unit cases to the `extractImdbIds` suite in `tests/unit/imdb.test.js`: two-letter locale links (`/it/`, `/es/`), a region locale (`/pt-br/`), a link with query params (`?ref_=ls_t_1`), and multiple locale links in one text — verify each extracts the correct bare `tt` ID. Verify: `npm test -- tests/unit/imdb.test.js`
- [x] 2.2 Add unit cases pinning the rejection boundary: a non-IMDb domain with a locale segment (`https://example.com/it/title/tt0118881/`) and a bare `tt` ID still return `[]`. Verify: `npm test -- tests/unit/imdb.test.js`
- [x] 2.3 Add an integration case in `tests/integration/integration.test.js`: `board.addFromText` with a localized URL creates the card, and submitting a canonical link for the same ID afterwards is reported as a duplicate. Verify: `npm test -- tests/integration/integration.test.js`

## 3. Verification

- [x] 3.1 Run the full suite (`npm test`) and confirm all existing and new tests pass. Verify: exit code 0
- [ ] 3.2 Manual smoke: serve the page, paste `https://www.imdb.com/it/title/tt21357150/?ref_=ls_t_1`, confirm a card is created and hydrates (title, year, poster) with no error toast, and that re-submitting the same link reports a duplicate. Verify: observable behavior in the browser
