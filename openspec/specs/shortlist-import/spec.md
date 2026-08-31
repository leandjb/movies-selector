# shortlist-import Specification

## Purpose

Lets visitors build the movie board themselves from IMDb title links — pasting one link for an instant card or importing a gist of links in bulk — under a hard cap of 9 cards, with a confirmed clear-all reset.

## Requirements

### Requirement: Paste an IMDb link adds a movie card instantly
The page SHALL provide an input where the visitor pastes an IMDb title link and submits it (button or Enter). A movie card SHALL be created immediately upon submission, before any details have loaded. Submitting text that does not contain a valid IMDb title link MUST NOT create a card and MUST show an error message.

#### Scenario: Valid link creates a card immediately
- **WHEN** the visitor submits an input containing an IMDb title link for a movie not yet on the board and the board is below its limit
- **THEN** a new card for that movie appears on the board immediately, before details finish loading

#### Scenario: Invalid link is rejected
- **WHEN** the visitor submits input that contains no valid IMDb title link
- **THEN** no card is created and an error message is shown

#### Scenario: Duplicate link is rejected
- **WHEN** the visitor submits an IMDb title link for a movie already on the board
- **THEN** no new card is created and a duplicate message is shown

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

### Requirement: Board holds at most 9 movies
The board SHALL contain at most 9 movie cards at any time. A paste submission that would exceed the limit MUST be rejected with a message. A gist import SHALL fill only the remaining free slots and report the skipped count. The page SHALL show a live count of cards against the limit.

#### Scenario: Paste rejected when the board is full
- **WHEN** the board holds 9 movies and the visitor submits a valid new IMDb link
- **THEN** no card is created and a board-full message is shown

#### Scenario: Import stops at the limit
- **WHEN** a gist import contains more unique new movies than free slots remain
- **THEN** cards are created only up to the limit and the summary reports the number skipped

#### Scenario: Counter reflects the board size
- **WHEN** the number of cards on the board changes
- **THEN** the displayed count shows the current number of movies out of 9

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

### Requirement: Remove a single movie from the board
Each movie card SHALL provide a remove control (an "X" button) that, when activated, removes only that movie from the board immediately, without a confirmation dialog. Removing a movie SHALL also remove any votes allocated to that movie. The removal SHALL persist across page reloads. A movie that has been removed MAY be added again by submitting its link.

#### Scenario: Remove control deletes only its card
- **WHEN** the visitor activates the remove control on a card
- **THEN** that card is removed from the board and the other cards and their votes remain unchanged

#### Scenario: Votes are freed
- **WHEN** a movie with allocated votes is removed
- **THEN** its votes are deleted and the remaining vote budget increases accordingly

#### Scenario: Removal persists across reload
- **WHEN** the visitor removes a movie and reloads the page
- **THEN** the movie and its votes remain removed

#### Scenario: Removed movie can be added again
- **WHEN** the visitor submits an IMDb link for a movie that was previously removed
- **THEN** a new card is created for it instead of being rejected as a duplicate

#### Scenario: Last removal restores the empty state
- **WHEN** the last card on the board is removed
- **THEN** the board shows its empty state and the clear-all and show-winner controls are disabled

#### Scenario: Accessible remove control
- **WHEN** a card renders
- **THEN** its remove control has an accessible name identifying that movie and is operable by keyboard, and after removal focus moves to a keyboard-reachable target

### Requirement: Board persists per browser
The board (movies and their fetched details) SHALL persist across page reloads using local storage, with no backend or account. On load, the page SHALL restore the persisted board; movies whose details never loaded MAY be retried.

#### Scenario: Board survives a reload
- **WHEN** the visitor builds a board and reloads the page
- **THEN** the same movies and their details are restored

### Requirement: Clear all erases the board after confirmation
The page SHALL provide a "Clear all" control that opens a confirmation dialog before any data is destroyed. Confirming the dialog SHALL remove every movie card and the votes allocated to them. Dismissing the dialog (cancel button, Esc key, or activating the backdrop) SHALL leave the board unchanged. The dialog SHALL trap keyboard focus while open and restore focus to the "Clear all" control when closed.

#### Scenario: Confirming erases everything
- **WHEN** the visitor activates "Clear all" and confirms the dialog
- **THEN** all movie cards and their votes are removed and the board shows its empty state

#### Scenario: Canceling keeps the board
- **WHEN** the visitor opens the confirmation dialog and dismisses it with cancel, Esc, or the backdrop
- **THEN** every movie card and its votes remain unchanged

#### Scenario: Clear all is inert on an empty board
- **WHEN** the board has no movies
- **THEN** the "Clear all" control is disabled

### Requirement: Empty board state
When the board has no movies, the page SHALL show an inviting empty state that directs the visitor to paste a link or import a gist. The show-winner control SHALL be disabled while the board is empty.

#### Scenario: First visit shows an empty board
- **WHEN** the page loads with no persisted movies
- **THEN** the board shows the empty state and the show-winner control is disabled

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

### Requirement: Broken posters fall back to a placeholder
If a movie's poster image fails to load, the card SHALL show a placeholder poster in place of the broken image while the rest of the fetched details remain displayed.

#### Scenario: Poster URL fails to load
- **WHEN** a card's poster image cannot be loaded
- **THEN** the card shows a placeholder poster and keeps its title and year
