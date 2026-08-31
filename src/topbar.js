/*
 * topbar.js — the navbar's status view-model (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.Topbar) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Topbar).
 *
 * Pure functions: state in, strings and flags out. The navbar is the page's
 * status surface — how many votes are still missing, how full the board is,
 * and whether the reveal control can be used. Keeping the arithmetic here (and
 * not inline in app.js) is what makes it testable without a DOM.
 */
(function (root) {
  "use strict";

  const DEFAULT_LIMIT = 9;

  function toCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  // How much of the budget is still unallocated. A nonsensical budget means
  // "no requirement", so nothing is missing.
  function missingVotes(input) {
    const args = input || {};
    const budget = args.budget;
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) return 0;
    return Math.max(0, Math.floor(Number(budget)) - toCount(args.allocated));
  }

  // The pill: a live count of votes still to place, or the ready state.
  function pill(input) {
    const args = input || {};
    const missing = missingVotes(args);
    if (missing === 0) {
      return {
        state: "ready",
        count: 0,
        label: "All votes cast",
        ariaLabel: "All votes cast",
      };
    }
    const label = missing === 1 ? "1 vote missing" : missing + " votes missing";
    return {
      state: "missing",
      count: missing,
      label: label,
      ariaLabel: label,
    };
  }

  // The board count chip: "3 / 9".
  function countChip(input) {
    const args = input || {};
    const limit = Number.isFinite(Number(args.limit)) && Number(args.limit) > 0
      ? Math.floor(Number(args.limit))
      : DEFAULT_LIMIT;
    const count = Math.min(limit, Math.max(0, Math.floor(Number(args.count)) || 0));
    return count + " / " + limit;
  }

  // Everything the navbar needs for one render.
  function view(input) {
    const args = input || {};
    return {
      pill: pill(args),
      chip: countChip({ count: args.count, limit: args.limit }),
      revealDisabled: toCount(args.count) === 0,
    };
  }

  const api = { missingVotes, pill, countChip, view, DEFAULT_LIMIT };
  root.Topbar = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
