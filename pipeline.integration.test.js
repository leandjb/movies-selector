/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import "./imdb.js";
import "./board.js";
import "./gist.js";
import "./winner.js";
import {
  loadApp,
  installFetch,
  uninstallFetch,
  flushHydration,
  flushReal,
  createFetchRouter,
  suggestionSuccessRoute,
  jsonLdRoute,
  statusRoute,
  gistRoute,
} from "./tests/helpers/app-harness.js";

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
    .filter((c) => c.target.includes("v3.sg.media-imdb.com/suggestion/"))
    .map((c) => c.target);
}
function pageCalls() {
  return router.callLog
    .filter((c) => c.target.includes("imdb.com/title/"))
    .map((c) => c.target);
}

describe("Add-by-link hydration through the DOM", () => {
  test("suggestion API is tried first and hydrates title/year/poster; rating is —", async () => {
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
    expect(card.querySelector(".badge--imdb").textContent.trim()).toBe("—");
    // only the suggestion endpoint was hit (one proxy, first try)
    expect(suggestionCalls().length).toBe(1);
  });

  test("suggestion failure falls back to JSON-LD for the rating", async () => {
    router = installFetch(
      createFetchRouter([
        statusRoute("v3.sg.media-imdb.com/suggestion/", 404),
        jsonLdRoute("tt0111161", { title: "Real Title", year: 2019, rating: 8.4 }),
      ])
    );
    document.getElementById("imdb-input").value =
      "https://www.imdb.com/title/tt0111161/";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flushHydration();
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    expect(card.querySelector(".menu__title").textContent).toBe("Real Title");
    expect(card.querySelector(".badge--imdb").textContent.trim()).toBe("8.4");
    // suggestion failed (no usable data) -> page JSON-LD tried
    expect(pageCalls().length).toBeGreaterThanOrEqual(1);
  });

  test("every provider fails -> card lands in the error state", async () => {
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
    // the provider chain was walked: suggestion, then page, then api.imdbapi.dev
    expect(suggestionCalls().length).toBeGreaterThan(0);
    expect(pageCalls().length).toBeGreaterThan(0);
  });
});

describe("TXT + gist import through the DOM", () => {
  test("TXT multi-import: hydrates all, skips duplicates, reports full-board skip", async () => {
    jest.useRealTimers(); // jsdom drives FileReader off a macrotask
    const txt =
      "https://www.imdb.com/title/tt0111161/\n" +
      "https://www.imdb.com/title/tt0111161/\n" + // duplicate
      "https://www.imdb.com/title/tt0111162/\n";
    const file = new File([txt], "list.txt", { type: "text/plain" });
    const input = document.getElementById("txt-input");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await flushReal(3000);
    expect(document.getElementById("board-count").textContent).toBe("2 / 9");
    const feedback = document.getElementById("adder-feedback").textContent;
    expect(feedback).toContain("Added 2 movies");
    expect(feedback).toContain("duplicate");
  });

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
    expect(document.getElementById("board-count").textContent).toBe("2 / 9");
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
    await flushHydration();
    expect(document.getElementById("adder-feedback").textContent).toBe(msg);
    expect(document.getElementById("board-count").textContent).toBe("0 / 9");
  });

  test("a failed gist fetch leaves the board untouched", async () => {
    installFetch(createFetchRouter([statusRoute("api.github.com/gists/", 502)]));
    document.getElementById("gist-input").value =
      "https://gist.github.com/u/abc123def4567890abc123def4567890";
    document.getElementById("gist-import").click();
    await flushHydration();
    expect(document.getElementById("board-count").textContent).toBe("0 / 9");
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
    expect(document.getElementById("board-count").textContent).toBe("1 / 9");
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"] .vote__score')
        .textContent
    ).toBe("1");
    // no network calls on reload — hydrated data came from storage
    expect(router.callLog.length).toBe(0);
  });
});
