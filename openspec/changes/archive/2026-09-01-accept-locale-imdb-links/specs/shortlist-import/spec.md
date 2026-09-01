## ADDED Requirements

### Requirement: Localized IMDb title links are accepted
The shared add pipeline SHALL accept IMDb title links that include a locale path segment between the domain and `title/` (for example `/it/`, `/es/`, `/pt-br/`) and SHALL create the same movie card that the canonical (non-localized) form of the link would create. This SHALL apply to both paste submission and gist/TXT import, which share the pipeline. A localized link SHALL resolve to the same movie identity as its canonical form, so duplicate detection works across locale variants. Links on domains other than IMDb and bare title IDs without a link SHALL remain invalid.

#### Scenario: Paste of a localized link creates a card
- **WHEN** the visitor submits a localized IMDb title link such as `https://www.imdb.com/it/title/tt21357150/?ref_=ls_t_1` for a movie not yet on the board
- **THEN** a card for that movie is created immediately, exactly as if the canonical `https://www.imdb.com/title/tt21357150/` had been submitted, and no error is shown

#### Scenario: Localized links import from a gist
- **WHEN** a gist text file contains locale-prefixed IMDb title links mixed with canonical ones
- **THEN** every link that names a distinct movie is imported in file order and none is reported as invalid

#### Scenario: Locale variants are duplicates of the same movie
- **WHEN** a movie is already on the board (added via a canonical link) and a localized link for the same movie is submitted
- **THEN** no second card is created and a duplicate message is shown

#### Scenario: Rejection rules are unchanged
- **WHEN** submitted text contains no IMDb title link — a bare `tt` ID, a title link on a non-IMDb domain, or unrelated text
- **THEN** no card is created and an error message is shown
