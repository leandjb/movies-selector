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
  gistRoute,
} from "../helpers/app-harness.js";

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

// Feedback now arrives as toasts in the live region rather than an inline bar.
function toastTexts() {
  return [...document.querySelectorAll("#toast-region .toast__text")].map(
    (n) => n.textContent
  );
}

function lastToastNode() {
  const nodes = document.querySelectorAll("#toast-region .toast");
  return nodes[nodes.length - 1] || null;
}

function lastToast() {
  const node = lastToastNode();
  return node ? node.querySelector(".toast__text").textContent : null;
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
    expect(document.getElementById("board-count-chip").textContent).toBe("1 / 9");
    await flushHydration();
    expect(
      document.querySelector('.menu__card[data-id="tt0111161"]')
    ).not.toBeNull();
  });

  test("duplicate and invalid input raise toasts", () => {
    addMovie("tt0111161");
    expect(lastToast()).toMatch(/Added 1 movie/);
    addMovie("tt0111161");
    expect(lastToast()).toBe("That movie is already on the board.");
    expect(lastToastNode().classList.contains("toast--error")).toBe(true);

    const input = document.getElementById("imdb-input");
    input.value = "not a link";
    document
      .getElementById("adder-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(lastToast()).toBe("That doesn't look like a valid IMDb link.");
  });

  test("add is disabled and placeholder swaps at 9/9", async () => {
    for (let i = 1; i <= 9; i++) await addAndHydrate("tt011116" + i);
    expect(document.getElementById("board-count-chip").textContent).toBe("9 / 9");
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
    expect(document.getElementById("board-count-chip").textContent).not.toBe("0 / 9");
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
    expect(document.getElementById("board-count-chip").textContent).not.toBe("0 / 9");
  });
});

describe("Navbar status surface", () => {
  test("navbar holds the board count chip, votes pill, and reveal control", () => {
    const head = document.querySelector(".site-head__inner");
    expect(head.querySelector("#board-count-chip")).not.toBeNull();
    expect(head.querySelector("#votes-pill")).not.toBeNull();
    expect(head.querySelector("#show-winner")).not.toBeNull();
  });

  test("count chip and Clear all track the board", async () => {
    expect(document.getElementById("clear-all").disabled).toBe(true);
    expect(document.getElementById("board-count-chip").textContent).toBe("0 / 9");
    await addAndHydrate("tt0111161");
    expect(document.getElementById("clear-all").disabled).toBe(false);
    expect(document.getElementById("board-count-chip").textContent).toBe("1 / 9");
  });

  test("votes pill counts down as votes are allocated and returns on removal", async () => {
    await addAndHydrate("tt0111161");
    const pill = document.getElementById("votes-pill");
    expect(document.getElementById("votes-pill-label").textContent).toBe(
      "10 votes missing"
    );
    expect(pill.classList.contains("pill--missing")).toBe(true);

    vote("tt0111161", "inc", 4);
    expect(document.getElementById("votes-pill-label").textContent).toBe(
      "6 votes missing"
    );

    vote("tt0111161", "inc", 6);
    expect(document.getElementById("votes-pill-label").textContent).toBe(
      "All votes cast"
    );
    expect(pill.classList.contains("pill--ready")).toBe(true);

    vote("tt0111161", "dec", 1);
    expect(document.getElementById("votes-pill-label").textContent).toBe(
      "1 vote missing"
    );
  });

  test("reveal control lives in the navbar and is disabled on an empty board", () => {
    const reveal = document.getElementById("show-winner");
    expect(document.querySelector(".site-head__inner #show-winner")).toBe(reveal);
    expect(reveal.disabled).toBe(true);
    expect(document.querySelector(".reveal")).toBeNull();
  });

  test("budget progress bar fills with votes given", async () => {
    await addAndHydrate("tt0111161");
    const bar = document.getElementById("budget-bar");
    const progress = document.getElementById("budget-progress");
    expect(bar.style.width).toBe("0%");
    vote("tt0111161", "inc", 3);
    expect(bar.style.width).toBe("30%");
    expect(progress.getAttribute("aria-valuenow")).toBe("3");
    expect(progress.getAttribute("aria-valuemax")).toBe("10");
  });
});

describe("Hero control column", () => {
  test("hero stacks the budget, add, and import panels in one column", () => {
    const tools = document.querySelector(".hero__tools");
    expect(tools).not.toBeNull();
    expect(tools.querySelector("#budget-value")).not.toBeNull();
    expect(tools.querySelector("#adder-form")).not.toBeNull();
    expect(tools.querySelector("#gist-import")).not.toBeNull();
  });

  test("the old mid-page status bar and board head are gone", () => {
    expect(document.querySelector(".ctl--bar")).toBeNull();
    expect(document.querySelector(".board__head")).toBeNull();
    expect(document.getElementById("adder-feedback")).toBeNull();
  });
});
