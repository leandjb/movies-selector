## MODIFIED Requirements

### Requirement: Cards hydrate with fetched IMDb data
Each card SHALL display the movie's portrait, title, and release year fetched from the movie's IMDb data. While details are loading the card SHALL show a loading placeholder. If details cannot be fetched, the card MUST remain with placeholder dashes and MUST NOT display a fabricated title or year.

#### Scenario: Card fills in after details load
- **WHEN** details for an added movie finish loading successfully
- **THEN** the card shows the movie's portrait, title, and release year

#### Scenario: Card shows placeholders while loading
- **WHEN** a card has been created but its details have not yet loaded
- **THEN** the card shows a loading state instead of blank or broken content

#### Scenario: Failed fetch leaves placeholders
- **WHEN** details for a card cannot be fetched
- **THEN** the card remains on the board with placeholder dashes for the missing values

### Requirement: Broken posters fall back to a placeholder
If a movie's poster image fails to load, the card SHALL show a placeholder poster in place of the broken image while the rest of the fetched details remain displayed.

#### Scenario: Poster URL fails to load
- **WHEN** a card's poster image cannot be loaded
- **THEN** the card shows a placeholder poster and keeps its title and year

## REMOVED Requirements

### Requirement: Cards show year and IMDb link badges
**Reason**: The badge row is being redefined without the rating: no rating is fetched (the only source was WAF-blocked and never rendered), so the rating badge and its placeholder scenario are removed rather than kept as dead contract.
**Migration**: The replacement contract is the ADDED requirement "Cards show a year badge and an IMDb link" in this delta.

## ADDED Requirements

### Requirement: Cards show a year badge and an IMDb link
Each hydrated movie card SHALL display a badge row containing the release year and an "IMDb" link that opens the movie's IMDb title page in a new tab. The link MUST use `target="_blank"` with `rel="noopener noreferrer"`. Cards MUST NOT display an IMDb rating: none is fetched, and no rating placeholder is rendered.

#### Scenario: Hydrated card shows the full badge row
- **WHEN** a card's details finish loading successfully
- **THEN** the badge row shows the year and a working IMDb link for that movie, and no rating badge

#### Scenario: IMDb link opens safely in a new tab
- **WHEN** the visitor activates a card's IMDb link
- **THEN** the movie's IMDb title page opens in a new tab without granting the page access to the opener context

#### Scenario: Badge row renders even when details fail
- **WHEN** a card's details cannot be fetched
- **THEN** the year shows a placeholder while the IMDb link still renders from the movie's ID
