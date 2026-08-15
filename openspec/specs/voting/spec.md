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

### Requirement: Movies are ranked by net score
The movie grid SHALL be ordered by the number of allocated votes, highest first. Ties MAY be broken in a stable, deterministic way.

#### Scenario: Grid sorts by score
- **WHEN** the visitor allocates or returns votes
- **THEN** the grid reorders so movies with more allocated votes appear first

### Requirement: Votes persist per browser
Votes SHALL persist across page reloads and browser sessions using local storage. No backend or user account is required.

#### Scenario: Votes survive a reload
- **WHEN** the visitor votes on movies and reloads the page
- **THEN** their votes and the resulting scores are restored

#### Scenario: Votes are per-browser
- **WHEN** a different browser loads the page
- **THEN** it starts with no votes from the first browser

### Requirement: Winner is highlighted
The movie with the most allocated votes SHALL be visually marked as the winner on the page. The winner mark SHALL follow the leader live: when an allocation changes the ranking, the mark moves to the new top movie. Ties SHALL be broken deterministically, using the same rule as the ranking.

#### Scenario: Leader is marked as winner
- **WHEN** the landing page renders
- **THEN** the top-ranked movie displays a winner indicator

#### Scenario: Winner changes after a vote
- **WHEN** a vote makes a different movie the top-ranked one
- **THEN** the winner indicator moves to that movie immediately

### Requirement: Winner celebration button
The page SHALL provide a button that reveals the current winner with a dynamic celebration animation around the winning movie.

#### Scenario: Show winner with celebration
- **WHEN** the visitor presses the show-winner button
- **THEN** the winning movie is announced and a celebration animation plays around it
