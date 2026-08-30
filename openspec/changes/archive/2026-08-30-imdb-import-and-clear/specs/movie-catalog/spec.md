# movie-catalog Delta

## ADDED Requirements

### Requirement: Movie cards show imported metadata
The landing page SHALL render one card per movie on the board. Each card MUST display the movie's poster image, title, release year, and IMDb rating. The card MUST NOT display a Rotten Tomatoes badge or a trailer control — user-added movies have no data source for either.

#### Scenario: Card shows the four movie fields
- **WHEN** the landing page renders a movie card
- **THEN** the card shows the poster image, title, release year, and IMDb rating

#### Scenario: No Rotten Tomatoes or trailer controls
- **WHEN** a movie card renders
- **THEN** the card displays no Rotten Tomatoes badge and no trailer link

## MODIFIED Requirements

### Requirement: Poster images come from the catalog data
The poster shown for each movie SHALL come from the poster image URL in the fetched IMDb data for that movie. If a poster fails to load, the card SHALL show a graceful fallback instead of a broken image.

#### Scenario: Poster image fails to load
- **WHEN** a movie's poster URL cannot be loaded
- **THEN** the card displays a fallback placeholder in place of the poster

#### Scenario: Poster not yet loaded
- **WHEN** a movie card exists but its poster URL is not yet available
- **THEN** the card shows a placeholder poster instead of a broken image

## REMOVED Requirements

### Requirement: Movie cards show full metadata
**Reason**: Cards on a user-built board show only IMDb-sourced fields — poster, title, year, and rating. There is no data source for Rotten Tomatoes scores or YouTube trailer links, so the old metadata contract cannot hold. Replaced by the ADDED requirement "Movie cards show imported metadata".
**Migration**: Cards render the four IMDb-sourced fields plus the existing vote counter; the Rotten Tomatoes badge and trailer control are dropped from the card.

### Requirement: Catalog is the specified six-movie shortlist
**Reason**: The board is now built entirely by the visitor from IMDb links (see the `shortlist-import` capability). The hardcoded six-film roster no longer exists, so the page cannot ship with a fixed catalog.
**Migration**: Visitors add movies by pasting IMDb links or importing a .txt file of links; the board persists per browser instead of shipping with preset titles.
