# movie-catalog Delta

## REMOVED Requirements

### Requirement: Movie cards show full metadata
**Reason**: Visitors add their own movies, so there is no curated data source for Rotten Tomatoes scores or YouTube trailer links; the dynamic card fields are already defined by `shortlist-import` ("Cards hydrate with fetched IMDb data").
**Migration**: None — cards continue to show poster, title, year, and rating from fetched IMDb data per `shortlist-import`.

### Requirement: Catalog is the specified six-movie shortlist
**Reason**: The catalog is no longer fixed; visitors build the board themselves from IMDb links via paste, TXT import, and gist import.
**Migration**: None — the board holds whatever the visitor adds under the `shortlist-import` rules, capped at 9.

### Requirement: Poster images come from the catalog data
**Reason**: Posters come from fetched IMDb data rather than curated catalog data, and the failure fallback is restated in `shortlist-import` ("Broken posters fall back to a placeholder").
**Migration**: Poster sourcing and the broken-poster fallback are covered by `shortlist-import`.

### Requirement: Posters match their movies
**Reason**: Posters are sourced from IMDb's own data for the exact submitted title, so curated-URL verification no longer applies.
**Migration**: None — poster accuracy is inherited from the IMDb source.

### Requirement: Missing scores show a placeholder
**Reason**: Already guaranteed by `shortlist-import` ("Cards hydrate with fetched IMDb data"), which requires placeholder dashes for missing values and forbids fabricated numbers.
**Migration**: Covered by `shortlist-import`.
