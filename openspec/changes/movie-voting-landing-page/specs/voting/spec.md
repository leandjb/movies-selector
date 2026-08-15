## Purpose

Lets visitors vote for movies on the landing page with up/down votes, so the movie grid is ranked by community preference without any backend.

## ADDED Requirements

### Requirement: Visitor can upvote or downvote a movie
Each movie card SHALL offer an upvote and a downvote control. A visitor SHALL be able to vote at most once per movie per browser; voting again SHALL toggle or change the vote rather than stacking multiple votes.

#### Scenario: Upvote a movie
- **WHEN** the visitor clicks the upvote control on a movie
- **THEN** that movie's net score increases by one and the new score is shown on the card

#### Scenario: Change an existing vote
- **WHEN** the visitor has already upvoted a movie and clicks the downvote control on it
- **THEN** the previous vote is replaced, not stacked, and the net score reflects the single new vote

#### Scenario: Remove a vote by toggling
- **WHEN** the visitor clicks the same control they already used on a movie
- **THEN** the vote is removed and the net score returns to its previous value

### Requirement: Votes persist per browser
Votes SHALL persist across page reloads and browser sessions using local storage. No backend or user account is required.

#### Scenario: Votes survive a reload
- **WHEN** the visitor votes on movies and reloads the page
- **THEN** their votes and the resulting scores are restored

#### Scenario: Votes are per-browser
- **WHEN** a different browser loads the page
- **THEN** it starts with no votes from the first browser

### Requirement: Movies are ranked by net score
The movie grid SHALL be ordered by net score (upvotes minus downvotes), highest first. Ties MAY be broken in a stable, deterministic way.

#### Scenario: Grid sorts by score
- **WHEN** the visitor casts or changes votes
- **THEN** the grid reorders so movies with higher net scores appear first
