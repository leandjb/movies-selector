/*
 * board.js — the movie board state machine (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.Board) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Board).
 *
 * A board is a flat list of movies:
 *   { id, title, year, rating, posterUrl, status }
 * where status is "loading" | "ready" | "error" and any field may be null
 * until hydration fills it in.
 */
(function (root) {
  "use strict";

  const MAX_CARDS = 9;
  const STORAGE_KEY = "shortlistBoard.v1";

  function createBoard(storage, opts) {
    const store =
      storage || (typeof localStorage !== "undefined" ? localStorage : null);
    const extractFn = (opts && opts.extractFn) || null;
    let movies = [];

    function normalizeMovie(m) {
      if (!m || typeof m.id !== "string") return null;
      const ready =
        typeof m.title === "string" ||
        typeof m.posterUrl === "string" ||
        typeof m.year === "number" ||
        typeof m.rating === "number";
      let status = "error";
      if (m.status === "ready") status = "ready";
      else if (m.status === "loading") status = "loading";
      else if (ready) status = "ready";
      return {
        id: m.id,
        title: typeof m.title === "string" ? m.title : null,
        year: typeof m.year === "number" ? m.year : null,
        rating: typeof m.rating === "number" ? m.rating : null,
        posterUrl: typeof m.posterUrl === "string" ? m.posterUrl : null,
        status,
      };
    }

    function load() {
      try {
        const raw = store && store.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        movies = Array.isArray(parsed)
          ? parsed.map(normalizeMovie).filter(Boolean)
          : [];
      } catch {
        movies = [];
      }
    }

    function save() {
      try {
        if (store) store.setItem(STORAGE_KEY, JSON.stringify(movies));
      } catch {
        /* storage unavailable — board is session-only */
      }
    }

    function hasId(id) {
      return movies.some((m) => m.id === id);
    }

    function count() {
      return movies.length;
    }

    function isFull() {
      return movies.length >= MAX_CARDS;
    }

    // Returns a summary: { addedIds, duplicates, invalid, skipped, full }.
    function addFromText(raw, extract) {
      const ids = (extract || extractFn || root.Imdb.extractImdbIds)(raw || "");
      const lines = String(raw || "")
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      const seenInInput = new Set();
      const addedIds = [];
      let duplicates = 0;
      let skipped = 0;

      for (const id of ids) {
        if (seenInInput.has(id)) {
          duplicates += 1;
          continue;
        }
        seenInInput.add(id);
        if (hasId(id)) {
          duplicates += 1;
          continue;
        }
        if (movies.length >= MAX_CARDS) {
          skipped += 1;
          continue;
        }
        movies.push({
          id,
          title: null,
          year: null,
          rating: null,
          posterUrl: null,
          status: "loading",
        });
        addedIds.push(id);
      }

      const invalid = Math.max(0, lines.length - ids.length);
      save();
      return { addedIds, duplicates, invalid, skipped, full: isFull() };
    }

    function hydrate(id, details) {
      const m = movies.find((x) => x.id === id);
      if (!m) return false;
      if (details) {
        if (typeof details.title === "string") m.title = details.title;
        if (typeof details.year === "number") m.year = details.year;
        if (typeof details.rating === "number") m.rating = details.rating;
        if (typeof details.posterUrl === "string") m.posterUrl = details.posterUrl;
        m.status =
          m.title || m.posterUrl || m.year != null || m.rating != null
            ? "ready"
            : "error";
      } else {
        m.status = "error";
      }
      save();
      return true;
    }

    function clear() {
      movies = [];
      try {
        if (store) store.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }

    function remove(id) {
      const idx = movies.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      movies.splice(idx, 1);
      save();
      return true;
    }

    function list() {
      return movies.map((m) => ({ ...m }));
    }

    function needsHydration() {
      return movies.filter(
        (m) => m.status === "loading" || m.status === "error"
      );
    }

    function toJSON() {
      return movies.map((m) => ({ ...m }));
    }

    function fromJSON(arr) {
      movies = Array.isArray(arr) ? arr.map(normalizeMovie).filter(Boolean) : [];
    }

    return {
      load,
      save,
      addFromText,
      hydrate,
      clear,
      remove,
      list,
      needsHydration,
      toJSON,
      fromJSON,
      count,
      isFull,
      hasId,
      get movies() {
        return movies;
      },
    };
  }

  const api = { createBoard, MAX_CARDS, STORAGE_KEY };
  root.Board = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
