## MODIFIED Requirements

### Requirement: Vote counter is visible
Each movie card SHALL display a visible vote counter with controls to increase or decrease the votes allocated to that movie. The counter MUST update immediately when a vote is allocated or returned.

#### Scenario: Counter shows the net score
- **WHEN** a movie card renders
- **THEN** the card displays its current allocated votes as a visible counter

#### Scenario: Counter updates live
- **WHEN** the visitor increases or decreases a movie's allocated votes
- **THEN** the counter updates immediately to the new value

### Requirement: Movies are ranked by net score
The movie grid SHALL be ordered by the number of allocated votes, highest first. Ties MAY be broken in a stable, deterministic way.

#### Scenario: Grid sorts by score
- **WHEN** the visitor allocates or returns votes
- **THEN** the grid reorders so movies with more allocated votes appear first

### Requirement: Winner is highlighted
The movie with the most allocated votes SHALL be visually marked as the winner on the page. The winner mark SHALL follow the leader live: when an allocation changes the ranking, the mark moves to the new top movie. Ties SHALL be broken deterministically, using the same rule as the ranking.

#### Scenario: Leader is marked as winner
- **WHEN** the landing page renders
- **THEN** the top-ranked movie displays a winner indicator

#### Scenario: Winner changes after a vote
- **WHEN** a vote makes a different movie the top-ranked one
- **THEN** the winner indicator moves to that movie immediately

## ADDED Requirements

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

### Requirement: Winner celebration button
The page SHALL provide a button that reveals the current winner with a dynamic celebration animation around the winning movie.

#### Scenario: Show winner with celebration
- **WHEN** the visitor presses the show-winner button
- **THEN** the winning movie is announced and a celebration animation plays around it

## REMOVED Requirements

### Requirement: Visitor can upvote or downvote a movie
The per-movie up/down toggle model is replaced by budgeted vote allocation with per-movie counters.
