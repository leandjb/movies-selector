# shortlist-import Delta

## ADDED Requirements

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
