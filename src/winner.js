/*
 * winner.js — pure winner tally for the reveal modal (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.Winner) and also by Jest
 * (attaches to globalThis.Winner).
 *
 * tallyResults(movies, votesById, budget) where `movies` is board.list()
 * (insertion order), `votesById` is the app's movieVotes.v1 map and `budget`
 * the configured vote budget:
 *
 *   { ok: true,  total, winnerId, rows: [{ id, title, year, posterUrl, votes, pct }] }
 *   { ok: false, reason: "missing-votes", remaining }   // budget not fully allocated
 *   { ok: false, reason: "empty-board" }                // no movies on the board
 *   { ok: false, reason: "no-votable-movies" }          // board non-empty but no movie has loaded details
 *
 * The winner is the movie with the most allocated votes; ties go to the
 * movie added first. Rows are sorted by votes descending (stable, so ties
 * keep insertion order). pct is an integer share of the allocated total.
 * Movies whose status is "loading" or "error" are excluded from the tally.
 */
(function (root) {
  "use strict";

  function tallyResults(movies, votesById, budget) {
    const list = Array.isArray(movies) ? movies : [];
    if (list.length === 0) {
      return { ok: false, reason: "empty-board" };
    }

    const votable = list.filter(
      (m) => !(m && (m.status === "loading" || m.status === "error"))
    );
    if (votable.length === 0) {
      return { ok: false, reason: "no-votable-movies" };
    }

    const votes = votesById && typeof votesById === "object" ? votesById : {};
    const rows = votable.map((m) => {
      const v =
        votes && Number.isInteger(votes[m.id]) && votes[m.id] > 0
          ? votes[m.id]
          : 0;
      return {
        id: m.id,
        title: typeof m.title === "string" ? m.title : null,
        year: typeof m.year === "number" ? m.year : null,
        posterUrl: typeof m.posterUrl === "string" ? m.posterUrl : null,
        votes: v,
        pct: 0,
      };
    });

    const total = rows.reduce((sum, r) => sum + r.votes, 0);
    const cap = Number.isInteger(budget) && budget > 0 ? budget : total;
    if (total < cap) {
      return { ok: false, reason: "missing-votes", remaining: cap - total };
    }

    for (const r of rows) r.pct = Math.round((r.votes / total) * 100);

    // Stable sort: among equal votes, insertion order (earliest added) wins.
    const sorted = [...rows].sort((a, b) => b.votes - a.votes);
    return { ok: true, total, winnerId: sorted[0].id, rows: sorted };
  }

  const api = { tallyResults };
  root.Winner = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
