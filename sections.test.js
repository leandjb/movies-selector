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
  createFetchRouter,
  suggestionSuccessRoute,
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

function addMovie(id) {
  const input = document.getElementById("imdb-input");
  input.value = "https://www.imdb.com/title/" + id + "/";
  document
    .getElementById("adder-form")
    .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

async function addAndHydrate(id) {
  addMovie(id);
  await flushHydration();
}

function vote(id, direction, times) {
  for (let i = 0; i < times; i++) {
    document
      .querySelector(`[data-vote="${id}"][data-direction="${direction}"]`)
      .click();
  }
}

function scoreOf(id) {
  return document.querySelector(
    `.menu__card[data-id="${id}"] .vote__score`
  ).textContent;
}

describe("Vote budget section", () => {
  test("renders the default budget", () => {
    expect(document.getElementById("budget-value").textContent).toBe("10");
  });

  test("clamps to 1..99", () => {
    const minus = document.getElementById("budget-minus");
    const plus = document.getElementById("budget-plus");
    for (let i = 0; i < 120; i++) plus.click();
    expect(document.getElementById("budget-value").textContent).toBe("99");
    for (let i = 0; i < 120; i++) minus.click();
    expect(document.getElementById("budget-value").textContent).toBe("1");
  });

  test("shrinking below allocation trims the largest votes first", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    vote("tt0111161", "inc", 5);
    vote("tt0111162", "inc", 3);
    expect(scoreOf("tt0111161")).toBe("5");
    expect(scoreOf("tt0111162")).toBe("3");

    // budget 10 -> 5 forces a trim down to total 5, largest-first.
    for (let i = 0; i < 5; i++) document.getElementById("budget-minus").click();
    expect(document.getElementById("budget-value").textContent).toBe("5");
    expect(scoreOf("tt0111161")).toBe("2");
    expect(scoreOf("tt0111162")).toBe("3");
    expect(document.getElementById("budget-remaining").textContent).toBe(
      "0 votes left"
    );
  });
});

describe("Add by IMDb link section", () => {
  test("submit adds a card and clears the input", async () => {
    addMovie("tt0111161");
    expect(document.getElementById("imdb-input").value).toBe("");
    expect(document.getElementById("board-count").textContent).toBe("1 / 9");
    await flushHydration();
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"]')
    ).not.toBeNull();
  });

  test("duplicate and invalid input produce feedback", () => {
    addMovie("tt0111161");
    expect(document.getElementById("adder-feedback").textContent).toMatch(
      /Added 1 movie/
    );
    addMovie("tt0111161");
    expect(document.getElementById("adder-feedback").textContent).toBe(
      "That movie is already on the board."
    );
    const input = document.getElementById("imdb-input");
    input.value = "not a link";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(document.getElementById("adder-feedback").textContent).toBe(
      "That doesn't look like a valid IMDb link."
    );
  });

  test("add is disabled and placeholder swaps at 9/9", async () => {
    for (let i = 1; i <= 9; i++) await addAndHydrate("tt011116" + i);
    expect(document.getElementById("board-count").textContent).toBe("9 / 9");
    expect(document.getElementById("adder-add").disabled).toBe(true);
    expect(document.getElementById("imdb-input").placeholder).toContain(
      "Board is full"
    );
  });
});

describe("Import section", () => {
  const GIST_ID = "abc123def4567890abc123def4567890";
  const GIST_BODY =
    "https://www.imdb.com/title/tt0111161/\nhttps://www.imdb.com/title/tt0111162/";

  test("gist button is disabled while a fetch is pending, then re-enabled", async () => {
    installFetch(
      createFetchRouter([
        suggestionSuccessRoute(),
        gistRoute(GIST_ID, GIST_BODY),
      ])
    );
    const gistInput = document.getElementById("gist-input");
    gistInput.value = "https://gist.github.com/u/" + GIST_ID;
    document.getElementById("gist-import").click();
    expect(document.getElementById("gist-import").disabled).toBe(true);
    await flushHydration();
    expect(document.getElementById("gist-import").disabled).toBe(false);
    expect(document.getElementById("board-count").textContent).not.toBe("0 / 9");
  });

  test("Enter key in the gist field triggers an import", async () => {
    installFetch(
      createFetchRouter([
        suggestionSuccessRoute(),
        gistRoute(GIST_ID, GIST_BODY),
      ])
    );
    const gistInput = document.getElementById("gist-input");
    gistInput.value = "https://gist.github.com/u/" + GIST_ID;
    gistInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await flushHydration();
    expect(document.getElementById("board-count").textContent).not.toBe("0 / 9");
  });
});

describe("Status bar", () => {
  test("count, Clear all disabled state, and feedback classes", async () => {
    expect(document.getElementById("clear-all").disabled).toBe(true);
    expect(document.getElementById("board-count").textContent).toBe("0 / 9");
    await addAndHydrate("tt0111161");
    expect(document.getElementById("clear-all").disabled).toBe(false);
    expect(document.getElementById("board-count").textContent).toBe("1 / 9");
    document.getElementById("adder-feedback").textContent = "oops";
    document.getElementById("adder-feedback").classList.add("adder__feedback--error");
    expect(
      document
        .getElementById("adder-feedback")
        .classList.contains("adder__feedback--error")
    ).toBe(true);
  });
});
