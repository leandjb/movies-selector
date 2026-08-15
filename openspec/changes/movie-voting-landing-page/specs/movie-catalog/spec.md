## Purpose

Displays a curated list of movies on the landing page, each showing its title, year, IMDb score, Rotten Tomatoes score, poster image, and a link to its YouTube trailer.

## ADDED Requirements

### Requirement: Movie cards show full metadata
The landing page SHALL render one card per movie in the catalog. Each card MUST display the movie's title, release year, IMDb score, Rotten Tomatoes score, poster image, and a trailer button that links to the movie's YouTube trailer.

#### Scenario: Card shows all movie fields
- **WHEN** the landing page renders a movie card
- **THEN** the card shows the title, year, IMDb score, Rotten Tomatoes score, poster image, and a trailer button

#### Scenario: Movie without a trailer link
- **WHEN** a movie in the catalog has no trailer link
- **THEN** the card still renders but does not show a trailer button

### Requirement: Trailer plays in an in-page modal
When a visitor activates a movie's trailer button, the YouTube trailer SHALL play inside a modal overlay on the same page, and the modal SHALL be dismissible.

#### Scenario: Open trailer modal
- **WHEN** the visitor clicks a movie's trailer button
- **THEN** a modal opens on the page playing that movie's YouTube trailer

#### Scenario: Close trailer modal
- **WHEN** the trailer modal is open and the visitor clicks the close control, presses Escape, or clicks the backdrop
- **THEN** the modal closes and playback stops

### Requirement: Poster images come from the catalog data
The poster shown for each movie SHALL come from the poster image URL stored in the catalog data. If a poster fails to load, the card SHALL show a graceful fallback instead of a broken image.

#### Scenario: Poster image fails to load
- **WHEN** a movie's poster URL cannot be loaded
- **THEN** the card displays a fallback placeholder in place of the poster
