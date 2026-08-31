// tests/helpers/app-harness.js
//
// DOM test harness for the UI layer. It loads the SHIPPED index.html markup
// (so the suite can never drift from the real DOM) and runs the shipped
// app.js fresh for every test via indirect eval — app.js has no import/export
// statements, so re-eval gives each test a brand-new instance with freshly
// bound listeners, no module-cache hacks.
//
// Tests import the pure modules once (they attach to globalThis) and then call
// loadApp(). The fetch mock is keyed by the *unwrapped* IMDb/GitHub target so
// routes can be written against real URLs regardless of which proxy wraps them.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { jest } from "@jest/globals";
// The DOM suites eval app.js against globalThis, so every window.* module it
// reaches for has to be attached here, in dependency order.
import "../../src/imdb.js";
import "../../src/queue.js";
import "../../src/board.js";
import "../../src/gist.js";
import "../../src/winner.js";
import "../../src/topbar.js";
import "../../src/toast.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

const INDEX_HTML = readFileSync(resolve(ROOT, "index.html"), "utf8");
const APP_SRC = readFileSync(resolve(ROOT, "src", "app.js"), "utf8");

const BODY_MATCH = /<body[^>]*>([\s\S]*)<\/body>/i.exec(INDEX_HTML);
const BODY = BODY_MATCH ? BODY_MATCH[1] : "";

// The DOM ids the app's contract depends on. A restructure (like the queued
// reskin) fails loudly here instead of silently degrading the UI suites.
export const REQUIRED_IDS = [
  "movie-grid",
  "show-winner", // the navbar reveal control
  "winner-modal",
  "clear-modal",
  "budget-value",
  "budget-progress",
  "adder-form",
  "gist-import",
  "toast-region",
  "board-count-chip",
  "votes-pill",
  "votes-pill-label",
  "clear-all",
  "board-note",
];

export function setupDom() {
  document.body.innerHTML = BODY;
  // jsdom omits CSS.escape; app.js uses it in render() after a vote/remove.
  if (typeof globalThis.CSS === "undefined" || typeof globalThis.CSS.escape !== "function") {
    globalThis.CSS = {
      escape: (s) => String(s).replace(/[^\w-]/g, (c) => "\\" + c),
    };
  }
}

