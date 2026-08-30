/** @jest-environment jsdom */
import { REQUIRED_IDS, setupDom } from "./tests/helpers/app-harness.js";

beforeEach(setupDom);

test("fixture carries the app's DOM contract ids", () => {
  for (const id of REQUIRED_IDS) {
    expect(document.getElementById(id)).not.toBeNull();
  }
});

test("fixture wires the control sections + reveal button + both modals", () => {
  expect(document.querySelector(".controls")).not.toBeNull();
  expect(document.querySelectorAll(".controls .ctl").length).toBeGreaterThanOrEqual(3);
  // The reveal button keeps its id; its section location is layout, not contract.
  expect(document.getElementById("show-winner")).not.toBeNull();
  expect(document.querySelector(".ctl--status")).not.toBeNull();
  expect(document.getElementById("winner-modal")).not.toBeNull();
  expect(document.getElementById("clear-modal")).not.toBeNull();
});

test("reveal button lives in its own section below the movie grid", () => {
  const reveal = document.querySelector(".reveal");
  expect(reveal).not.toBeNull();
  expect(reveal.querySelector("#show-winner")).not.toBeNull();
  // it sits after the grid in document order (the bottom of the page)
  const grid = document.getElementById("movie-grid");
  expect(grid.compareDocumentPosition(reveal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("footer carries the developer credit linking the GitHub profile", () => {
  const foot = document.querySelector(".site-foot");
  expect(foot).not.toBeNull();
  const credit = foot.querySelector(".site-foot__credit a[href='https://github.com/leandjb']");
  expect(credit).not.toBeNull();
  expect(foot.textContent).toContain("Developed with passion by");
  expect(credit.getAttribute("rel")).toBe("noopener noreferrer");
});
