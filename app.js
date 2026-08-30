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

  const allocated = (movie) => state.byId[movie.id] || 0;
  const totalAllocated = () =>
    Object.values(state.byId).reduce((sum, n) => sum + n, 0);
  const remaining = () => state.budget - totalAllocated();

  const rankMovies = () =>
    [...board.list()].sort(
      (a, b) => allocated(b) - allocated(a) || (a.id < b.id ? -1 : 1)
    );

  const maxAllocated = () => Math.max(1, ...board.list().map((m) => allocated(m)));

  function trimExcess() {
    while (totalAllocated() > state.budget) {
      const biggest = board
        .list()
        .reduce((best, m) => (allocated(m) > allocated(best) ? m : best));
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
        `<rect width="400" height="600" fill="#0d1017"/>` +
        `<rect x="22" y="22" width="356" height="556" rx="14" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>` +
        `<circle cx="200" cy="240" r="80" fill="none" stroke="rgba(62,225,255,0.6)" stroke-width="3" stroke-dasharray="10 14"/>` +
        `<text x="200" y="252" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#3ee1ff" letter-spacing="6">★</text>` +
        `<text x="200" y="430" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#eef1f6" letter-spacing="4">NO POSTER</text>` +
        `<text x="200" y="462" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#9aa4b2">the print hasn't arrived yet</text>` +
        `</svg>`
    );

  const HERO_DEFAULT =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%230d1017'/%3E%3Ctext x='100' y='158' text-anchor='middle' font-family='sans-serif' font-size='40' fill='%233ee1ff'%3E%E2%98%85%3C/text%3E%3C/svg%3E";

  const POSTER_IMG = (movie) =>
    `<img class="menu__poster" src="${esc(
      movie.posterUrl || POSTER_FALLBACK
    )}" alt="${esc(movie.title || "Movie")} poster" loading="lazy" onerror="this.onerror=null;this.src='${POSTER_FALLBACK}';this.classList.add('menu__poster--fallback')">`;

  /* ------------------------------------------------------------------
   * DOM refs
   * ------------------------------------------------------------------ */

  const grid = document.getElementById("movie-grid");
  const boardNote = document.getElementById("board-note");
  const heroPoster = document.getElementById("hero-winner-poster");
  const heroTitle = document.getElementById("hero-winner-title");
  const heroVotes = document.getElementById("hero-winner-votes");
  const budgetValue = document.getElementById("budget-value");
  const budgetRemaining = document.getElementById("budget-remaining");
  const showWinnerBtn = document.getElementById("show-winner");
  const adderForm = document.getElementById("adder-form");
  const adderInput = document.getElementById("imdb-input");
  const adderAdd = document.getElementById("adder-add");
  const txtInput = document.getElementById("txt-input");
  const boardCount = document.getElementById("board-count");
  const clearAllBtn = document.getElementById("clear-all");
  const feedback = document.getElementById("adder-feedback");
  const modal = document.getElementById("clear-modal");
  const modalCount = document.getElementById("clear-modal-count");
  const clearConfirm = document.getElementById("clear-confirm");

  const ORBIT_C = 2 * Math.PI * 15.5;
  const scoreOrDash = (value) => (value == null ? "—" : value.toFixed(1));

  /* ------------------------------------------------------------------
   * Card rendering
   * ------------------------------------------------------------------ */

  function cardHtml(movie, rank, share) {
    const votes = allocated(movie);
    const isWinner = rank === 1;
    const canInc = remaining() > 0;
    const canDec = votes > 0;
    const loading = movie.status === "loading";
    const titleText = loading
      ? "Loading…"
      : movie.title || (movie.status === "error" ? "Unavailable" : "—");
    const yearText = movie.year != null ? String(movie.year) : "—";

    const posterInner = loading
      ? `<div class="menu__poster-skeleton" aria-hidden="true"></div>`
      : POSTER_IMG(movie);

    return `
      <li class="menu__card${isWinner ? " menu__card--winner" : ""}" data-id="${esc(movie.id)}">
        <button
          type="button"
          class="menu__remove"
          data-remove="${esc(movie.id)}"
          aria-label="Remove ${esc(movie.title || movie.id)} from the shortlist"
        ><span aria-hidden="true">×</span></button>
        <div class="menu__rank" aria-hidden="true">${rank}</div>
        ${
          isWinner
            ? `<div class="menu__winner-chip" aria-hidden="true">Winner</div>`
            : ""
        }
        <div class="menu__poster-wrap">
          ${posterInner}
        </div>
        <div class="menu__meta">
          <h3 class="menu__title">${esc(titleText)}</h3>
          <p class="menu__year">${yearText}</p>
          <div class="menu__badges">
            <span class="badge badge--imdb">${scoreOrDash(movie.rating)}</span>
          </div>
        </div>
        <div class="menu__vote">
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
          </div>
        </div>
      </li>`;
  }

  function render({ focusMovieId, focusDirection } = {}) {
    const ranked = rankMovies();
    const max = maxAllocated();

    if (ranked.length === 0) {
      grid.innerHTML = `
        <li class="menu__empty" role="status">
          <h3>Your shortlist is empty</h3>
          <p>Paste an IMDb link above or import a .txt file to build tonight's feature.</p>
        </li>`;
    } else {
      grid.innerHTML = ranked
        .map((m, i) => cardHtml(m, i + 1, allocated(m) / max))
        .join("");
    }

    if (voted) document.body.classList.add("has-voted");

    budgetValue.textContent = String(state.budget);
    const left = remaining();
    budgetRemaining.textContent = `${left} ${left === 1 ? "vote" : "votes"} left`;

    const empty = ranked.length === 0;
    const leader = ranked[0];

    if (empty) {
      heroPoster.src = HERO_DEFAULT;
      heroPoster.alt = "No movie selected yet";
      heroTitle.textContent = "—";
      heroVotes.textContent = "";
      boardNote.textContent =
        "Build tonight's shortlist — paste an IMDb link or import a .txt file.";
    } else {
      heroPoster.src = leader.posterUrl || POSTER_FALLBACK;
      heroPoster.alt = `${leader.title || "Movie"} poster`;
      heroTitle.textContent = leader.title || "—";
      heroVotes.textContent = `${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"} · ${leader.year || ""}`;
      boardNote.textContent = `★ ${leader.title || "—"} is winning with ${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"}.`;
    }

    boardCount.textContent = `${board.count()} / ${MAX_CARDS}`;
    clearAllBtn.disabled = empty;
    showWinnerBtn.disabled = empty;

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
      }
      btn?.focus();
    }
  }

  // In-place update of a single card after hydration (no full re-render,
  // so other cards don't replay their entrance animation).
  function hydrateCard(id) {
    const li = grid.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!li) return;
    const m = board.movies.find((x) => x.id === id);
    if (!m) return;
    const wrap = li.querySelector(".menu__poster-wrap");
    if (wrap) wrap.innerHTML = POSTER_IMG(m);
    const titleEl = li.querySelector(".menu__title");
    if (titleEl)
      titleEl.textContent =
        m.title || (m.status === "error" ? "Unavailable" : "—");
    const yearEl = li.querySelector(".menu__year");
    if (yearEl) yearEl.textContent = m.year != null ? String(m.year) : "—";
    const badge = li.querySelector(".badge--imdb");
    if (badge) badge.textContent = scoreOrDash(m.rating);
    li.classList.remove("menu__card--loading");
  }

  /* ------------------------------------------------------------------
   * Feedback
   * ------------------------------------------------------------------ */

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.classList.toggle("adder__feedback--error", Boolean(isError));
  }

  function summarize(summary) {
    const added = summary.addedIds.length;
    if (added > 0) {
      const parts = [`Added ${added} ${added === 1 ? "movie" : "movies"}`];
      if (summary.duplicates > 0)
        parts.push(`${summary.duplicates} duplicate${summary.duplicates === 1 ? "" : "s"}`);
      if (summary.invalid > 0)
        parts.push(`${summary.invalid} invalid`);
      if (summary.skipped > 0)
        parts.push(`${summary.skipped} skipped (board full)`);
      showFeedback(parts.join(" · "), false);
    } else if (summary.duplicates > 0) {
      showFeedback("That movie is already on the board.", true);
    } else if (summary.invalid > 0) {
      showFeedback("That doesn't look like a valid IMDb link.", true);
    } else if (summary.skipped > 0) {
      showFeedback("Board is full (9 / 9).", true);
    }
  }

  /* ------------------------------------------------------------------
   * Add pipeline (paste + TXT)
   * ------------------------------------------------------------------ */

  // All hydration flows through one serial queue (concurrency 1) with a short
  // randomized gap between movies, so a bulk import doesn't burst-rate the
  // CORS proxies (see resilient-metadata-fetch design).
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const hydrateQueue = (() => {
    let tail = Promise.resolve();
    function enqueue(job) {
      tail = tail.then(async () => {
        try {
          await job();
        } catch {
          /* hydrateOne handles its own failures */
        } finally {
          await sleep(300 + Math.random() * 500);
        }
      });
      return tail;
    }
    return { enqueue };
  })();

  async function hydrateOne(id) {
    if (!board.hasId(id)) return; // removed before hydration started
    try {
      const details = await window.Imdb.fetchTitle(id);
      if (!board.hasId(id)) return; // removed while awaiting
      board.hydrate(id, details);
      hydrateCard(id);
    } catch {
      if (!board.hasId(id)) return;
      board.hydrate(id, null);
      hydrateCard(id);
    }
  }

  async function handleAdd(rawValue) {
    const summary = board.addFromText(rawValue);
    render();
    summarize(summary);
    for (const id of summary.addedIds) {
      hydrateQueue.enqueue(() => hydrateOne(id));
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

  txtInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleAdd(String(reader.result || ""));
    };
    reader.onerror = () => showFeedback("Could not read that file.", true);
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file
  });

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
    state.byId[movieId] = (state.byId[movieId] || 0) + 1;
    voted = true;
    saveState();
    render({ focusMovieId: movieId, focusDirection: "inc" });
  }

  function removeVote(movieId) {
    if (!state.byId[movieId]) return;
    state.byId[movieId] -= 1;
    if (state.byId[movieId] <= 0) delete state.byId[movieId];
    voted = true;
    saveState();
    render({ focusMovieId: movieId, focusDirection: "dec" });
  }

  function removeMovie(id) {
    if (!board.hasId(id)) return;
    const ranked = rankMovies();
    const idx = ranked.findIndex((m) => m.id === id);
    board.remove(id);
    pruneOrphanVotes();
    saveState();
    const next = ranked[idx + 1] || ranked[idx - 1] || null;
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
   * Winner celebration
   * ------------------------------------------------------------------ */

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  showWinnerBtn.addEventListener("click", () => {
    if (board.count() === 0) return;
    const leader = rankMovies()[0];
    const card = grid.querySelector(`[data-id="${CSS.escape(leader.id)}"]`);
    if (!card) return;
    card.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    card.classList.add("celebrating");
    boardNote.textContent = `🎉 ${leader.title || "—"} is the winner with ${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"}!`;
    window.setTimeout(() => card.classList.remove("celebrating"), 2600);
  });

  /* ------------------------------------------------------------------
   * Clear-all modal
   * ------------------------------------------------------------------ */

  let lastFocused = null;

  function onModalKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll("button:not([disabled])");
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
  }

  function openModal() {
    if (board.count() === 0) return;
    lastFocused = document.activeElement;
    modalCount.textContent = String(board.count());
    modal.hidden = false;
    clearConfirm.focus();
    document.addEventListener("keydown", onModalKey);
  }

  function closeModal() {
    modal.hidden = true;
    document.removeEventListener("keydown", onModalKey);
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
   * Boot
   * ------------------------------------------------------------------ */

  (async () => {
    board.load();
    pruneOrphanVotes();
    render();
    const unresolved = board.needsHydration();
    for (const m of unresolved) {
      hydrateQueue.enqueue(() => hydrateOne(m.id));
    }
  })();
})();
