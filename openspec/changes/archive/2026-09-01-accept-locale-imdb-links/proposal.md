## Why

Visitors who browse IMDb in another language get locale-prefixed title links (e.g. `https://www.imdb.com/it/title/tt21357150/?ref_=ls_t_1`). The link extractor only recognizes `imdb.com/title/...`, so these links are rejected as invalid in both the paste form and the gist import — the card is never created and an error toast is shown, even though the link is a perfectly valid IMDb title link.

## What Changes

- The shared IMDb link extractor (`src/imdb.js` `extractImdbIds`) accepts an optional locale path segment between the domain and `title/` (e.g. `/it/`, `/es/`, `/pt/`, `/pt-br/`), so localized title links resolve to the same `tt` ID as canonical ones.
- Both entry points benefit automatically: paste submission and gist/TXT import funnel through the same extractor; no changes to the add pipeline, hydration, or persistence.
- Unit and integration test coverage added for locale-prefixed links; rejection behavior for non-IMDb links and bare IDs is unchanged.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shortlist-import`: new requirement that localized IMDb title links (a locale path segment before `title/`) are accepted by the shared add pipeline for both paste and import.

## Impact

- `src/imdb.js` — the `LINK_RE` regex used by `extractImdbIds` (single-line change plus tests).
- `tests/unit/imdb.test.js` and `tests/integration/integration.test.js` — new cases for locale-prefixed links.
- No API, dependency, storage-format, or hydration changes: extraction still yields bare `tt` IDs; hydration and the IMDb badge already operate on the canonical ID/link.
