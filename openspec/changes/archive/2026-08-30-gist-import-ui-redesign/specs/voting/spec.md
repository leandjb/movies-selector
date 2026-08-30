# voting Delta

## REMOVED Requirements

### Requirement: Movies are ranked by net score
**Reason**: Cards visibly relocating every time a vote is cast feels jarring during a live vote; the allocation totals carry the ranking, not the physical card order.
**Migration**: The grid keeps a stable insertion order (see ADDED "Grid order is stable"); the leader is still highlighted live (see MODIFIED "Winner is highlighted").

## ADDED Requirements

### Requirement: Grid order is stable
The movie grid SHALL keep cards in the order they were added to the board. Allocating or returning votes MUST NOT move, reorder, or re-sort any card. Movies added later SHALL appear after movies added earlier.

#### Scenario: Voting does not move cards
- **WHEN** the visitor allocates or returns votes for any movie
- **THEN** every card keeps its current position in the grid

#### Scenario: New movies append to the grid
- **WHEN** a new movie is added to the board
- **THEN** its card appears after the existing cards

## MODIFIED Requirements

### Requirement: Winner is highlighted
The movie with the most allocated votes SHALL be visually marked as the winner on the page. The winner mark SHALL follow the leader live: when an allocation changes which movie leads, the mark moves to the new leader while every card stays in its place. Ties SHALL be broken deterministically in favor of the movie that was added to the board first.

#### Scenario: Leader is marked as winner
- **WHEN** the landing page renders
- **THEN** the movie with the most allocated votes displays the winner indicator

#### Scenario: Winner changes after a vote
- **WHEN** a vote makes a different movie the leader
- **THEN** the winner indicator moves to that movie immediately and no card changes position

#### Scenario: Tie keeps the earlier-added leader
- **WHEN** two or more movies tie for the highest allocation
- **THEN** the winner indicator stays on the movie that was added first
