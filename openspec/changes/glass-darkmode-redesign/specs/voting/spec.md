## ADDED Requirements

### Requirement: Vote counter is visible
Each movie card SHALL display a visible vote counter showing the movie's current net score (upvotes minus downvotes, including any initial votes). The counter MUST update immediately when a vote is cast or changed.

#### Scenario: Counter shows the net score
- **WHEN** a movie card renders
- **THEN** the card displays its current net score as a visible counter

#### Scenario: Counter updates live
- **WHEN** the visitor casts or changes a vote
- **THEN** the counter updates immediately to the new net score

### Requirement: Winner is highlighted
The movie with the highest net score SHALL be visually marked as the winner on the page. The winner mark SHALL follow the leader live: when a vote changes the ranking, the mark moves to the new top movie. Ties SHALL be broken deterministically, using the same rule as the ranking.

#### Scenario: Leader is marked as winner
- **WHEN** the landing page renders
- **THEN** the top-ranked movie displays a winner indicator

#### Scenario: Winner changes after a vote
- **WHEN** a vote makes a different movie the top-ranked one
- **THEN** the winner indicator moves to that movie immediately
