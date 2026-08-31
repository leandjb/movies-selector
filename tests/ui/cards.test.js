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

describe("Movie cards", () => {
  test("display order is insertion order and survives voting", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    await addAndHydrate("tt0111163");
    const ids = [...document.querySelectorAll("#movie-grid .menu__card")].map(
      (c) => c.dataset.id
    );
    expect(ids).toEqual(["tt0111161", "tt0111162", "tt0111163"]);

    // vote on the middle card; order must not change
    for (let i = 0; i < 4; i++)
      document
        .querySelector('[data-vote="tt0111162"][data-direction="inc"]')
        .click();
    const idsAfter = [...document.querySelectorAll("#movie-grid .menu__card")].map(
      (c) => c.dataset.id
    );
    expect(idsAfter).toEqual(["tt0111161", "tt0111162", "tt0111163"]);
  });

  test("rank chips are 1..n and the remove button deletes the right card", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    const ranks = [...document.querySelectorAll("#movie-grid .menu__rank")].map(
      (r) => r.textContent
    );
    expect(ranks).toEqual(["1", "2"]);

    document
      .querySelector('.menu__card[data-id="tt0111161"] [data-remove="tt0111161"]')
      .click();
    const ids = [...document.querySelectorAll("#movie-grid .menu__card")].map(
      (c) => c.dataset.id
    );
    expect(ids).toEqual(["tt0111162"]);
    // pruning also removed its votes (none allocated here, but storage map clean)
    expect(
      JSON.parse(window.localStorage.getItem("movieVotes.v1") || "{}").byId
    ).toEqual({});
  });

  test("hydrated card shows a year badge and an IMDb link, never a rating badge", async () => {
    await addAndHydrate("tt0111161");
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    expect(card.querySelector(".badge--imdb")).toBeNull();
    expect(card.querySelector(".badge--year")).not.toBeNull();
    expect(card.querySelector(".badge--link")).not.toBeNull();
  });

  test("failed hydration shows the year placeholder and keeps the IMDb link", async () => {
    installFetch(
      createFetchRouter([statusRoute("suggestion", 500, { error: "nope" })])
    );
    await addAndHydrate("tt0111161");
    const card = document.querySelector('.menu__card[data-id="tt0111161"]');
    expect(card.querySelector(".badge--year").textContent.trim()).toBe("—");
    // the IMDb link is buildable from the id, so it renders regardless
    expect(card.querySelector(".badge--link")).not.toBeNull();
    // and still no rating badge
    expect(card.querySelector(".badge--imdb")).toBeNull();
  });

  test("badge row shows the year once hydrated", async () => {
    await addAndHydrate("tt0111161");
    const year = document.querySelector(
      '.menu__card[data-id="tt0111161"] .badge--year'
    );
    expect(year.textContent.trim()).toBe("2021");
  });

  test("badge row link opens the movie's IMDb page in a new tab", async () => {
    await addAndHydrate("tt0111161");
    const link = document.querySelector(
      '.menu__card[data-id="tt0111161"] .badge--link'
    );
    expect(link.getAttribute("href")).toBe(
      "https://www.imdb.com/title/tt0111161/"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("broken poster URL wires the fallback class via onerror", async () => {
    await addAndHydrate("tt0111161");
    const img = document.querySelector(
      '.menu__card[data-id="tt0111161"] .menu__poster'
    );
    // jsdom doesn't fire the inline onerror on a synthetic event, so assert the
    // fallback is wired into the markup (onerror adds the fallback class).
    expect(img.getAttribute("onerror")).toContain("menu__poster--fallback");
  });

  test("empty board renders the empty-state block", () => {
    expect(document.querySelector(".menu__empty")).not.toBeNull();
  });
});

describe("Vote cluster", () => {
  test("counter arc share scales with votes over the max", async () => {
    await addAndHydrate("tt0111161");
    await addAndHydrate("tt0111162");
    // give A 3 of a 10 budget; max allocated = 3 -> A's arc share = 3/3 = 1
    for (let i = 0; i < 3; i++)
      document
        .querySelector('[data-vote="tt0111161"][data-direction="inc"]')
        .click();
    const arcA = document.querySelector(
      '.menu__card[data-id="tt0111161"] .counter__arc'
    );
    const dash = arcA.getAttribute("stroke-dasharray").split(" ");
    const shareA = parseFloat(dash[0]) / parseFloat(dash[1]);
    expect(shareA).toBeCloseTo(1, 5);

    const arcB = document.querySelector(
      '.menu__card[data-id="tt0111162"] .counter__arc'
    );
    const dashB = arcB.getAttribute("stroke-dasharray").split(" ");
    const shareB = parseFloat(dashB[0]) / parseFloat(dashB[1]);
    expect(shareB).toBeCloseTo(0, 5);
  });

  test("+ disabled at budget spend, - disabled at zero votes", async () => {
    await addAndHydrate("tt0111161");
    const incSel = '[data-vote="tt0111161"][data-direction="inc"]';
    const decSel = '[data-vote="tt0111161"][data-direction="dec"]';
    expect(document.querySelector(decSel).disabled).toBe(true); // 0 votes yet
    for (let i = 0; i < 10; i++) document.querySelector(incSel).click();
    expect(document.querySelector(incSel).disabled).toBe(true); // budget spent
    expect(document.querySelector(decSel).disabled).toBe(false);
  });

  test("vote buttons carry the movie id in their aria-label", async () => {
    await addAndHydrate("tt0111161");
    const inc = document.querySelector(
      '[data-vote="tt0111161"][data-direction="inc"]'
    );
    expect(inc.getAttribute("aria-label")).toContain("tt0111161");
  });
});
