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

  const maxVotes = () =>
    Math.max(1, ...MOVIES.map((m) => netScore(m)));

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  /* ------------------------------------------------------------------
   * Icons
   * ------------------------------------------------------------------ */

  const STAR_BURST =
    '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 4l8 70 62-34-34 62 70 8-70 8 34 62-62-34-8 70-8-70-62 34 34-62-70-8 70-8-34-62 62 34z"/></svg>';

  const VOTE_STAR =
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 2l6.4 17.6L56 13.2l-8 16.8L56 46.8 38.4 44.4 32 62l-6.4-17.6L8 46.8l8-16.8L8 13.2l17.6 6.4z"/></svg>';

  // Poster fallback (graceful placeholder instead of a broken image).
  const POSTER_FALLBACK =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">` +
        `<rect width="400" height="600" fill="#0b8d84"/>` +
        `<circle cx="200" cy="220" r="86" fill="none" stroke="#f6f1e6" stroke-width="4" stroke-dasharray="10 16" opacity="0.85"/>` +
        `<path d="M200 96l11 82 74-40-40 74 82 11-82 11 40 74-74-40-11 82-11-82-74 40 40-74-82-11 82-11-40-74 74 40z" fill="#ff6b57"/>` +
        `<text x="200" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#f6f1e6" letter-spacing="4">POSTER</text>` +
        `<text x="200" y="505" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#f6f1e6" opacity="0.8">coming soon to the booth</text>` +
        `</svg>`
    );

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */

  const grid = document.getElementById("movie-grid");
  const boardNote = document.getElementById("board-note");

  const ORBIT_C = 2 * Math.PI * 15.5; // circumference of the share arc

  function cardHtml(movie, rank, share) {
    const delta = votes[movie.id] || 0;
    const score = netScore(movie);
    const hasTrailer = Boolean(movie.trailerEmbedUrl && movie.trailerWatchUrl);

    return `
      <li class="menu__card" data-id="${esc(movie.id)}">
        <div class="menu__rank" aria-hidden="true">
          ${STAR_BURST}
          <span>${rank}</span>
        </div>
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
            <span class="badge badge--imdb">${movie.imdb.toFixed(1)}</span>
            <span class="badge badge--rt">${movie.rt}%</span>
          </div>
          ${
            hasTrailer
              ? `<button class="menu__trailer" type="button" data-trailer="${esc(movie.id)}">Trailer</button>`
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
            >${VOTE_STAR}<span aria-hidden="true">▲</span></button>
            <button
              class="vote__btn vote__btn--down"
              type="button"
              data-vote="${esc(movie.id)}"
              data-direction="down"
              aria-pressed="${delta === -1}"
              aria-label="Downvote ${esc(movie.title)}"
            >${VOTE_STAR}<span aria-hidden="true">▼</span></button>
          </div>
          <div class="vote__share" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle class="share__track" cx="20" cy="20" r="15.5"></circle>
              <circle class="share__arc" cx="20" cy="20" r="15.5"
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

    const punched = Object.values(votes).filter((v) => v !== 0).length;
    boardNote.textContent =
      punched === 0
        ? "Ranked by your votes — tap ★ to punch a ticket."
        : `${punched} ticket${punched === 1 ? "" : "s"} punched by you — votes live in this browser.`;
  });

  /* ------------------------------------------------------------------
   * Trailer booth (modal)
   * ------------------------------------------------------------------ */

  const booth = document.getElementById("trailer-booth");
  const iframe = document.getElementById("booth-iframe");
  const boothTitle = document.getElementById("booth-title");
  const boothWatch = document.getElementById("booth-watch");
  const boothFallback = document.getElementById("booth-fallback");
  let lastFocused = null;

  function openBooth(movie) {
    lastFocused = document.activeElement;
    boothTitle.textContent = `${movie.title} (${movie.year}) — trailer`;
    iframe.src = movie.trailerEmbedUrl;
    boothWatch.href = movie.trailerWatchUrl;
    boothFallback.hidden = true;
    booth.hidden = false;
    document.body.style.overflow = "hidden";
    booth.querySelector(".booth__close").focus();
  }

  function closeBooth() {
    if (booth.hidden) return;
    iframe.src = ""; // stops playback
    booth.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-trailer]");
    if (!trigger) return;
    const movie = MOVIES.find((m) => m.id === trigger.dataset.trailer);
    if (movie?.trailerEmbedUrl) openBooth(movie);
  });

  // Close on ✕ button or backdrop click.
  booth.addEventListener("click", (event) => {
    if (event.target.closest("[data-booth-close]")) closeBooth();
  });

  // Close on Escape; trap Tab inside the booth.
  document.addEventListener("keydown", (event) => {
    if (booth.hidden) return;
    if (event.key === "Escape") {
      closeBooth();
      return;
    }
    if (event.key === "Tab") {
      const focusables = booth.querySelectorAll(
        "button, [href], iframe"
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === booth)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------ */

  render();
})();
