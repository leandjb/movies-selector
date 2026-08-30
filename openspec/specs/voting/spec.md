# voting Specification

## Purpose

Lets visitors distribute a budget of votes across the movie shortlist on the landing page, so the grid is ranked by preference without any backend.

## Requirements

### Requirement: Visitor sets the number of votes (vote budget)
The page SHALL include a section where the visitor chooses how many votes they have to distribute across the movies. The total allocated across all movies SHALL never exceed the chosen budget.

#### Scenario: Set the vote budget
- **WHEN** the visitor changes the vote budget control
- **THEN** the number of available votes updates to the chosen value

#### Scenario: Allocation is capped by the budget
- **WHEN** the visitor tries to allocate more votes than the budget allows
- **THEN** the extra vote is not applied and the total stays within the budget

#### Scenario: Lowering the budget trims excess votes
- **WHEN** the visitor lowers the budget below the currently allocated total
- **THEN** excess allocations are removed until the total fits the new budget

### Requirement: Vote counter is visible
Each movie card SHALL display a visible vote counter with controls to increase or decrease the votes allocated to that movie. The counter MUST update immediately when a vote is allocated or returned.

#### Scenario: Counter shows the net score
- **WHEN** a movie card renders
- **THEN** the card displays its current allocated votes as a visible counter

#### Scenario: Counter updates live
- **WHEN** the visitor increases or decreases a movie's allocated votes
- **THEN** the counter updates immediately to the new value

### Requirement: Votes persist per browser
Votes SHALL persist across page reloads and browser sessions using local storage. No backend or user account is required.

#### Scenario: Votes survive a reload
- **WHEN** the visitor votes on movies and reloads the page
- **THEN** their votes and the resulting scores are restored

#### Scenario: Votes are per-browser
- **WHEN** a different browser loads the page
- **THEN** it starts with no votes from the first browser

### Requirement: Grid order is stable
The movie grid SHALL keep cards in the order they were added to the board. Allocating or returning votes MUST NOT move, reorder, or re-sort any card. Movies added later SHALL appear after movies added earlier.

#### Scenario: Voting does not move cards
- **WHEN** the visitor allocates or returns votes for any movie
- **THEN** every card keeps its current position in the grid

#### Scenario: New movies append to the grid
- **WHEN** a new movie is added to the board
- **THEN** its card appears after the existing cards

### Requirement: Winner is revealed on demand
The page SHALL provide a "Show the winner" button that, when activated, tallies the allocated votes across every movie on the board and opens a results modal showing the winning movie's card with its winning percentage and a votes summary listing every movie with its vote count and share. The modal SHALL be dismissible (close control, Escape, backdrop) and close SHALL stop the celebration animation. While any part of the vote budget remains unallocated, activating the button MUST NOT compute or reveal a winner; the page SHALL show a message stating how many votes are still missing. The winner SHALL be the movie with the most allocated votes, with ties broken in favor of the movie added to the board first. The control SHALL remain disabled while the board is empty.

#### Scenario: Revealing the winner with a full allocation
- **WHEN** the visitor has allocated the entire vote budget and activates "Show the winner"
- **THEN** a modal opens showing the winning movie's card, its winning percentage, and a summary of every movie's votes and share

#### Scenario: Reveal is blocked while votes are missing
- **WHEN** part of the vote budget is unallocated and the visitor activates "Show the winner"
- **THEN** no modal opens and a message states how many votes are still missing

#### Scenario: Tie is broken by order added
- **WHEN** two or more movies tie for the most allocated votes at reveal time
- **THEN** the modal shows the movie added to the board first as the winner

#### Scenario: Modal closes and can be re-opened
- **WHEN** the visitor closes the results modal with the close control, Escape, or the backdrop
- **THEN** the modal closes, the celebration stops, and the button can open it again with recalculated results

#### Scenario: Empty board keeps the control disabled
- **WHEN** the board has no movies
- **THEN** the "Show the winner" control is disabled
