/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import "../../src/imdb.js";
import "../../src/queue.js";
import "../../src/board.js";
import "../../src/gist.js";
import "../../src/gists-list.js";
import "../../src/winner.js";
import "../../src/topbar.js";
import "../../src/toast.js";
import {
  loadApp,
  installFetch,
  uninstallFetch,
} from "../helpers/app-harness.js";

beforeEach(() => {
  jest.useFakeTimers();
  installFetch({ fn: async () => ({ ok: false, status: 502, json: async => ({}), text: async => "" }) });
  loadApp();
});

afterEach(() => {
  jest.useRealTimers();
  uninstallFetch();
});

describe("paste controls", () => {
  test("imdb paste button exists", () => {
    expect(document.getElementById("imdb-paste")).toBeTruthy();
  });

  test("gist paste button exists", () => {
    expect(document.getElementById("gist-paste")).toBeTruthy();
  });

  test("imdb paste button is in tab order before submit", () => {
    const form = document.getElementById("adder-form");
    const buttons = form.querySelectorAll("button");
    const ids = Array.from(buttons).map((b) => b.id);
    expect(ids).toContain("imdb-paste");
    expect(ids.indexOf("imdb-paste")).toBeLessThan(ids.indexOf("adder-add"));
  });

  test("gist paste button is in tab order before import", () => {
    const paste = document.getElementById("gist-paste");
    const imp = document.getElementById("gist-import");
    // Both should be inside the gist control
    expect(paste.closest(".gist")).toBeTruthy();
    expect(imp.closest(".gist")).toBeTruthy();
    // Paste comes before import in DOM order
    const allBtns = document.querySelectorAll(".gist button");
    const ids = Array.from(allBtns).map((b) => b.id);
    expect(ids.indexOf("gist-paste")).toBeLessThan(ids.indexOf("gist-import"));
  });

  test("clipboard read fills the imdb field without submitting", async () => {
    const originalClipboard = navigator.clipboard;
    const originalSecure = globalThis.isSecureContext;

    Object.defineProperty(navigator, "clipboard", {
      value: { readText: async () => "https://www.imdb.com/title/tt0118881/" },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    document.getElementById("imdb-paste").click();
    await jest.advanceTimersByTimeAsync(10);

    const input = document.getElementById("imdb-input");
    expect(input.value).toBe("https://www.imdb.com/title/tt0118881/");

    // Board should still be empty (no auto-submit)
    expect(document.getElementById("board-count-chip").textContent).toBe("0 / 9");

    // Restore
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: originalSecure,
      writable: true,
      configurable: true,
    });
  });

  test("clipboard failure shows guidance toast", async () => {
    const originalClipboard = navigator.clipboard;
    const originalSecure = globalThis.isSecureContext;

    Object.defineProperty(navigator, "clipboard", {
      value: { readText: async () => { throw new Error("denied"); } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    document.getElementById("gist-paste").click();
    await jest.advanceTimersByTimeAsync(10);

    const toast = document.querySelector(".toast");
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain("keyboard");

    // Restore
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: originalSecure,
      writable: true,
      configurable: true,
    });
  });

  test("empty clipboard shows guidance toast", async () => {
    const originalClipboard = navigator.clipboard;
    const originalSecure = globalThis.isSecureContext;

    Object.defineProperty(navigator, "clipboard", {
      value: { readText: async () => "" },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    document.getElementById("imdb-paste").click();
    await jest.advanceTimersByTimeAsync(10);

    const toast = document.querySelector(".toast");
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain("keyboard");

    // Restore
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: originalSecure,
      writable: true,
      configurable: true,
    });
  });

  test("manual typing still works with paste button present", () => {
    const input = document.getElementById("imdb-input");
    input.value = "https://www.imdb.com/title/tt0118881/";
    input.dispatchEvent(new Event("input"));
    expect(input.value).toBe("https://www.imdb.com/title/tt0118881/");
  });
});
