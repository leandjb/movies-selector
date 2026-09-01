## ADDED Requirements

### Requirement: Only movies with loaded details are votable
Vote controls SHALL be disabled on any card whose details are not loaded — while they are loading or after loading has failed — and the vote counter MUST remain visible on those cards. Vote controls on a card whose details later load SHALL become usable again. A vote control MUST NOT change any allocation while its movie's details are not loaded, even when activated through a stale or programmatic interaction.

#### Scenario: Controls are disabled while details load or have failed
- **WHEN** a card's details are loading or have failed to load
- **THEN** its allocate and return vote controls are disabled and the vote counter remains visible on the card

#### Scenario: Disabled controls cannot allocate
- **WHEN** a vote control on a card whose details are not loaded is activated
- **THEN** no vote is allocated or removed, the vote total is unchanged, and persisted vote state is unchanged

#### Scenario: A retried card becomes votable again
- **WHEN** a card whose details failed is retried after a reload and its details load
- **THEN** its vote controls become usable again with zero votes allocated

## ADDED Requirements

### Requirement: Votes are freed when a movie cannot be tallied
When a movie's details have failed to load, any votes allocated to that movie SHALL be returned to the budget, and the freed votes SHALL be immediately re-allocatable to other movies. On page load, persisted votes attached to a movie whose details are not loaded SHALL be discarded before the board is first rendered. Votes freed this way MUST NOT be restored automatically if the movie's details load later.

#### Scenario: Failure frees the votes immediately
- **WHEN** a movie's details fail to load after votes were allocated to it
- **THEN** its allocated votes are returned to the budget, its counter shows zero, and the freed votes are allocatable to other movies without a page reload

#### Scenario: Freed votes update the navbar immediately
- **WHEN** votes are freed by a failed load during the session
- **THEN** the missing-votes pill and budget progress reflect the freed votes immediately, without a reload

#### Scenario: Legacy votes are discarded before first paint
- **WHEN** the page loads with persisted votes attached to a movie whose details are not loaded
- **THEN** those votes are discarded before the board is first rendered, and the missing-votes pill includes them from the first paint

#### Scenario: Votes are not restored on retry
- **WHEN** a movie whose votes were freed has its details load on a later reload
- **THEN** the movie becomes votable at zero votes and the freed budget remains available

## MODIFIED Requirements

### Requirement: Winner is revealed on demand
The page SHALL provide a "Show winner" control in the site navbar that, when activated, tallies the allocated votes across every movie on the board whose details have loaded and opens a results modal showing the winning movie's card with its winning percentage and a votes summary listing every tallied movie with its vote count and share. Movies whose details are loading or have failed SHALL NOT be tallied, MUST NOT win, and MUST NOT appear in the results rows; percentages SHALL be computed over tallied movies only. While any part of the vote budget remains unallocated — including votes freed by a failed load — activating the button MUST NOT compute or reveal a winner; the page SHALL report how many votes are still missing as a toast. When no movie on the board has loaded details, activating the button MUST NOT compute or reveal a winner and SHALL report a distinct message that no movie can be revealed, different from the missing-votes and empty-board messages. The modal SHALL be dismissible (close control, Escape, backdrop) and close SHALL stop the celebration animation. The winner SHALL be the tallied movie with the most allocated votes, with ties broken in favor of the movie added to the board first. The control SHALL remain disabled while the board is empty.

#### Scenario: Revealing the winner with a full allocation
- **WHEN** the visitor has allocated the entire vote budget and activates the navbar "Show winner" control
- **THEN** a modal opens showing the winning movie's card, its winning percentage, and a summary of every tallied movie's votes and share

#### Scenario: Reveal is blocked while votes are missing
- **WHEN** part of the vote budget is unallocated and the visitor activates the navbar "Show winner" control
- **THEN** no modal opens and a toast states how many votes are still missing

#### Scenario: Non-ready movies are excluded from the tally
- **WHEN** the reveal runs while some cards' details are not loaded
- **THEN** those movies neither win nor appear in the results summary, and percentages are computed over tallied movies only

#### Scenario: Stripped votes stay missing until re-allocated
- **WHEN** votes were freed by a failed load and the visitor activates the navbar "Show winner" control
- **THEN** the reveal stays blocked and the toast counts those votes as still missing until they are allocated to movies whose details have loaded

#### Scenario: No loaded movies is reported distinctly
- **WHEN** every card on the board has details that are not loaded and the visitor activates the navbar "Show winner" control
- **THEN** no modal opens and a toast explains that no movie can be revealed, distinct from the missing-votes and empty-board messages

#### Scenario: Tie is broken by order added
- **WHEN** two or more movies tie for the most allocated votes at reveal time
- **THEN** the modal shows the movie added to the board first as the winner

#### Scenario: Modal closes and can be re-opened
- **WHEN** the visitor closes the results modal with the close control, Escape, or the backdrop
- **THEN** the modal closes, the celebration stops, and the navbar control can open it again with recalculated results

#### Scenario: Empty board keeps the control disabled
- **WHEN** the board has no movies
- **THEN** the navbar "Show winner" control is disabled
