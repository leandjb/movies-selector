## MODIFIED Requirements

### Requirement: Import from a GitHub gist
The page SHALL provide a gist import field that accepts a GitHub gist URL, a bare gist ID, or a GitHub username, together with an Import button. On submit with a URL or bare ID, the page SHALL fetch the gist directly from GitHub in the browser (no proxy, no key), read the gist's text file, and submit its content through the same add pipeline as a TXT import: duplicates rejected, the board limit enforced, links added in file order, and a summary reported. On submit with a GitHub username, the page SHALL present a pickable list of that user's importable public gists, and importing the gist chosen from that list SHALL flow through the same add pipeline. Gist import SHALL merge into the current board and MUST NOT clear it. If the reference cannot be parsed, the fetch fails, the gist does not exist, the gist contains no readable text file, or GitHub rate-limits the request, the page MUST show an error message and leave the board unchanged.

#### Scenario: Gist URL imports its links
- **WHEN** the visitor submits a gist URL whose text file contains IMDb links
- **THEN** the links are added to the board in file order and a summary of the import is reported

#### Scenario: Bare gist ID is accepted
- **WHEN** the visitor submits just the gist ID instead of the full URL
- **THEN** the gist is fetched and imported the same as a full URL

#### Scenario: Username resolves to a gist list
- **WHEN** the visitor submits a GitHub username that has at least one importable public gist
- **THEN** a pickable list of that user's importable public gists is shown instead of importing immediately

#### Scenario: Chosen gist imports through the same pipeline
- **WHEN** the visitor picks a gist from the username list
- **THEN** its links are added to the board in file order with duplicates rejected and the limit enforced, and a summary of the import is reported

#### Scenario: Movies already on the board are not duplicated
- **WHEN** a gist contains links for movies already on the board
- **THEN** no duplicate cards are created and the summary reports them as duplicates

#### Scenario: Board limit still applies
- **WHEN** a gist contains more new movies than free board slots remain
- **THEN** only the free slots are filled and the summary reports the skipped count

#### Scenario: Gist without a readable text file
- **WHEN** the fetched gist contains no text file
- **THEN** an error message is shown and the board is unchanged

#### Scenario: Fetch failure is reported
- **WHEN** the gist request fails because of a network error, a missing gist, or GitHub rate limiting
- **THEN** an error message is shown and the board is unchanged

## ADDED Requirements

### Requirement: Find gists by GitHub username
The page SHALL let the visitor discover gists by submitting a GitHub username: it SHALL fetch that user's public gists from GitHub with unauthenticated, keyless requests, list only the gists that contain a text file, and show each listed gist with enough information to identify it (description or file name, and date). The list SHALL be a pickable set of controls operable by keyboard and TV remote D-pad with a visible focus state, and activating an entry SHALL import that gist. The page MUST NOT embed or preconfigure any GitHub username in its code or assets. If the username does not exist, the request fails, GitHub rate-limits the request, or the user has no gist with a text file, the page MUST show an error message, import nothing, and leave the board unchanged.

#### Scenario: Picklist shows importable gists only
- **WHEN** a valid username is submitted and the user's public gists include gists with and without a text file
- **THEN** the list shows only the gists that contain a text file, each identified by description or file name and date

#### Scenario: Picklist is D-pad operable
- **WHEN** the picklist is displayed
- **THEN** each entry is focusable in order with a visible focus state and activating the focused entry imports that gist

#### Scenario: Unknown username is reported
- **WHEN** the submitted username does not match a GitHub user
- **THEN** an error message is shown, no list is shown, and the board is unchanged

#### Scenario: No importable gists is reported
- **WHEN** the submitted username exists but none of its public gists contains a text file
- **THEN** an error message is shown and the board is unchanged

#### Scenario: Discovery request failure is reported
- **WHEN** the gist list request fails because of a network error or GitHub rate limiting
- **THEN** an error message is shown and the board is unchanged

### Requirement: Remembered gist username
The page SHALL persist the last successfully submitted gist username in that browser's local storage and prefill the username field with it on return visits. The stored value SHALL be cleared or ignored if the visitor submits a different username. No GitHub username SHALL be hardcoded in the site.

#### Scenario: Username survives a reload
- **WHEN** the visitor submits a username and later reloads the page
- **THEN** the username field is prefilled with that username

#### Scenario: New username replaces the stored one
- **WHEN** the visitor submits a different username than the stored one
- **THEN** the stored value is replaced by the newly submitted username

### Requirement: Paste control on import inputs
Each URL text input that feeds the add pipeline (the IMDb link input and the gist input) SHALL have an adjacent paste control. Activating it SHALL attempt to read the clipboard within the activation gesture: first via the async clipboard API where available in a secure context, then via the legacy paste command; on success the field SHALL be filled with the clipboard text without submitting the form. If the clipboard cannot be read (unsupported, insecure context, denied, or empty), the page SHALL show a guidance toast directing the visitor to type with the remote or on-screen keyboard and SHALL move focus to the input so the on-screen keyboard opens. The paste control MUST NOT remove or interfere with manual text entry, which SHALL remain fully functional on every device.

#### Scenario: Clipboard read fills the field
- **WHEN** the visitor activates the paste control on a device where clipboard reading is permitted
- **THEN** the adjacent input is filled with the clipboard text and the form is not submitted

#### Scenario: Clipboard failure degrades gracefully
- **WHEN** the visitor activates the paste control and clipboard reading is unsupported or fails
- **THEN** a guidance toast is shown, focus moves to the input, and no error blocks manual typing

#### Scenario: Manual entry is unaffected
- **WHEN** the visitor types or pastes into the input by any native means
- **THEN** the input behaves exactly as before the paste control existed
