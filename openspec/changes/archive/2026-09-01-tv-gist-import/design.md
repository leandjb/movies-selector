## Context

The site is a no-backend, vanilla-JS page of classic `<script>` modules. Existing conventions: no-DOM modules as IIFEs attaching to `window.*` and `module.exports` with injectable `fetch` for Jest (`src/gist.js` is the model), coded errors surfaced as toasts, localStorage persistence with try/catch. The gist fetch already talks to `api.github.com` keyless and CORS-open. See proposal.md for why TV browsers make pasting impossible; the target device is an LG webOS TV, whose browser offers no reliable clipboard read at all.

## Goals / Non-Goals

**Goals:**
- A gist import path that works on a D-pad-only TV browser with the OSK as the only text entry tool
- A paste control that helps where clipboards do work (desktop, mobile, some Android TV) and degrades gracefully everywhere else
- Zero regression for URL / bare-ID entry and manual typing

**Non-Goals:**
- Any backend, pairing code, or second-device relay (breaks the no-backend constraint)
- Search-by-title picker for the IMDb input (existing CORS proxy machinery; separate future change)
- Private gist access or any authenticated GitHub API use
- Reading non-text clipboard content

## Decisions

**1. Two layers: username picker is the guaranteed TV path; the paste button is best-effort enhancement.**
The paste button alone was rejected because `navigator.clipboard.readText()` is unsupported or ungrantable on webOS/Tizen. A second-device relay was rejected because it needs a backend. The picker only requires the OSK to type ~8 characters and a D-pad to choose from a list — the TV's native interaction grammar.

**2. New no-DOM module `src/gists-list.js` mirroring `gist.js` conventions.**
`listUserGists(username, fetchImpl)` calls `GET https://api.github.com/users/{user}/gists?per_page=100` and returns `[{ id, title, date }]` for gists whose `files` map contains a `.txt` file (the list response includes file names, `description`, and `updated_at`, so no per-gist requests are needed for listing). Coded errors: `bad-user | network | rate-limited | no-importable-gist`. Injectable fetch keeps it unit-testable like `Gist.fetchGistText`.

**3. One input, one button, shape-based dispatch.**
The existing gist field and Import button dispatch on the submitted value: gist URL regex → direct import; 32-hex ID → direct import; anything else matching GitHub username rules (`^[a-zA-Z0-9-]{1,39}$`) → username discovery. Precedence URL > ID > username, since a 32-hex username collision is not a realistic threat. Alternatives considered: a second "Find gists" button (extra focus-stop on the D-pad, ambiguous which action applies) and a separate field (UI clutter in the glass card). Dispatch happens in `app.js`; the modules stay shape-agnostic.

**4. Picklist is a plain list of native `<button>` elements.**
Rendered under the gist field inside the existing glass card. Native buttons give free keyboard/D-pad focus order, Enter/OK activation, and the page's existing focus styles; `listbox`/`option` ARIA roles were rejected as unnecessary complexity for what is a menu of actions. Activating an entry calls the existing `Gist.fetchGistText(id)` — no duplicated fetch logic — then the normal `handleAdd` pipeline. Re-submitting a username or pressing Escape clears the list.

**5. Paste control tiered inside one activation gesture.**
On click: if `navigator.clipboard?.readText` exists and `isSecureContext`, try it; on failure (or absence) try `document.execCommand('paste')` against the adjacent input (a hail mary for legacy TV WebKit builds; silently unsupported on modern desktops); on any failure or empty clipboard, show the guidance toast ("use your remote's keyboard") and focus the input so the TV OSK opens. The field is filled but the form is NOT auto-submitted — deliberate submission keeps duplicate/full/toast messaging consistent with manual entry.

**6. Username persisted only after a successful list fetch.**
Key `gistUser.v1`, same try/catch pattern as `movieVotes.v1`. Storing on success (not on submit) means a typo never poisons the prefill. The spec's "no hardcoded username" rule is satisfied by construction: nothing ships in the assets.

## Risks / Trade-offs

- [webOS OSK may cover the picklist when the input holds focus] → blur the input before rendering the list and scroll the list into view; verify on the real TV in a manual spike task
- [Unauthenticated GitHub budget is 60 req/hr/IP, shared with direct gist fetches] → one list request per submit, single page; a movie night uses a handful
- [`execCommand('paste')` tier is untestable off legacy devices] → capability-gated, wrapped in try/catch, failures flow to the guidance fallback; never surfaced as an error
- [Username discovery exposes the account's public gists to whoever types the name] → acceptable (movie-title gists); the spec states it and nothing authenticated is ever sent
- [New buttons change D-pad focus order in the hero column] → keep DOM order natural (input → paste → import → list) and include focus-order checks in the manual TV checklist

## Migration Plan

Purely additive: one new script tag, markup additions to two existing forms, one new localStorage key independent of `movieVotes.v1`. Rollback is a revert; there is no data migration and no API contract change.

## Open Questions

None blocking. The on-device webOS behaviors (OSK coverage, whether either paste tier fires) are covered by the manual TV checklist task rather than deferring any design decision.
