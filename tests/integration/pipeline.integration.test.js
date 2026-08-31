/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import "../../src/imdb.js";
import "../../src/board.js";
import "../../src/gist.js";
import "../../src/winner.js";
import {
  loadApp,
  installFetch,
  uninstallFetch,
  flushHydration,
  createFetchRouter,
  suggestionSuccessRoute,
  statusRoute,
  gistRoute,
} from "../helpers/app-harness.js";

const SUGGESTION_DOMAIN = "v3.sg.media-imdb.com";
const SUGGESTION_HOST = "v3.sg.media-imdb.com/suggestion/";
const PROXY_HOSTS = ["allorigins.win", "codetabs.com", "cors.workers.dev"];
const isDirectSuggestion = (u) =>
  u.includes(SUGGESTION_DOMAIN) && !PROXY_HOSTS.some((h) => u.includes(h));
const isProxySuggestion = (u) =>
  PROXY_HOSTS.some((h) => u.includes(h)) && u.includes(SUGGESTION_DOMAIN);
const isPage = (u) => u.includes("imdb.com/title/");

let router;

beforeEach(() => {
  jest.useFakeTimers();
  router = installFetch(createFetchRouter([suggestionSuccessRoute()]));
  loadApp();
});

afterEach(() => {
  jest.useRealTimers();
  uninstallFetch();
});

function suggestionCalls() {
  return router.callLog
    .filter((c) => c.target.includes(SUGGESTION_HOST))
    .map((c) => c.target);
}
function pageCalls() {
  return router.callLog.filter((c) => isPage(c.target)).map((c) => c.target);
}
function proxyIndexes() {
  const { PROXIES } = globalThis.Imdb;
  return router.callLog
    .filter((c) => isProxySuggestion(c.url))
    .map((c) => {
      for (let i = 0; i < PROXIES.length; i += 1) {
        if (PROXIES[i](c.target) === c.url) return i;
      }
      return -1;
    });
}

function toastTexts() {
  return [...document.querySelectorAll("#toast-region .toast__text")].map(
    (n) => n.textContent
  );
}
function lastToast() {
  return toastTexts()[toastTexts().length - 1] || null;
}

describe("Add-by-link hydration through the DOM", () => {
  test("the direct suggestion request hydrates title/year/poster and shows no rating badge", async () => {
    document.getElementById("imdb-input").value =
      "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    expect(card.querySelector(".menu__title").textContent).toContain(
      "Hydrated tt0111161"
    );
    expect(card.querySelector(".badge--imdb")).toBeNull();
    // only the direct suggestion endpoint was hit (one request, no proxy)
    expect(suggestionCalls().filter(isDirectSuggestion).length).toBe(1);
  });

  test("direct failure falls back to the proxy chain (same endpoint), no page provider", async () => {
    router = installFetch(
      createFetchRouter([
        { test: isDirectSuggestion, status: 404, body: {} },
        suggestionSuccessRoute(),
      ])
    );
    document.getElementById("imdb-input").value =
      "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    expect(card.querySelector(".menu__title").textContent).toBe("Hydrated tt0111161");
    // direct failed, so the proxy chain was used
    expect(router.callLog.some((c) => isProxySuggestion(c.url))).toBe(true);
    // no dead title-page provider was ever requested
    expect(pageCalls().length).toBe(0);
  });

  test("every source fails -> card lands in the error state, no page provider", async () => {
    router = installFetch(createFetchRouter([statusRoute("imdb.com", 502)]));
    document.getElementById("imdb-input").value =
      "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    // error card keeps its title placeholder ("—") and never fabricates data
    expect(card.querySelector(".menu__title").textContent).toBe("Unavailable");
    // the provider chain was walked: direct, then the proxies
    expect(suggestionCalls().length).toBeGreaterThan(0);
    expect(pageCalls().length).toBe(0);
  });
});

describe("Gist import through the DOM", () => {
  test("gist success adds cards and clears the input", async () => {
    const GIST_ID = "abc123def4567890abc123def4567890";
    installFetch(
      createFetchRouter([
        suggestionSuccessRoute(),
        gistRoute(
          GIST_ID,
          "https://www.imdb.com/title/tt0111161/\nhttps://www.imdb.com/title/tt0111162/"
        ),
      ])
    );
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/" + GIST_ID;
    document.getElementById("gist-import").click();
    await flushHydration();
    expect(document.getElementById("board-count-chip").textContent).toBe("2 / 9");
    expect(document.getElementById("gist-input").value).toBe("");
  });

  test.each([
    ["bad-ref", "https://example.com/not-a-gist", "That doesn't look like a gist URL or ID.", undefined],
    ["not-found", "https://gist.github.com/u/abc123def4567890abc123def4567890", "That gist doesn't exist (or is private).", 404],
    ["rate-limited", "https://gist.github.com/u/abc123def4567890abc123def4567890", "GitHub rate limit reached — try again in a few minutes.", 403],
    ["no-text-file", "https://gist.github.com/u/abc123def4567890abc123def4567890", "That gist has no .txt file to import.", "notext"],
  ])("gist typed failure surfaces '%s' message", async (code, ref, msg, status) => {
    const GIST_ID = "abc123def4567890abc123def4567890";
    let routes = [suggestionSuccessRoute()];
    if (status === "notext") {
      routes.push({
        test: (t) => t.includes("api.github.com/gists/") && t.includes(GIST_ID),
        status: 200,
        body: { files: { "a.png": { filename: "a.png", type: "image/png" } } },
      });
    } else {
      routes.push(statusRoute("api.github.com/gists/" + GIST_ID, status));
    }
    installFetch(createFetchRouter(routes));
    document.getElementById("gist-input").value = ref;
    document.getElementById("gist-import").click();
    // Only advance enough for the fetch to settle: a full drain would advance
    // past the toast's own auto-dismiss timer.
    await jest.advanceTimersByTimeAsync(50);
    expect(lastToast()).toBe(msg);
    expect(document.getElementById("board-count-chip").textContent).toBe("0 / 9");
  });

  test("a failed gist fetch leaves the board untouched", async () => {
    installFetch(createFetchRouter([statusRoute("api.github.com/gists/", 502)]));
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/abc123def4567890abc123def4567890";
    document.getElementById("gist-import").click();
    await flushHydration();
    expect(document.getElementById("board-count-chip").textContent).toBe("0 / 9");
  });
});

