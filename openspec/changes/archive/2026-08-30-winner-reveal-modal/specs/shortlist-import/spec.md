# shortlist-import Delta

## MODIFIED Requirements

### Requirement: Empty board state
When the board has no movies, the page SHALL show an inviting empty state that directs the visitor to paste a link or import a file. The show-winner control SHALL be disabled while the board is empty.

#### Scenario: First visit shows an empty board
- **WHEN** the page loads with no persisted movies
- **THEN** the board shows the empty state and the show-winner control is disabled
