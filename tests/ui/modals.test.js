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

async function addAndHydrate(id) {
  document.getElementById("imdb-input").value =
    "https://www.imdb.com/title/" + id + "/";
  document
    .getElementById("adder-form")
    .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  await flushHydration();
}

function openModal(el) {
  el.hidden = false;
}

describe("Clear-all confirmation modal", () => {
  test("does nothing when the board is empty", () => {
    document.getElementById("clear-all").click();
    expect(document.getElementById("clear-modal").hidden).toBe(true);
  });

  test("opens on click and closes via Cancel", async () => {
    await addAndHydrate("tt0111161");
    document.getElementById("clear-all").click();
    expect(document.getElementById("clear-modal").hidden).toBe(false);
    document.querySelector("#clear-modal .modal__cancel").click();
    expect(document.getElementById("clear-modal").hidden).toBe(true);
  });

  test("Escape and backdrop close the modal", async () => {
    await addAndHydrate("tt0111161");
    document.getElementById("clear-all").click();
    document
      .getElementById("clear-modal")
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.getElementById("clear-modal").hidden).toBe(true);

    document.getElementById("clear-all").click();
    document.querySelector("#clear-modal [data-close]").click();
    expect(document.getElementById("clear-modal").hidden).toBe(true);
  });

  test("focus is trapped and returns to Clear all after close", async () => {
    await addAndHydrate("tt0111161");
    const clearBtn = document.getElementById("clear-all");
    clearBtn.focus();
    clearBtn.click();
    const focusables = document.querySelectorAll(
      "#clear-modal button:not([disabled])"
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();
    document
      .getElementById("clear-modal")
      .dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        })
      );
    expect(document.activeElement).toBe(last);
    last.focus();
    document
      .getElementById("clear-modal")
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
      );
    expect(document.activeElement).toBe(first);
    last.click(); // confirm
    expect(document.getElementById("clear-modal").hidden).toBe(true);
    expect(document.activeElement).toBe(clearBtn);
  });

  test("confirm wipes the board, votes, and storage", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    document
      .querySelector('.menu__card[data-id="tt0111161"] [data-vote="tt0111161"][data-direction="inc"]')
      .click();
    expect(document.getElementById("board-count-chip").textContent).toBe("2 / 9");
    document.getElementById("clear-all").click();
    document.getElementById("clear-confirm").click();
    expect(document.getElementById("clear-modal").hidden).toBe(true);
    expect(document.getElementById("board-count-chip").textContent).toBe("0 / 9");
    expect(
      document.querySelector(".menu__empty") ||
        document.querySelectorAll("#movie-grid .menu__card").length === 0
    ).toBeTruthy();
    // clear writes an empty votes map back to storage (board + votes wiped)
    expect(
      JSON.parse(window.localStorage.getItem("movieVotes.v1") || "{}").byId
    ).toEqual({});
  });
});

describe("Winner reveal modal", () => {
  test("reveal button is disabled on an empty board", () => {
    expect(document.getElementById("show-winner").disabled).toBe(true);
  });

  test("blocked while votes are unallocated, with the exact message", async () => {
    await addAndHydrate("tt0111161");
    document.getElementById("show-winner").click();
    expect(document.getElementById("winner-modal").hidden).toBe(true);
    expect(
      document.querySelector("#toast-region .toast--error .toast__text").textContent
    ).toBe("Allocate 10 more votes before revealing the winner.");
  });

  test("opens with the winner hero, ranked rows, and a highlighted winner", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    // allocate 6 to A, 4 to B -> A wins
    for (let i = 0; i < 6; i++)
      document
        .querySelector('[data-vote="tt0111161"][data-direction="inc"]')
        .click();
    for (let i = 0; i < 4; i++)
      document
        .querySelector('[data-vote="tt0111162"][data-direction="inc"]')
        .click();
    document.getElementById("show-winner").click();
    expect(document.getElementById("winner-modal").hidden).toBe(false);
    const winnerRow = document.querySelector(".winner-row--winner");
    expect(winnerRow).not.toBeNull();
    expect(winnerRow.textContent).toContain("tt0111161".slice(0));
    // rows are sorted by votes descending
    const rows = document.querySelectorAll("#winner-rows .winner-row");
    expect(rows.length).toBe(2);
    const pcts = [...document.querySelectorAll("#winner-rows .winner-row__pct")].map(
      (e) => parseInt(e.textContent, 10)
    );
    expect(pcts[0]).toBeGreaterThanOrEqual(pcts[1]);
    expect(pcts[0] + pcts[1]).toBe(100);
  });

  test("ties go to the earliest-added movie", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    for (let i = 0; i < 5; i++) {
      document
        .querySelector('[data-vote="tt0111161"][data-direction="inc"]')
        .click();
      document
        .querySelector('[data-vote="tt0111162"][data-direction="inc"]')
        .click();
    }
    document.getElementById("show-winner").click();
    expect(document.querySelector(".winner-row--winner").textContent).toContain(
      "tt0111161"
    );
  });

  test("closing returns focus to the reveal button and re-tallies on reopen", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    for (let i = 0; i < 7; i++)
      document
        .querySelector('[data-vote="tt0111161"][data-direction="inc"]')
        .click();
    for (let i = 0; i < 3; i++)
      document
        .querySelector('[data-vote="tt0111162"][data-direction="inc"]')
        .click();
    const reveal = document.getElementById("show-winner");
    reveal.focus();
    reveal.click();
    expect(document.getElementById("winner-modal").hidden).toBe(false);
    document
      .getElementById("winner-modal")
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    expect(document.getElementById("winner-modal").hidden).toBe(true);
    expect(document.activeElement).toBe(reveal);

    // reallocate: free A's 7 votes and give them all to B, then reopen -> fresh tally
    for (let i = 0; i < 7; i++)
      document
        .querySelector('[data-vote="tt0111161"][data-direction="dec"]')
        .click();
    for (let i = 0; i < 7; i++)
      document
        .querySelector('[data-vote="tt0111162"][data-direction="inc"]')
        .click();
    reveal.click();
    expect(
      document.querySelector(".winner-row--winner").textContent
    ).toContain("tt0111162");
  });
});
