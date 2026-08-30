## MODIFIED Requirements

### Requirement: Movie cards show full metadata
The landing page SHALL render one card per movie in the catalog. Each card MUST display the movie's title, release year, IMDb score, Rotten Tomatoes score, and poster image. Each card's trailer control MUST be a link that opens the movie's YouTube trailer in a new tab; trailers MUST NOT require a modal, overlay, or in-page player.

#### Scenario: Card shows all movie fields
- **WHEN** the landing page renders a movie card
- **THEN** the card shows the title, year, IMDb score, Rotten Tomatoes score, poster image, and a trailer link

#### Scenario: Trailer opens YouTube directly
- **WHEN** the visitor activates a movie's trailer link
- **THEN** the movie's YouTube trailer opens in a new browser tab

#### Scenario: Movie without a trailer link
- **WHEN** a movie in the catalog has no trailer link
- **THEN** the card still renders but does not show a trailer control

## ADDED Requirements

### Requirement: Catalog is the specified six-movie shortlist
The catalog SHALL contain exactly these six movies: Her (2013), Project Hail Mary (2026), One Battle After Another (2025), Crimson Tide (1995), The Hot Chick (2002), and The Grand Budapest Hotel (2014).

#### Scenario: All six films render
- **WHEN** the landing page loads
- **THEN** exactly these six movies appear as cards

#### Scenario: No movies outside the roster
- **WHEN** the landing page renders
- **THEN** no movie outside the six-film roster appears

### Requirement: Missing scores show a placeholder
When an IMDb or Rotten Tomatoes score is not available for a movie (for example an unreleased title), the card SHALL show a placeholder and MUST NOT display a fabricated number.

#### Scenario: Unavailable score
- **WHEN** a movie has no known score for a rating source
- **THEN** that card shows a placeholder in place of the missing score

#### Scenario: Available scores render normally
- **WHEN** a movie has a known score for a rating source
- **THEN** that score renders as a number

### Requirement: Posters match their movies
The poster shown for each movie SHALL be that movie's actual poster. Poster URLs in the catalog data SHALL be verified to depict the correct film before shipping.

#### Scenario: Poster shows the correct film
- **WHEN** a movie card renders
- **THEN** the poster image is the actual poster of that movie

## REMOVED Requirements

### Requirement: Trailer plays in an in-page modal
**Reason**: The in-page modal player was unreliable in practice; the user requires trailers to open as direct YouTube links.
**Migration**: The trailer control now opens the movie's YouTube watch URL in a new tab (`target="_blank"`).
