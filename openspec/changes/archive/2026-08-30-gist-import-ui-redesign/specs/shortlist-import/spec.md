# shortlist-import Delta

## ADDED Requirements

### Requirement: Import from a GitHub gist
The page SHALL provide a gist import field that accepts a GitHub gist URL or a bare gist ID, together with an Import button. On submit, the page SHALL fetch the gist directly from GitHub in the browser (no proxy, no key), read the gist's text file, and submit its content through the same add pipeline as a TXT import: duplicates rejected, the board limit enforced, links added in file order, and a summary reported. Gist import SHALL merge into the current board and MUST NOT clear it. If the reference cannot be parsed, the fetch fails, the gist does not exist, the gist contains no readable text file, or GitHub rate-limits the request, the page MUST show an error message and leave the board unchanged.

#### Scenario: Gist URL imports its links
- **WHEN** the visitor submits a gist URL whose text file contains IMDb links
- **THEN** the links are added to the board in file order and a summary of the import is reported

#### Scenario: Bare gist ID is accepted
- **WHEN** the visitor submits just the gist ID instead of the full URL
- **THEN** the gist is fetched and imported the same as a full URL

#### Scenario: Movies already on the board are not duplicated
- **WHEN** the gist contains links for movies already on the board
- **THEN** no duplicate cards are created and the summary reports them as duplicates

#### Scenario: Board limit still applies
- **WHEN** the gist contains more new movies than free board slots remain
- **THEN** only the free slots are filled and the summary reports the skipped count

#### Scenario: Gist without a readable text file
- **WHEN** the fetched gist contains no text file
- **THEN** an error message is shown and the board is unchanged

#### Scenario: Fetch failure is reported
- **WHEN** the gist request fails because of a network error, a missing gist, or GitHub rate limiting
- **THEN** an error message is shown and the board is unchanged

### Requirement: Board tools are grouped into dedicated sections
The page SHALL present the board controls in four visually distinct sections: a vote-budget section, an add-by-IMDb-link section, an import section holding both the TXT file control and the gist import, and a status section holding the feedback message, the movie count against the limit, and the Clear all control.

#### Scenario: Four sections render
- **WHEN** the page loads
- **THEN** the vote budget, add-by-link, import, and status controls appear in four distinct sections

#### Scenario: Import section holds both import paths
- **WHEN** the visitor wants to import movies from a file or a gist
- **THEN** both the TXT file control and the gist field are found in the same import section

### Requirement: Broken posters fall back to a placeholder
If a movie's poster image fails to load, the card SHALL show a placeholder poster in place of the broken image while the rest of the fetched details remain displayed.

#### Scenario: Poster URL fails to load
- **WHEN** a card's poster image cannot be loaded
- **THEN** the card shows a placeholder poster and keeps its title, year, and rating
