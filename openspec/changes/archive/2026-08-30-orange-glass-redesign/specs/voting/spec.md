## MODIFIED Requirements

### Requirement: Winner is revealed on demand
The page SHALL provide a "Show winner" control in the site navbar that, when activated, tallies the allocated votes across every movie on the board and opens a results modal showing the winning movie's card with its winning percentage and a votes summary listing every movie with its vote count and share. The modal SHALL be dismissible (close control, Escape, backdrop) and close SHALL stop the celebration animation. While any part of the vote budget remains unallocated, activating the button MUST NOT compute or reveal a winner; the page SHALL report how many votes are still missing as a toast. The winner SHALL be the movie with the most allocated votes, with ties broken in favor of the movie added to the board first. The control SHALL remain disabled while the board is empty.

#### Scenario: Revealing the winner with a full allocation
- **WHEN** the visitor has allocated the entire vote budget and activates the navbar "Show winner" control
- **THEN** a modal opens showing the winning movie's card, its winning percentage, and a summary of every movie's votes and share

#### Scenario: Reveal is blocked while votes are missing
- **WHEN** part of the vote budget is unallocated and the visitor activates the navbar "Show winner" control
- **THEN** no modal opens and a toast states how many votes are still missing

#### Scenario: Tie is broken by order added
- **WHEN** two or more movies tie for the most allocated votes at reveal time
- **THEN** the modal shows the movie added to the board first as the winner

#### Scenario: Modal closes and can be re-opened
- **WHEN** the visitor closes the results modal with the close control, Escape, or the backdrop
- **THEN** the modal closes, the celebration stops, and the navbar control can open it again with recalculated results

#### Scenario: Empty board keeps the control disabled
- **WHEN** the board has no movies
- **THEN** the navbar "Show winner" control is disabled

## ADDED Requirements

### Requirement: Votes-missing counter is visible in the navbar
The navbar SHALL display a persistent pill showing how many votes of the budget remain unallocated. The pill SHALL update immediately whenever votes are allocated, returned, trimmed by a budget change, or freed by removing a movie. When the entire budget is allocated, the pill SHALL switch to a distinct ready state indicating no votes are missing.

#### Scenario: Pill shows the missing count while voting
- **WHEN** part of the vote budget is unallocated
- **THEN** the navbar pill shows the number of missing votes

#### Scenario: Pill updates live on every vote change
- **WHEN** the visitor allocates, returns, or frees votes (including by removing a movie or changing the budget)
- **THEN** the pill's count updates immediately without a page reload

#### Scenario: Pill signals readiness at full allocation
- **WHEN** the entire vote budget is allocated
- **THEN** the pill switches to a distinct ready state instead of showing a missing count
