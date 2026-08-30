# voting Delta

## REMOVED Requirements

### Requirement: Winner is highlighted
**Reason**: Voting becomes fully blind — a permanent leader mark (hero panel, card glow) spoils the result before the reveal. The winner exists only when deliberately revealed.
**Migration**: Replaced by "Winner is revealed on demand" (below): the button's results modal is the only winner view.

### Requirement: Winner celebration button
**Reason**: The old button complemented the always-visible winner marking; with blind voting it is redefined as the reveal action with tally, percentage, and summary.
**Migration**: Replaced by "Winner is revealed on demand" (below); the celebration animation moves inside the results modal.

## ADDED Requirements

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
