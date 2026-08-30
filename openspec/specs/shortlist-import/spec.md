# shortlist-import Specification

## Purpose

Lets visitors build the movie board themselves from IMDb title links — pasting one link for an instant card or importing a TXT file of links in bulk — under a hard cap of 9 cards, with a confirmed clear-all reset.

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

### Requirement: TXT file import adds movies in bulk
The page SHALL provide a file control that accepts a .txt file. The file SHALL be read locally in the browser (no upload). Each line SHALL be scanned for IMDb title links; every valid link found for a movie not already on the board SHALL add a card, in file order, subject to the board limit.

#### Scenario: File of valid links imports cards
- **WHEN** the visitor selects a .txt file where lines contain valid IMDb title links
- **THEN** one card per unique, not-already-present movie is created in file order

#### Scenario: Invalid lines are skipped without aborting the import
- **WHEN** a .txt file contains lines with no valid IMDb title link
- **THEN** those lines add no cards and the rest of the file still imports

### Requirement: Import reports a summary
After a paste submission or file import, the page SHALL report what happened: how many movies were added, how many were duplicates, how many lines or submissions were invalid, and how many were skipped because the board was full.

#### Scenario: Mixed import result is reported
- **WHEN** a .txt import finishes with some movies added, some duplicates, some invalid lines, and some skipped for the board limit
- **THEN** a summary states the count of each outcome

### Requirement: Board holds at most 9 movies
The board SHALL contain at most 9 movie cards at any time. A paste submission that would exceed the limit MUST be rejected with a message. A file import SHALL fill only the remaining free slots and report the skipped count. The page SHALL show a live count of cards against the limit.

#### Scenario: Paste rejected when the board is full
- **WHEN** the board holds 9 movies and the visitor submits a valid new IMDb link
- **THEN** no card is created and a board-full message is shown

#### Scenario: Import stops at the limit
- **WHEN** a .txt file contains more unique new movies than free slots remain
- **THEN** cards are created only up to the limit and the summary reports the number skipped

#### Scenario: Counter reflects the board size
- **WHEN** the number of cards on the board changes
- **THEN** the displayed count shows the current number of movies out of 9

### Requirement: Cards hydrate with fetched IMDb data
Each card SHALL display the movie's portrait, title, release year, and IMDb rating fetched from the movie's IMDb data. While details are loading the card SHALL show a loading placeholder. If details cannot be fetched, the card MUST remain with placeholder dashes and MUST NOT display a fabricated title, year, or rating.

#### Scenario: Card fills in after details load
- **WHEN** details for an added movie finish loading successfully
- **THEN** the card shows the movie's portrait, title, release year, and IMDb rating

#### Scenario: Card shows placeholders while loading
- **WHEN** a card has been created but its details have not yet loaded
- **THEN** the card shows a loading state instead of blank or broken content

#### Scenario: Failed fetch leaves placeholders
- **WHEN** details for a card cannot be fetched
- **THEN** the card remains on the board with placeholder dashes for the missing values

### Requirement: Metadata fetching is throttled and retried
The page SHALL fetch movie details through a queue that keeps at most one details request in flight at a time and SHALL wait a short randomized delay between fetching different movies. When an individual request fails with a rate-limit response, a timeout response, a server error, or a network error, the page SHALL retry that request with a bounded, increasing delay before falling back to the next data source. Every movie awaiting details SHALL be fetched through this same queue, including movies whose details are retried when the page loads.

#### Scenario: Bulk import does not burst
- **WHEN** a file import adds several movies at once
- **THEN** their details are fetched one movie at a time with a delay between movies, not all simultaneously

#### Scenario: Rate-limited or failed attempt is retried
- **WHEN** a details request fails with a rate-limit, timeout, server-error, or network failure
- **THEN** the page waits a bounded, increasing delay and retries before falling back to the next data source

#### Scenario: Bounded retries end in placeholders
- **WHEN** every attempt for a movie fails even after retries
- **THEN** the card remains with placeholder dashes for the missing values and the queue moves on to the next movie

#### Scenario: Reload retry uses the queue
- **WHEN** the page loads with movies whose details never loaded
- **THEN** their retries are also fetched one at a time through the same queue

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
When the board has no movies, the page SHALL show an inviting empty state that directs the visitor to paste a link or import a file. The winner display SHALL show a placeholder instead of a movie, and the show-winner control SHALL be disabled.

#### Scenario: First visit shows an empty board
- **WHEN** the page loads with no persisted movies
- **THEN** the board shows the empty state, the winner display shows a placeholder, and the show-winner control is disabled