export function makeResponse(status, body, headers) {
  const ok = status >= 200 && status < 300;
  const map = typeof headers === "function" ? headers() : headers;
  const lookup = (name) => {
    if (!map) return null;
    const key = String(name).toLowerCase();
    for (const k of Object.keys(map)) {
      if (k.toLowerCase() === key) return map[k];
    }
    return null;
  };
  return {
    ok,
    status,
    headers: { get: lookup },
    json: () => Promise.resolve(body),
    text: () =>
      Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

// Crack a proxy-wrapped URL back to the real target (matches imdb.js's proxies).
export function unwrapProxy(url) {
  try {
    if (url.includes("allorigins.win/raw?url="))
      return decodeURIComponent(url.split("raw?url=")[1]);
    if (url.includes("codetabs.com/v1/proxy?quest="))
      return decodeURIComponent(url.split("quest=")[1]);
    if (url.includes("cors.workers.dev/?") || url.includes("corsproxy.io/?url="))
      return url.split(/cors(?:\.workers)?\.dev\/\?|corsproxy\.io\/\?url=/)[1];
  } catch {
    /* fall through */
  }
  return url;
}

// Build a router: routes matched in order; `body` may be a function(target).
// Default (no match) answers 502 so an unmocked network touch fails loudly.
//
// A route may carry `defer: true`, which returns a promise the TEST resolves
// (via `router.pending(n)`), so concurrency can be observed deterministically
// instead of by racing real timers.
export function createFetchRouter(routes = []) {
  const callLog = [];
  const pending = [];
  let inFlight = 0;
  let peakInFlight = 0;
  const begin = () => {
    inFlight += 1;
    if (inFlight > peakInFlight) peakInFlight = inFlight;
    return () => {
      inFlight -= 1;
    };
  };
  const fn = (url, opts) => {
    const target = unwrapProxy(url);
    const settle = begin();
    callLog.push({ url, target, opts });
    const route = routes.find((r) => r.test(url));
    const body = route
      ? typeof route.body === "function"
        ? route.body(target, url)
        : route.body
      : { error: "no route for " + target };
    // `status` and `headers` may be functions of the target (and url), so a
    // route can answer 429-then-200 and exercise retry paths.
    const deliver = () =>
      makeResponse(
        route
          ? typeof route.status === "function"
            ? route.status(target, url)
            : route.status
          : 502,
        body,
        route
          ? typeof route.headers === "function"
            ? route.headers(target, url)
            : route.headers
          : null
      );
    if (route && route.defer) {
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      pending.push({ target, release, released: false });
      return gate.then(() => {
        settle();
        return deliver();
      });
    }
    return Promise.resolve().then(() => {
      settle();
      return deliver();
    });
  };
  const router = { fn, callLog, pending };
  // Resolve the n-th deferred request (0-based, in call order) with its route.
  router.resolve = (n) => {
    const entry = pending[n];
    if (!entry) throw new Error("no deferred request at index " + n);
    entry.released = true;
    entry.release();
    return Promise.resolve();
  };
  // Resolve every deferred request that has not been released yet.
  router.resolveAll = () => {
    for (const entry of pending) {
      if (!entry.released) {
        entry.released = true;
        entry.release();
      }
    }
    return Promise.resolve();
  };
  router.inFlight = () => inFlight;
  router.peakInFlight = () => peakInFlight;
  router.resetCounters = () => {
    inFlight = 0;
    peakInFlight = 0;
  };
  return router;
}

export function installFetch(router) {
  globalThis.fetch = router.fn;
  return router;
}

export function uninstallFetch() {
  delete globalThis.fetch;
}

// Run app.js fresh against the current fixture DOM. By default clears persisted
// state so every test starts from an empty board; pass { clear: false } to
// simulate a page reload against existing storage.
export function loadApp(opts = {}) {
  if (opts.clear !== false) {
    try {
      window.localStorage.clear();
    } catch {
      /* jsdom localStorage unavailable — ignore */
    }
  }
  setupDom();
  // Indirect eval executes app.js in the global scope where document/window/
  // localStorage/fetch and the already-imported globalThis.Board|Imdb|Gist|
  // Winner all resolve. Re-running it builds a clean instance per test.
  // eslint-disable-next-line no-eval
  (0, eval)(APP_SRC);
}

// Drain the hydration queue + every backoff sleep. Fake timers only. We always
// advance at least once so async chains that are pending on a microtask (no
// timer yet, e.g. a gist fetch before hydration is enqueued) get flushed too.
export async function flushHydration(maxMs = 120000) {
  let elapsed = 0;
  const STEP = 500;
  do {
    await jest.advanceTimersByTimeAsync(STEP);
    elapsed += STEP;
  } while (jest.getTimerCount() > 0 && elapsed < maxMs);
}

// Real-timer drain, for flows jsdom drives off macrotasks (e.g. FileReader).
export async function flushReal(ms = 3000) {
  await new Promise((r) => setTimeout(r, ms));
}

// ---- Route builders -------------------------------------------------------

export function suggestionSuccessRoute() {
  return {
    test: (u) => u.includes("v3.sg.media-imdb.com"),
    status: 200,
    body: (t) => {
      const m = /suggestion\/x\/([^.]+)\.json/.exec(t);
      const id = m ? m[1] : "tt0000000";
      return {
        d: [
          {
            id,
            l: "Hydrated " + id,
            y: 2021,
            i: { imageUrl: "https://img.example/" + id + ".jpg" },
          },
        ],
      };
    },
  };
}

export function statusRoute(substr, status, body) {
  return { test: (t) => t.includes(substr), status, body };
}

export function gistRoute(id, content) {
  return {
    test: (t) => t.includes("api.github.com/gists/") && t.includes(id),
    status: 200,
    body: {
      files: {
        "movie-list.txt": { filename: "movie-list.txt", type: "text/plain", content },
      },
    },
  };
}
