/** @jest-environment jsdom */
import { REQUIRED_IDS, setupDom } from "../helpers/app-harness.js";

beforeEach(setupDom);

test("fixture carries the app's DOM contract ids", () => {
  for (const id of REQUIRED_IDS) {
    expect(document.getElementById(id)).not.toBeNull();
  }
});

test("navbar carries the status surface: count chip, votes pill, reveal control", () => {
  const head = document.querySelector(".site-head__inner");
  expect(head).not.toBeNull();
  expect(head.querySelector("#board-count-chip")).not.toBeNull();
  expect(head.querySelector("#votes-pill")).not.toBeNull();
  expect(head.querySelector("#show-winner")).not.toBeNull();
});

test("hero control column stacks the budget, add, and gist panels", () => {
  const tools = document.querySelector(".hero__tools");
  expect(tools).not.toBeNull();
  expect(tools.querySelectorAll(".ctl").length).toBe(3);
  expect(tools.querySelector("#budget-value")).not.toBeNull();
  expect(tools.querySelector("#budget-progress")).not.toBeNull();
  expect(tools.querySelector("#adder-form")).not.toBeNull();
  expect(tools.querySelector("#gist-import")).not.toBeNull();
});

test("the old status bar, board head, and below-grid reveal are gone", () => {
  expect(document.querySelector(".controls")).toBeNull();
  expect(document.querySelector(".ctl--bar")).toBeNull();
  expect(document.querySelector(".board__head")).toBeNull();
  expect(document.querySelector(".reveal")).toBeNull();
  expect(document.getElementById("adder-feedback")).toBeNull();
  expect(document.getElementById("txt-input")).toBeNull();
});

test("clear all sits at the edge of the board section", () => {
  const board = document.querySelector(".board");
  const clear = document.getElementById("clear-all");
  expect(board).not.toBeNull();
  expect(board.querySelector("#clear-all")).toBe(clear);
  expect(clear.classList.contains("board__clear")).toBe(true);
});

test("toast region is a live region rendered by the fixture", () => {
  const region = document.getElementById("toast-region");
  expect(region.getAttribute("aria-live")).toBe("polite");
  expect(region.classList.contains("toast-region")).toBe(true);
});

test("both modals still exist", () => {
  expect(document.getElementById("winner-modal")).not.toBeNull();
  expect(document.getElementById("clear-modal")).not.toBeNull();
});

test("footer carries the developer credit linking the GitHub profile", () => {
  const foot = document.querySelector(".site-foot");
  expect(foot).not.toBeNull();
  const credit = foot.querySelector(".site-foot__credit a[href='https://github.com/leandjb']");
  expect(credit).not.toBeNull();
  expect(foot.textContent).toContain("Developed with passion by");
  expect(credit.getAttribute("rel")).toBe("noopener noreferrer");
});
