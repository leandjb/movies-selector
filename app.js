(() => {
  "use strict";

  /* ------------------------------------------------------------------
   * Data + state
   * ------------------------------------------------------------------ */

  const STORAGE_KEY = "movieVotes.v1";

  // Per-movie user delta: { [movieId]: 1 | -1 | 0 }
  let votes = loadVotes();

  // Guarded localStorage read (spec: votes persist per browser; page must
  // still work when storage is unavailable).
  function loadVotes() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const clean = {};
      for (const [id, v] of Object.entries(parsed)) {
        if (v === 1 || v === -1 || v === 0) clean[id] = v;
      }
      return clean;
    } catch {
      return {};
    }
  }

  function saveVotes() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch {
      /* storage unavailable — votes just don't persist this session */
    }
  }

  const netScore = (movie) => (movie.initialVotes || 0) + (votes[movie.id] || 0);

  const rankMovies = () =>
    [...MOVIES].sort(
      (a, b) => netScore(b) - netScore(a) || (a.id < b.id ? -1 : 1)
    );

  const maxVotes = () => Math.max(1, ...MOVIES.map((m) => netScore(m)));

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

  const ORBIT_C = 2 * Math.PI * 15.5; // circumference of the counter ring

  const scoreOrDash = (value) => (value == null ? "—" : value.toFixed(1));

  function cardHtml(movie, rank, share) {
    const delta = votes[movie.id] || 0;
    const score = netScore(movie);
    const hasTrailer = Boolean(movie.trailerWatchUrl);
    const isWinner = rank === 1;

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
              class="vote__btn vote__btn--up"
              type="button"
              data-vote="${esc(movie.id)}"
              data-direction="up"
              aria-pressed="${delta === 1}"
              aria-label="Upvote ${esc(movie.title)}"
            ><span aria-hidden="true">+</span></button>
            <button
              class="vote__btn vote__btn--down"
              type="button"
              data-vote="${esc(movie.id)}"
              data-direction="down"
              aria-pressed="${delta === -1}"
              aria-label="Downvote ${esc(movie.title)}"
            ><span aria-hidden="true">−</span></button>
          </div>
          <div class="vote__counter" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle class="counter__track" cx="20" cy="20" r="15.5"></circle>
              <circle class="counter__arc" cx="20" cy="20" r="15.5"
                stroke-dasharray="${(share * ORBIT_C).toFixed(1)} ${ORBIT_C.toFixed(1)}"></circle>
            </svg>
            <span class="vote__score">${score}</span>
          </div>
        </div>
      </li>`;
  }

  function render({ focusMovieId, focusDirection } = {}) {
    const ranked = rankMovies();
    const max = maxVotes();
    grid.innerHTML = ranked
      .map((m, i) => cardHtml(m, i + 1, netScore(m) / max))
      .join("");

    // Re-renders (after votes) shouldn't replay the entrance animation.
    document.body.classList.add("has-voted");

    // Hero winner card: the leader's pane takes the glow.
    const leader = ranked[0];
    heroPoster.src = leader.posterUrl;
    heroPoster.alt = `${leader.title} poster`;
    heroTitle.textContent = leader.title;
    heroVotes.textContent = `${netScore(leader)} votes · ${leader.year}`;

    // Board note announces the winner (aria-live).
    boardNote.textContent = `★ ${leader.title} is winning with ${netScore(leader)} votes.`;

    // Restore focus to the button that cast the last vote.
    if (focusMovieId) {
      const card = grid.querySelector(`[data-id="${CSS.escape(focusMovieId)}"]`);
      const btn = card?.querySelector(
        `[data-vote="${CSS.escape(focusMovieId)}"][data-direction="${focusDirection}"]`
      );
      btn?.focus();
    }
  }

  /* ------------------------------------------------------------------
   * Voting
   * ------------------------------------------------------------------ */

  grid.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-vote]");
    if (!btn) return;

    const movieId = btn.dataset.vote;
    const direction = btn.dataset.direction === "up" ? 1 : -1;
    const current = votes[movieId] || 0;

    // Toggle semantics: repeat click removes the vote, opposite click swaps.
    votes[movieId] = current === direction ? 0 : direction;
    saveVotes();
    render({ focusMovieId: movieId, focusDirection: btn.dataset.direction });
  });

  /* ------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------ */

  render();
})();
