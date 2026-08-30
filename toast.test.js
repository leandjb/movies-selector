/**
 * @jest-environment jsdom
 */
import "./toast.js";
import { jest } from "@jest/globals";

const { createToaster } = globalThis.Toaster;

const mount = () => {
  document.body.innerHTML = '<div id="toast-region" aria-live="polite"></div>';
  return document.getElementById("toast-region");
};

describe("createToaster", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a message into its container", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("Added 3 movies");
    expect(document.querySelectorAll(".toast")).toHaveLength(1);
    expect(document.querySelector(".toast__text").textContent).toBe("Added 3 movies");
  });

  it("stacks messages in order, newest last", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("first");
    toaster.show("second");
    toaster.show("third");
    expect(
      [...document.querySelectorAll(".toast__text")].map((n) => n.textContent)
    ).toEqual(["first", "second", "third"]);
  });

  it("caps the number of simultaneous toasts", () => {
    const toaster = createToaster({ container: mount(), maxVisible: 2 });
    toaster.show("one");
    toaster.show("two");
    toaster.show("three");
    const texts = [...document.querySelectorAll(".toast__text")].map((n) => n.textContent);
    expect(texts).toHaveLength(2);
    expect(texts).toEqual(["two", "three"]);
  });

  it("auto-dismisses after the configured duration", () => {
    const toaster = createToaster({ container: mount(), duration: 4000 });
    toaster.show("bye soon");
    expect(document.querySelectorAll(".toast")).toHaveLength(1);
    jest.advanceTimersByTime(3999);
    expect(document.querySelectorAll(".toast")).toHaveLength(1);
    jest.advanceTimersByTime(2);
    expect(document.querySelectorAll(".toast")).toHaveLength(0);
  });

  it("tags errors with a variant class", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("That is not an IMDb link", { type: "error" });
    const node = document.querySelector(".toast");
    expect(node.classList.contains("toast--error")).toBe(true);
  });

  it("leaves non-error toasts without the error variant", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("Imported fine");
    expect(document.querySelector(".toast").classList.contains("toast--error")).toBe(
      false
    );
  });

  it("dismisses a toast when its close control is activated", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("closable");
    document.querySelector(".toast__close").click();
    expect(document.querySelectorAll(".toast")).toHaveLength(0);
  });

  it("works without injected timers by defaulting to real timers", () => {
    const toaster = createToaster({ container: mount() });
    expect(typeof toaster.show).toBe("function");
    expect(typeof toaster.clear).toBe("function");
  });

  it("clear() removes every toast", () => {
    const toaster = createToaster({ container: mount() });
    toaster.show("a");
    toaster.show("b");
    toaster.clear();
    expect(document.querySelectorAll(".toast")).toHaveLength(0);
  });
});
