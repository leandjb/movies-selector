## MODIFIED Requirements

### Requirement: Import reports a summary
After a gist import or a paste submission, the page SHALL report what happened as a transient toast notification: how many movies were added, how many were duplicates, how many lines or submissions were invalid, and how many were skipped because the board was full. Error feedback (invalid link, board full, gist failures) SHALL also surface as a toast. Toasts SHALL be transient (auto-dismiss) and MUST NOT rely on the removed inline status bar.

#### Scenario: Mixed import result is reported
- **WHEN** a gist import finishes with some movies added, some duplicates, some invalid lines, and some skipped for the board limit
- **THEN** a toast states the count of each outcome

#### Scenario: Error feedback surfaces as a toast
- **WHEN** the visitor submits text with no valid IMDb link or a gist import fails
- **THEN** an error toast appears and no inline status region is required

#### Scenario: Toasts auto-dismiss
- **WHEN** a toast is shown
- **THEN** it disappears on its own after a bounded time without requiring interaction

## ADDED Requirements

### Requirement: Cards show year and IMDb link badges
Each hydrated movie card SHALL display a badge row containing the IMDb rating, the release year, and an "IMDb" link that opens the movie's IMDb title page in a new tab. Unhydrated ratings SHALL render as a placeholder badge. The link MUST use `target="_blank"` with `rel="noopener noreferrer"`.

#### Scenario: Hydrated card shows the full badge row
- **WHEN** a card's details finish loading successfully
- **THEN** the badge row shows the rating, the year, and a working IMDb link for that movie

#### Scenario: IMDb link opens safely in a new tab
- **WHEN** the visitor activates a card's IMDb link
- **THEN** the movie's IMDb title page opens in a new tab without granting the page access to the opener context

#### Scenario: Unrated card shows a placeholder badge
- **WHEN** a card's rating could not be fetched
- **THEN** the rating badge shows a placeholder instead of a fabricated number, while the year and IMDb link still render when known

### Requirement: Board controls live in the navbar and hero control column
The page SHALL present its board controls in a glass navbar and a hero control column instead of a mid-page toolbar: the navbar SHALL hold the brand, a live board-count chip (current movies against the limit), a votes-missing pill, and the show-winner control; the hero's right-hand column SHALL stack the vote-budget control (stepper with a progress bar of votes given and votes left), the add-by-IMDb-link form, and the gist import form. No mid-page status bar SHALL remain; the clear-all control SHALL sit as a small quiet control at the edge of the board section.

#### Scenario: Navbar holds brand, count, pill, and reveal
- **WHEN** the page loads
- **THEN** the navbar shows the brand, the board-count chip, the votes-missing pill, and the show-winner button

#### Scenario: Hero column stacks the three controls
- **WHEN** the page loads
- **THEN** the vote budget, add-by-link form, and gist import appear stacked in the hero's control column

#### Scenario: Budget progress is visible
- **WHEN** votes are allocated or returned
- **THEN** the budget control's progress bar and remaining-votes label update to reflect votes given and votes left

#### Scenario: Clear all sits at the board edge
- **WHEN** the board has at least one movie
- **THEN** a small clear-all control is reachable at the board section's edge, and it keeps its confirmation-dialog behavior

## REMOVED Requirements

### Requirement: TXT file import adds movies in bulk
**Reason**: The redesign makes gist import the only bulk path, per the product owner's mockup; the local file picker and its FileReader flow are removed to keep the import surface to one panel.
**Migration**: Visitors bulk-import by putting their IMDb links in a gist and pasting the gist URL or ID; a pasted multi-line text with links still works through the add form.

### Requirement: Metadata fetching is throttled and retried
**Reason**: Superseded by the new `metadata-fetch` capability, which redefines the pipeline as bounded-concurrency with proxy round-robin, deduplication, caching, and `Retry-After` handling instead of a strictly serial one-in-flight queue.
**Migration**: Behavior contracts for fetching now live in `openspec/specs/metadata-fetch/spec.md`.

### Requirement: Board tools are grouped into dedicated sections
**Reason**: The four mid-page sections (vote budget, add, import, status) are dissolved into the navbar and the hero control column in the new layout.
**Migration**: The replacement contract is the ADDED requirement "Board controls live in the navbar and hero control column" in this delta.