describe("Persistence across reload", () => {
  test("seeded storage restores board + votes + budget without re-fetching", async () => {
    // first session
    document.getElementById("imdb-input").value =
      "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    document
      .querySelector('[data-vote="tt0111161"][data-direction="inc"]')
      .click();
    const stored = window.localStorage.getItem("movieVotes.v1");
    expect(stored).toContain("tt0111161");

    // second session: reuse the same storage, re-run the app
    router.callLog.length = 0;
    loadApp({ clear: false });
    expect(document.getElementById("board-count-chip").textContent).toBe("1 / 9");
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"] .vote__score')
        .textContent
    ).toBe("1");
    // no network calls on reload — hydrated data came from storage
    expect(router.callLog.length).toBe(0);
  });
});

describe("Bulk import: bounded concurrency, rotation, cache", () => {
  const IDS = [
    "tt0111161",
    "tt0111162",
    "tt0111163",
    "tt0111164",
    "tt0111165",
    "tt0111166",
  ];

  function gistWith(ids) {
    return gistRoute(
      "abc123def4567890abc123def4567890",
      ids.map((id) => "https://www.imdb.com/title/" + id + "/").join("\n")
    );
  }

  test("bulk import runs more than one request in flight, under the bound", async () => {
    const bound = globalThis.Imdb.PROXIES.length;
    router = installFetch(
      createFetchRouter([{ ...suggestionSuccessRoute(), defer: true }, gistWith(IDS)])
    );
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/abc123def4567890abc123def4567890";
    document.getElementById("gist-import").click();
    await flushHydration();

    // every movie gated behind a deferred request: more than one is in flight
    // at once, and never more than the queue's bound.
    expect(router.inFlight()).toBeGreaterThan(1);
    expect(router.peakInFlight()).toBeLessThanOrEqual(bound);
    await router.resolveAll();
    await flushHydration();
    expect(document.getElementById("board-count-chip").textContent).toBe("6 / 9");
  });

  test("consecutive hydration requests rotate across proxies", async () => {
    const { PROXIES } = globalThis.Imdb;
    router = installFetch(
      createFetchRouter([
        { test: isDirectSuggestion, status: 403, body: {} },
        { ...suggestionSuccessRoute(), test: isProxySuggestion },
        gistWith(IDS),
      ])
    );
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/abc123def4567890abc123def4567890";
    document.getElementById("gist-import").click();
    await flushHydration();

    const used = proxyIndexes();
    expect(used.length).toBeGreaterThanOrEqual(IDS.length);
    expect(new Set(used).size).toBe(PROXIES.length);
  });

  test("a re-added movie is served from cache with no new request", async () => {
    installFetch(createFetchRouter([suggestionSuccessRoute(), gistWith(IDS)]));
    const input = document.getElementById("imdb-input");
    input.value = "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    const afterFirst = suggestionCalls().length;

    // remove it, then add the same id again
    document
      .querySelector('[data-remove="tt0111161"]')
      .click();
    input.value = "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();

    expect(suggestionCalls().length).toBe(afterFirst);
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"] .menu__title')
        .textContent
    ).toBe("Hydrated tt0111161");
  });

  test("a 429 with Retry-After is retried, then the movie still hydrates", async () => {
    let hits = 0;
    const limited = createFetchRouter([
      {
        ...suggestionSuccessRoute(),
        // first two suggestion attempts are rate-limited with a hint
        status: () => (hits++ < 2 ? 429 : 200),
        headers: () => ({ "Retry-After": "1" }),
      },
      gistWith(["tt0111161"]),
    ]);
    router = installFetch(limited);
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/abc123def4567890abc123def4567890";
    document.getElementById("gist-import").click();
    await flushHydration();

    // it retried rather than giving up...
    expect(limited.callLog.length).toBeGreaterThanOrEqual(3);
    // ...but stayed inside the documented bound: 1 direct + 3 proxies x up to 2
    // attempts, plus the gist fetch. Not a retry storm.
    expect(limited.callLog.length).toBeLessThanOrEqual(
      globalThis.Imdb.PROXIES.length * 3 * 2 + 1
    );
    // and the movie ends up hydrated, not stuck on placeholders
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"] .menu__title')
        .textContent
    ).toBe("Hydrated tt0111161");
  });

  test("the navbar pill ticks down across paste, vote, and remove", async () => {
    router = installFetch(createFetchRouter([suggestionSuccessRoute()]));
    const label = () =>
      document.getElementById("votes-pill-label").textContent;
    expect(label()).toBe("10 votes missing");

    const input = document.getElementById("imdb-input");
    input.value = "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();

    document.querySelector('[data-vote="tt0111161"][data-direction="inc"]').click();
    expect(label()).toBe("9 votes missing");

    document.querySelector('[data-remove="tt0111161"]').click();
    expect(label()).toBe("10 votes missing");
  });
});
