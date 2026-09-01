(() => {
  "use strict";

  /* ------------------------------------------------------------------
   * State
   * ------------------------------------------------------------------ */

  const STORAGE_KEY = "movieVotes.v1";
  const DEFAULT_BUDGET = 10;
  const MIN_BUDGET = 1;
  const MAX_BUDGET = 99;
  const MAX_CARDS = 9;

  // Vote state: { budget: number, byId: { [movieId]: allocatedVotes } }
  let state = loadState();
  let voted = false; // once true, card-in entrance animation is suppressed
  const board = window.Board.createBoard(window.localStorage);

  function freshState() {
    return { budget: DEFAULT_BUDGET, byId: {} };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object" || !parsed.byId) {
        return freshState();
      }
      const budget =
        Number.isInteger(parsed.budget) &&
        parsed.budget >= MIN_BUDGET &&
        parsed.budget <= MAX_BUDGET
          ? parsed.budget
          : DEFAULT_BUDGET;
      const byId = {};
      if (parsed.byId && typeof parsed.byId === "object") {
        for (const [id, v] of Object.entries(parsed.byId)) {
          const n = Number(v);
          if (Number.isInteger(n) && n > 0) byId[id] = n;
        }
      }
      return { budget, byId };
    } catch {
      return freshState();
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — votes just don't persist this session */
    }
  }

  // Drop vote entries for movies that are no longer on the board.
  function pruneOrphanVotes() {
    for (const id of Object.keys(state.byId)) {
      if (!board.hasId(id)) delete state.byId[id];
    }
  }

  function isVotable(movie) {
    return !(movie && (movie.status === "loading" || movie.status === "error"));
  }

  // Strip votes on non-ready movies (loading/error) — freed back to the budget.
  // Returns true when any vote was removed.
  function stripUnvotableVotes() {
    let changed = false;
    for (const id of Object.keys(state.byId)) {
      const m = board.movies.find((x) => x.id === id);
      if (m && !isVotable(m)) {
        delete state.byId[id];
        changed = true;
      }
    }
    return changed;
  }

  const allocated = (movie) => state.byId[movie.id] || 0;
  const totalAllocated = () =>
    Object.values(state.byId).reduce((sum, n) => sum + n, 0);
  const remaining = () => state.budget - totalAllocated();

  // Display order is the board's insertion order — votes never move cards.
  // (Winner selection lives in winner.js and only runs on reveal.)
  const maxAllocated = () => Math.max(1, ...board.list().map((m) => allocated(m)));

  function trimExcess() {
    while (totalAllocated() > state.budget) {
      const list = board.list();
      if (list.length === 0) break;
      const biggest = list.reduce((best, m) => (allocated(m) > allocated(best) ? m : best), list[0]);
      state.byId[biggest.id] -= 1;
      if (state.byId[biggest.id] <= 0) delete state.byId[biggest.id];
    }
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  /* ------------------------------------------------------------------
   * Poster fallback
   * ------------------------------------------------------------------ */

  const POSTER_FALLBACK =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">` +
        `<rect width="400" height="600" fill="#14100c"/>` +
        `<rect x="22" y="22" width="356" height="556" rx="14" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>` +
        `<circle cx="200" cy="240" r="80" fill="none" stroke="rgba(62,225,255,0.6)" stroke-width="3" stroke-dasharray="10 14"/>` +
        `<text x="200" y="252" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#f5a524" letter-spacing="6">★</text>` +
        `<text x="200" y="430" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#f6f1ea" letter-spacing="4">NO POSTER</text>` +
        `<text x="200" y="462" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#b0a698">the print hasn't arrived yet</text>` +
        `</svg>`
    );

  const POSTER_IMG = (movie) =>
    `<img class="menu__poster" src="${esc(
      movie.posterUrl || POSTER_FALLBACK
    )}" alt="${esc(movie.title || "Movie")} poster" loading="lazy" onerror="this.onerror=null;this.src='${POSTER_FALLBACK}';this.classList.add('menu__poster--fallback')">`;

  /* ------------------------------------------------------------------
   * DOM refs
   * ------------------------------------------------------------------ */

  const grid = document.getElementById("movie-grid");
  const boardNote = document.getElementById("board-note");
  const budgetValue = document.getElementById("budget-value");
  const budgetRemaining = document.getElementById("budget-remaining");
  const budgetProgress = document.getElementById("budget-progress");
  const budgetBar = document.getElementById("budget-bar");
  const showWinnerBtn = document.getElementById("show-winner");
  const adderForm = document.getElementById("adder-form");
  const adderInput = document.getElementById("imdb-input");
  const adderAdd = document.getElementById("adder-add");
  const gistInput = document.getElementById("gist-input");
  const gistImportBtn = document.getElementById("gist-import");
  const boardCountChip = document.getElementById("board-count-chip");
  const votesPill = document.getElementById("votes-pill");
  const votesPillLabel = document.getElementById("votes-pill-label");
  const clearAllBtn = document.getElementById("clear-all");
  const toastRegion = document.getElementById("toast-region");
  const modal = document.getElementById("clear-modal");
  const modalCount = document.getElementById("clear-modal-count");
  const clearConfirm = document.getElementById("clear-confirm");

  const ORBIT_C = 2 * Math.PI * 15.5;

  /* ------------------------------------------------------------------
   * Vote cluster helper — shared by cardHtml and hydrateCard
   * ------------------------------------------------------------------ */

  function voteClusterHtml(movie, share) {
    const votes = allocated(movie);
    const votable = isVotable(movie);
    const canInc = votable && remaining() > 0;
    const canDec = votable && votes > 0;
    return `
            <div class="vote">
              <button
                class="vote__btn vote__btn--dec"
                type="button"
                data-vote="${esc(movie.id)}"
                data-direction="dec"
                aria-label="Remove a vote from ${esc(movie.title || movie.id)}"
                ${canDec ? "" : "disabled"}
              ><span aria-hidden="true">−</span></button>
              <div class="vote__counter" aria-hidden="true">
                <svg viewBox="0 0 40 40">
                  <circle class="counter__track" cx="20" cy="20" r="15.5"></circle>
                  <circle class="counter__arc" cx="20" cy="20" r="15.5"
                    stroke-dasharray="${(share * ORBIT_C).toFixed(1)} ${ORBIT_C.toFixed(1)}"></circle>
                </svg>
                <span class="vote__score">${votes}</span>
              </div>
              <button
                class="vote__btn vote__btn--inc"
                type="button"
                data-vote="${esc(movie.id)}"
                data-direction="inc"
                aria-label="Add a vote to ${esc(movie.title || movie.id)}"
                ${canInc ? "" : "disabled"}
              ><span aria-hidden="true">+</span></button>
            </div>`;
  }

  function syncVoteCluster(li, movie) {
    const voteWrap = li.querySelector(".menu__vote");
    if (!voteWrap) return;
    const max = maxAllocated();
    const share = allocated(movie) / max;
    voteWrap.innerHTML = voteClusterHtml(movie, share);
    // Also sync score/arc if implementation prefers in-place text/attr update;
    // replacing innerHTML is equivalent and keeps the source of truth in one place.
  }

  /* ------------------------------------------------------------------
   * Card rendering
   * ------------------------------------------------------------------ */

  function cardHtml(movie, rank, share) {
    const loading = movie.status === "loading";
    const titleText = loading
      ? "Loading…"
      : movie.title || (movie.status === "error" ? "Unavailable" : "—");
    const yearText = movie.year != null ? String(movie.year) : "—";

    const posterInner = loading
      ? `<div class="menu__poster-skeleton" aria-hidden="true"></div>`
      : POSTER_IMG(movie);

    return `
      <li class="menu__card" data-id="${esc(movie.id)}">
        <button
          type="button"
          class="menu__remove"
          data-remove="${esc(movie.id)}"
          aria-label="Remove ${esc(movie.title || movie.id)} from the shortlist"
        ><span aria-hidden="true">×</span></button>
        <div class="menu__rank" aria-hidden="true">${rank}</div>
        <div class="menu__poster-wrap">
          ${posterInner}
        </div>
        <div class="menu__meta">
          <h3 class="menu__title">${esc(titleText)}</h3>
          <div class="menu__badges">
            <span class="badge badge--year">${esc(yearText)}</span>
            <a
              class="badge badge--link"
              href="https://www.imdb.com/title/${esc(movie.id)}/"
              target="_blank"
              rel="noopener noreferrer"
            >IMDb <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div class="menu__vote">
          ${voteClusterHtml(movie, share)}
        </div>
      </li>`;
  }

  function render({ focusMovieId, focusDirection } = {}) {
    const movies = board.list(); // insertion order — never vote-sorted
    const max = maxAllocated();

    if (movies.length === 0) {
      grid.innerHTML = `
        <li class="menu__empty" role="status">
          <h3>Your shortlist is empty</h3>
          <p>Paste an IMDb link above or import a gist to build tonight's feature.</p>
        </li>`;
    } else {
      grid.innerHTML = movies
        .map((m, i) => cardHtml(m, i + 1, allocated(m) / max))
        .join("");
    }

    if (voted) document.body.classList.add("has-voted");

    budgetValue.textContent = String(state.budget);
    const left = remaining();
    budgetRemaining.textContent = `${left} ${left === 1 ? "vote" : "votes"} left`;

    const empty = movies.length === 0;
    boardNote.textContent = empty
      ? "Build tonight's shortlist — paste an IMDb link or import a gist."
      : "Allocate your votes quietly — the winner comes out when you call it.";

    clearAllBtn.disabled = empty;
    showWinnerBtn.disabled = empty;
    renderTopbar();

    const full = board.isFull();
    adderAdd.disabled = full;
    adderInput.disabled = full;
    adderInput.placeholder = full
      ? "Board is full (9 / 9)"
      : "Paste an IMDb link, e.g. https://www.imdb.com/title/tt0118881/";

    if (focusMovieId) {
      const card = grid.querySelector(`[data-id="${CSS.escape(focusMovieId)}"]`);
      let btn = null;
      if (focusDirection === "remove") {
        btn = card?.querySelector(`[data-remove]`);
      } else {
        btn = card?.querySelector(
          `[data-vote="${CSS.escape(focusMovieId)}"][data-direction="${focusDirection}"]`
        );
        // If the target vote button is disabled (non-ready card), fall back to remove button.
        if (btn && btn.disabled) {
          btn = card?.querySelector(`[data-remove]`);
        }
      }
      btn?.focus();
      // If focus still landed on body (disabled button lost focus), try remove button.
      if (document.activeElement === document.body && card) {
        const fallback = card.querySelector(`[data-remove]`);
        fallback?.focus();
      }
    }
  }

  // ---- Navbar status + budget progress ------------------------------------

  // The navbar is the page's status surface: board count, missing votes, and
  // whether the reveal can be used. All arithmetic lives in topbar.js.
  function renderTopbar() {
    const model = window.Topbar.view({
      budget: state.budget,
      allocated: totalAllocated(),
      count: board.count(),
      limit: MAX_CARDS,
    });

    boardCountChip.textContent = model.chip;

    votesPillLabel.textContent = model.pill.label;
    votesPill.classList.toggle("pill--ready", model.pill.state === "ready");
    votesPill.classList.toggle("pill--missing", model.pill.state === "missing");
    votesPill.setAttribute("aria-label", model.pill.ariaLabel);

    const given = Math.min(state.budget, totalAllocated());
    const pct = state.budget > 0 ? Math.round((given / state.budget) * 100) : 0;
    budgetBar.style.width = pct + "%";
    budgetProgress.setAttribute("aria-valuemax", String(state.budget));
    budgetProgress.setAttribute("aria-valuenow", String(given));
  }

  // In-place update of a single card after hydration (no full re-render,
  // so other cards don't replay their entrance animation).
  function hydrateCard(id) {
    const li = grid.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!li) return;
    const m = board.movies.find((x) => x.id === id);
    if (!m) return;
    const activeEl = document.activeElement;
    const wasFocusedVote = activeEl && li.contains(activeEl) && activeEl.hasAttribute("data-vote");
    // If the focused vote button is about to become disabled, remember to move focus.
    const posterLoading = m.status === "loading";
    const wrap = li.querySelector(".menu__poster-wrap");
    if (wrap) {
      wrap.innerHTML = posterLoading
        ? `<div class="menu__poster-skeleton" aria-hidden="true"></div>`
        : POSTER_IMG(m);
    }
    const titleEl = li.querySelector(".menu__title");
    if (titleEl)
      titleEl.textContent =
        m.title || (m.status === "error" ? "Unavailable" : "—");
    const yearBadge = li.querySelector(".badge--year");
    if (yearBadge) {
      yearBadge.textContent = m.year != null ? String(m.year) : "—";
    }
    // Sync vote cluster in place (buttons, counter, arc) — shared helper.
    syncVoteCluster(li, m);
    // If focus was on a vote button that just became disabled, move to remove button.
    if (wasFocusedVote) {
      const newVoteBtn = li.querySelector(`[data-vote="${CSS.escape(id)}"][data-direction="${activeEl.dataset.direction}"]`);
      if (newVoteBtn && newVoteBtn.disabled) {
        const removeBtn = li.querySelector(`[data-remove]`);
        removeBtn?.focus();
      }
    }
  }

  /* ------------------------------------------------------------------
   * Feedback
   * ------------------------------------------------------------------ */

  // Every user-facing message now goes through one channel: the toast region.
  const toaster = window.Toaster.createToaster({ container: toastRegion });

  function showFeedback(message, isError) {
    toaster.show(message, { type: isError ? "error" : "info" });
  }

  // One-line human summary of an add/import result, shared by paste,
  // paste, and gist imports.
  function summaryText(summary) {
    const added = summary.addedIds.length;
    const parts = [];
    if (added > 0)
      parts.push(`Added ${added} ${added === 1 ? "movie" : "movies"}`);
    if (summary.duplicates > 0)
      parts.push(`${summary.duplicates} duplicate${summary.duplicates === 1 ? "" : "s"}`);
    if (summary.invalid > 0)
      parts.push(`${summary.invalid} invalid`);
    if (summary.skipped > 0)
      parts.push(`${summary.skipped} skipped (board full)`);
    return parts.join(" · ");
  }

  function summarize(summary) {
    const added = summary.addedIds.length;
    if (added > 0) {
      showFeedback(summaryText(summary), false);
    } else if (summary.duplicates > 0) {
      showFeedback("That movie is already on the board.", true);
    } else if (summary.invalid > 0) {
      showFeedback("That doesn't look like a valid IMDb link.", true);
    } else if (summary.skipped > 0) {
      showFeedback("Board is full (9 / 9).", true);
    }
  }

  /* ------------------------------------------------------------------
   * Add pipeline (paste + gist)
   * ------------------------------------------------------------------ */

  // All hydration flows through one queue with a small bounded concurrency
  // (one slot per proxy) and a paced gap between launches, so a bulk import is
  // quick without burst-rating any single CORS proxy. Requests are deduped and
  // cached per session by movie id (see the metadata-fetch spec).
  const hydrateQueue = window.Queue.createQueue({
    worker: (id) => window.Imdb.fetchTitle(id),
    concurrency: window.Imdb.PROXIES.length,
    gap: 150,
    jitter: 250,
  });

  // The queue owns the network call, so a failed fetch rejects (and is never
  // cached); the board + card update happens in the handlers here.
  function enqueueHydration(id) {
    return hydrateQueue.enqueue(id, id).then(
      (details) => {
        if (!board.hasId(id)) return; // removed while awaiting
        board.hydrate(id, details);
        hydrateCard(id);
      },
      () => {
        if (!board.hasId(id)) return;
        board.hydrate(id, null);
        const hadVotes = state.byId[id] != null;
        const stripped = stripUnvotableVotes();
        if (stripped) saveState();
        hydrateCard(id);
        if (stripped) renderTopbar();
        if (hadVotes && stripped) {
          const m = board.movies.find((x) => x.id === id);
          const label = (m && m.title) || id;
          showFeedback(`Votes returned — "${label}" didn't load.`, false);
        }
      }
    );
  }

  async function handleAdd(rawValue) {
    const summary = board.addFromText(rawValue);
    render();
    summarize(summary);
    for (const id of summary.addedIds) {
      enqueueHydration(id);
    }
    return summary;
  }

  adderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = adderInput.value.trim();
    if (!value) return;
    handleAdd(value);
    adderInput.value = "";
  });

  /* ------------------------------------------------------------------
   * Gist import
   * ------------------------------------------------------------------ */

  const GIST_ERRORS = {
    "bad-ref": "That doesn't look like a gist URL or ID.",
    network: "Could not reach GitHub — check the connection and try again.",
    "not-found": "That gist doesn't exist (or is private).",
    "rate-limited": "GitHub rate limit reached — try again in a few minutes.",
    "no-text-file": "That gist has no .txt file to import.",
  };

  const GIST_LIST_ERRORS = {
    "bad-user": "That doesn't look like a valid GitHub username.",
    network: "Could not reach GitHub — check the connection and try again.",
    "rate-limited": "GitHub rate limit reached — try again in a few minutes.",
    "no-importable-gist":
      "That user has no gist with a .txt file to import.",
  };

  const GIST_URL_RE = /gist\.github(?:usercontent)?\.com\/(?:[^/\s]+\/)?([0-9a-f]{32})(?:[/?#]|$)/i;
  const GIST_BARE_ID_RE = /^[0-9a-f]{32}$/i;
  const GIST_USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

  function classifyGistRef(text) {
    const s = String(text || "").trim();
    if (!s) return "empty";
    if (GIST_URL_RE.test(s)) return "url";
    if (GIST_BARE_ID_RE.test(s)) return "id";
    if (GIST_USERNAME_RE.test(s)) return "username";
    return "invalid";
  }

  /* ------------------------------------------------------------------
   * Gist username persistence
   * ------------------------------------------------------------------ */

  const GIST_USER_KEY = "gistUser.v1";

  function loadGistUser() {
    try {
      return window.localStorage.getItem(GIST_USER_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveGistUser(username) {
    try {
      if (username) {
        window.localStorage.setItem(GIST_USER_KEY, username);
      } else {
        window.localStorage.removeItem(GIST_USER_KEY);
      }
    } catch {
      /* storage unavailable */
    }
  }

  /* ------------------------------------------------------------------
   * Gist picklist
   * ------------------------------------------------------------------ */

  const gistPicklist = document.getElementById("gist-picklist");

  function clearPicklist() {
    if (gistPicklist) gistPicklist.innerHTML = "";
  }

  function renderPicklist(gists) {
    if (!gistPicklist) return;
    gistPicklist.innerHTML = "";
    for (const g of gists) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gist-picklist__item";
      btn.dataset.gistId = g.id;
      const dateStr = g.date
        ? new Date(g.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      btn.innerHTML = `<span class="gist-picklist__title">${esc(g.title)}</span>${dateStr ? `<span class="gist-picklist__date">${esc(dateStr)}</span>` : ""}`;
      btn.addEventListener("click", () => handlePicklistSelect(g.id));
      gistPicklist.appendChild(btn);
    }
    // Focus the first item for D-pad navigation
    const first = gistPicklist.querySelector(".gist-picklist__item");
    if (first) first.focus();
  }

  async function handlePicklistSelect(gistId) {
    clearPicklist();
    gistImportBtn.disabled = true;
    try {
      const { name, content } = await window.Gist.fetchGistText(gistId);
      const summary = await handleAdd(content);
      showFeedback(`Imported ${name}: ${summaryText(summary)}`, false);
      gistInput.value = "";
    } catch (err) {
      showFeedback(
        GIST_ERRORS[(err && err.code) || ""] ||
          "Could not import that gist.",
        true
      );
    } finally {
      gistImportBtn.disabled = false;
    }
  }

  async function handleGistImport() {
    const ref = gistInput.value.trim();
    if (!ref) {
      showFeedback("Paste a gist URL or ID first.", true);
      gistInput.focus();
      return;
    }

    const kind = classifyGistRef(ref);

    if (kind === "empty" || kind === "invalid") {
      showFeedback("That doesn't look like a gist URL, ID, or username.", true);
      gistInput.focus();
      return;
    }

    if (kind === "url" || kind === "id") {
      gistImportBtn.disabled = true;
      try {
        const { name, content } = await window.Gist.fetchGistText(ref);
        const summary = await handleAdd(content);
        showFeedback(`Imported ${name}: ${summaryText(summary)}`, false);
        gistInput.value = "";
      } catch (err) {
        showFeedback(
          GIST_ERRORS[(err && err.code) || ""] ||
            "Could not import that gist.",
          true
        );
      } finally {
        gistImportBtn.disabled = false;
      }
      return;
    }

    // Username discovery
    gistImportBtn.disabled = true;
    clearPicklist();
    try {
      const gists = await window.GistsList.listUserGists(ref);
      saveGistUser(ref);
      renderPicklist(gists);
    } catch (err) {
      showFeedback(
        GIST_LIST_ERRORS[(err && err.code) || ""] ||
          "Could not fetch gists for that user.",
        true
      );
    } finally {
      gistImportBtn.disabled = false;
    }
  }

  gistImportBtn.addEventListener("click", handleGistImport);
  gistInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGistImport();
    }
    if (e.key === "Escape" && gistPicklist && gistPicklist.children.length > 0) {
      clearPicklist();
    }
  });

  // Prefill remembered username on boot
  const savedUser = loadGistUser();
  if (savedUser && !gistInput.value) {
    gistInput.value = savedUser;
    gistInput.placeholder = savedUser
      ? `Username: ${savedUser} — or paste a gist URL`
      : gistInput.placeholder;
  }

  /* ------------------------------------------------------------------
   * Voting
   * ------------------------------------------------------------------ */

  function setBudget(next) {
    const clamped = Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(next)));
    if (clamped === state.budget) return;
    state.budget = clamped;
    trimExcess();
    saveState();
    render();
  }

  function addVote(movieId) {
    if (remaining() <= 0) return;
    const m = board.movies.find((x) => x.id === movieId);
    if (m && !isVotable(m)) return;
    state.byId[movieId] = (state.byId[movieId] || 0) + 1;
    voted = true;
    saveState();
    render({ focusMovieId: movieId, focusDirection: "inc" });
  }

  function removeVote(movieId) {
    if (!state.byId[movieId]) return;
    const m = board.movies.find((x) => x.id === movieId);
    if (m && !isVotable(m)) return;
    state.byId[movieId] -= 1;
    if (state.byId[movieId] <= 0) delete state.byId[movieId];
    voted = true;
    saveState();
    render({ focusMovieId: movieId, focusDirection: "dec" });
  }

  function removeMovie(id) {
    if (!board.hasId(id)) return;
    const ordered = board.list(); // display order = insertion order
    const idx = ordered.findIndex((m) => m.id === id);
    board.remove(id);
    pruneOrphanVotes();
    saveState();
    const next = ordered[idx + 1] || ordered[idx - 1] || null;
    render({ focusMovieId: next ? next.id : null, focusDirection: next ? "remove" : null });
    if (!next) adderInput.focus();
    showFeedback("Removed from the shortlist.", false);
  }

  grid.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      removeMovie(removeBtn.dataset.remove);
      return;
    }
    const btn = event.target.closest("[data-vote]");
    if (!btn) return;
    const movieId = btn.dataset.vote;
    if (btn.dataset.direction === "inc") addVote(movieId);
    else removeVote(movieId);
  });

  document.getElementById("budget-minus").addEventListener("click", () =>
    setBudget(state.budget - 1)
  );
  document.getElementById("budget-plus").addEventListener("click", () =>
    setBudget(state.budget + 1)
  );

  /* ------------------------------------------------------------------
   * Winner reveal (blind voting — the only winner view)
   * ------------------------------------------------------------------ */

  const winnerModal = document.getElementById("winner-modal");
  const winnerHero = document.getElementById("winner-hero");
  const winnerRows = document.getElementById("winner-rows");

  // Refuses while any vote is unallocated; otherwise opens the results
  // modal fresh from a new tally every time.
  showWinnerBtn.addEventListener("click", () => {
    const result = window.Winner.tallyResults(
      board.list(),
      state.byId,
      state.budget
    );
    if (!result.ok) {
      if (result.reason === "missing-votes") {
        showFeedback(
          `Allocate ${result.remaining} more ${result.remaining === 1 ? "vote" : "votes"} before revealing the winner.`,
          true
        );
      } else if (result.reason === "no-votable-movies") {
        showFeedback("None of tonight's movies loaded — nothing to reveal yet.", true);
      } else {
        showFeedback("Add some movies to the board first.", true);
      }
      return;
    }
    openWinnerModal(result);
  });

  function renderReveal(result) {
    const winner =
      result.rows.find((r) => r.id === result.winnerId) || result.rows[0];
    winnerHero.innerHTML = `
      <div class="winner-hero__poster">${POSTER_IMG(winner)}</div>
      <div class="winner-hero__meta">
        <p class="winner-hero__pct" aria-hidden="true">${winner.pct}%</p>
        <h3 class="winner-hero__title">${esc(winner.title || "—")}</h3>
        <p class="winner-hero__sub">
          ${winner.year != null ? `${esc(String(winner.year))} · ` : ""}${winner.votes} ${winner.votes === 1 ? "vote" : "votes"}
        </p>
      </div>`;
    winnerRows.innerHTML = result.rows
      .map(
        (r, i) => `
        <li class="winner-row${r.id === result.winnerId ? " winner-row--winner" : ""}">
          <span class="winner-row__rank" aria-hidden="true">${i + 1}</span>
          <img class="winner-row__thumb" src="${esc(
            r.posterUrl || POSTER_FALLBACK
          )}" alt="" loading="lazy"
            onerror="this.onerror=null;this.src='${POSTER_FALLBACK}';">
          <span class="winner-row__title">${esc(r.title || "—")}</span>
          <span class="winner-row__votes">${r.votes} ${r.votes === 1 ? "vote" : "votes"}</span>
          <span class="winner-row__pct" aria-hidden="true">${r.pct}%</span>
        </li>`
      )
      .join("");
  }

  /* ------------------------------------------------------------------
   * Clear-all modal
   * ------------------------------------------------------------------ */

  let lastFocused = null;

  // Shared focus trap: Escape closes, Tab cycles within the dialog.
  function trapKey(container, closeFn) {
    return function onModalKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFn();
        return;
      }
      if (e.key === "Tab") {
        const focusables = container.querySelectorAll("button:not([disabled])");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
  }

  const onClearModalKey = trapKey(modal, closeModal);

  function openModal() {
    if (board.count() === 0) return;
    lastFocused = document.activeElement;
    modalCount.textContent = String(board.count());
    modal.hidden = false;
    clearConfirm.focus();
    document.addEventListener("keydown", onClearModalKey);
  }

  function closeModal() {
    modal.hidden = true;
    document.removeEventListener("keydown", onClearModalKey);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeModal();
  });

  clearConfirm.addEventListener("click", () => {
    board.clear();
    state.byId = {};
    saveState();
    closeModal();
    render();
    showFeedback("Board cleared.", false);
  });

  clearAllBtn.addEventListener("click", openModal);

  /* ------------------------------------------------------------------
   * Winner results modal
   * ------------------------------------------------------------------ */

  let revealFocusReturn = null;
  const onWinnerModalKey = trapKey(winnerModal, closeWinnerModal);

  function openWinnerModal(result) {
    renderReveal(result); // fresh tally on every open
    revealFocusReturn = document.activeElement;
    winnerModal.hidden = false;
    winnerModal.classList.add("celebrating"); // burst tied to open state
    const firstBtn = winnerModal.querySelector("button:not([disabled])");
    if (firstBtn) firstBtn.focus();
    document.addEventListener("keydown", onWinnerModalKey);
  }

  function closeWinnerModal() {
    winnerModal.hidden = true;
    winnerModal.classList.remove("celebrating"); // stops the celebration
    document.removeEventListener("keydown", onWinnerModalKey);
    if (revealFocusReturn && typeof revealFocusReturn.focus === "function") {
      revealFocusReturn.focus();
    }
  }

  winnerModal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeWinnerModal();
  });

  /* ------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------ */

  (async () => {
    board.load();
    pruneOrphanVotes();
    if (stripUnvotableVotes()) saveState();
    render();
    const unresolved = board.needsHydration();
    for (const m of unresolved) {
      enqueueHydration(m.id);
    }
  })();
})();
