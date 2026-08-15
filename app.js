(() => {
  "use strict";

  /* ------------------------------------------------------------------
   * Data + state
   * ------------------------------------------------------------------ */

  const STORAGE_KEY = "movieVotes.v1";
  const DEFAULT_BUDGET = 10;
  const MIN_BUDGET = 1;
  const MAX_BUDGET = 99;

  // Vote state: { budget: number, byId: { [movieId]: allocatedVotes } }
  // The visitor decides how many votes they have (the budget) and then
  // distributes them across movies with per-movie + / − counters.
  let state = loadState();

  function freshState() {
    return { budget: DEFAULT_BUDGET, byId: {} };
  }

  // Guarded localStorage read (spec: votes persist per browser; page must
  // still work when storage is unavailable). The payload shape changed from
  // the old toggle deltas — anything that isn't the new shape resets.
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

  const allocated = (movie) => state.byId[movie.id] || 0;
  const totalAllocated = () =>
    Object.values(state.byId).reduce((sum, n) => sum + n, 0);
  const remaining = () => state.budget - totalAllocated();

  const rankMovies = () =>
    [...MOVIES].sort(
      (a, b) => allocated(b) - allocated(a) || (a.id < b.id ? -1 : 1)
    );

  const maxAllocated = () => Math.max(1, ...MOVIES.map((m) => allocated(m)));

  // Lowering the budget below the allocated total trims votes, one from the
  // movie with the most votes at a time (tie: first in catalog order), until
  // the total fits — the cap is never violated.
  function trimExcess() {
    while (totalAllocated() > state.budget) {
      const biggest = MOVIES.reduce((best, m) =>
        allocated(m) > allocated(best) ? m : best
      );
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
   * Poster fallback (graceful placeholder instead of a broken image)
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

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */

  const grid = document.getElementById("movie-grid");
  const boardNote = document.getElementById("board-note");
  const heroPoster = document.getElementById("hero-winner-poster");
  const heroTitle = document.getElementById("hero-winner-title");
  const heroVotes = document.getElementById("hero-winner-votes");
  const budgetValue = document.getElementById("budget-value");
  const budgetRemaining = document.getElementById("budget-remaining");

  const ORBIT_C = 2 * Math.PI * 15.5; // circumference of the counter ring

  const scoreOrDash = (value) => (value == null ? "—" : value.toFixed(1));

  function cardHtml(movie, rank, share) {
    const votes = allocated(movie);
    const hasTrailer = Boolean(movie.trailerWatchUrl);
    const isWinner = rank === 1;
    const canInc = remaining() > 0;
    const canDec = votes > 0;

    return `
      <li class="menu__card${isWinner ? " menu__card--winner" : ""}" data-id="${esc(movie.id)}">
        <div class="menu__rank" aria-hidden="true">${rank}</div>
        ${
          isWinner
            ? `<div class="menu__winner-chip" aria-hidden="true">Winner</div>`
            : ""
        }
        <div class="menu__poster-wrap">
          <img
            class="menu__poster"
            src="${esc(movie.posterUrl)}"
            alt="${esc(movie.title)} poster (${movie.year})"
            loading="lazy"
            onerror="this.onerror=null;this.src='${POSTER_FALLBACK}';this.classList.add('menu__poster--fallback')"
          />
        </div>
        <div class="menu__meta">
          <h3 class="menu__title">${esc(movie.title)}</h3>
          <p class="menu__year">${movie.year}</p>
          <div class="menu__badges">
            <span class="badge badge--imdb${movie.imdb == null ? " badge--na" : ""}">${scoreOrDash(movie.imdb)}</span>
            <span class="badge badge--rt${movie.rt == null ? " badge--na" : ""}">${movie.rt == null ? "—" : movie.rt + "%"}</span>
          </div>
          ${
            hasTrailer
              ? `<a class="menu__trailer" href="${esc(movie.trailerWatchUrl)}" target="_blank" rel="noopener noreferrer">Trailer</a>`
              : ""
          }
        </div>
        <div class="menu__vote">
          <div class="vote">
            <button
              class="vote__btn vote__btn--dec"
              type="button"
              data-vote="${esc(movie.id)}"
              data-direction="dec"
              aria-label="Remove a vote from ${esc(movie.title)}"
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
              aria-label="Add a vote to ${esc(movie.title)}"
              ${canInc ? "" : "disabled"}
            ><span aria-hidden="true">+</span></button>
          </div>
        </div>
      </li>`;
  }

  function render({ focusMovieId, focusDirection } = {}) {
    const ranked = rankMovies();
    const max = maxAllocated();
    grid.innerHTML = ranked
      .map((m, i) => cardHtml(m, i + 1, allocated(m) / max))
      .join("");

    // Re-renders (after votes) shouldn't replay the entrance animation.
    document.body.classList.add("has-voted");

    // Budget readouts.
    budgetValue.textContent = String(state.budget);
    const left = remaining();
    budgetRemaining.textContent = `${left} ${left === 1 ? "vote" : "votes"} left`;

    // Hero winner card: the leader's pane takes the glow.
    const leader = ranked[0];
    heroPoster.src = leader.posterUrl;
    heroPoster.alt = `${leader.title} poster`;
    heroTitle.textContent = leader.title;
    heroVotes.textContent = `${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"} · ${leader.year}`;

    // Board note announces the leader (aria-live).
    boardNote.textContent = `★ ${leader.title} is winning with ${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"}.`;

    // Restore focus to the control that cast the last vote.
    if (focusMovieId) {
      const card = grid.querySelector(`[data-id="${CSS.escape(focusMovieId)}"]`);
      const btn = card?.querySelector(
        `[data-vote="${CSS.escape(focusMovieId)}"][data-direction="${focusDirection}"]`
      );
      btn?.focus();
    }
  }

  /* ------------------------------------------------------------------
   * Voting — budgeted allocation
   * ------------------------------------------------------------------ */

  function setBudget(next) {
    const clamped = Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(next)));
    if (clamped === state.budget) return;
    state.budget = clamped;
    trimExcess(); // never let allocations exceed the (possibly lowered) budget
    saveState();
    render();
  }

  function addVote(movieId) {
    if (remaining() <= 0) return; // budget is exhausted — extra vote not applied
    state.byId[movieId] = (state.byId[movieId] || 0) + 1;
    saveState();
    render({ focusMovieId: movieId, focusDirection: "inc" });
  }

  function removeVote(movieId) {
    if (!state.byId[movieId]) return;
    state.byId[movieId] -= 1;
    if (state.byId[movieId] <= 0) delete state.byId[movieId];
    saveState();
    render({ focusMovieId: movieId, focusDirection: "dec" });
  }

  grid.addEventListener("click", (event) => {
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

  const showWinnerBtn = document.getElementById("show-winner");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  showWinnerBtn.addEventListener("click", () => {
    const leader = rankMovies()[0];
    const card = grid.querySelector(`[data-id="${CSS.escape(leader.id)}"]`);
    if (!card) return;

    card.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });

    // Celebration moment: burst animation on the winner + announcement.
    card.classList.add("celebrating");
    boardNote.textContent = `🎉 ${leader.title} is the winner with ${allocated(leader)} ${allocated(leader) === 1 ? "vote" : "votes"}!`;
    window.setTimeout(() => card.classList.remove("celebrating"), 2600);
  });

  /* ------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------ */

  render();
})();
