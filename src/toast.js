/*
 * toast.js — transient status messages (the page's only feedback channel).
 *
 * Loaded as a classic <script> (attaches to window.Toaster) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Toaster).
 *
 *   const toaster = createToaster({ container, document, maxVisible, duration });
 *   toaster.show("Added 3 movies");
 *   toaster.show("Not an IMDb link", { type: "error" });
 *
 * The container is injected (it is the aria-live region rendered by
 * index.html), and so is the document, which keeps this testable under jsdom
 * without reaching for globals at construction time.
 */
(function (root) {
  "use strict";

  const DEFAULT_DURATION = 4000; // ms before a toast dismisses itself
  const DEFAULT_MAX_VISIBLE = 3;

  function createToaster(opts) {
    const options = opts || {};
    const doc = options.document || (typeof document !== "undefined" ? document : null);
    const container = options.container || null;
    const duration = Number.isFinite(options.duration)
      ? options.duration
      : DEFAULT_DURATION;
    const maxVisible = Number.isInteger(options.maxVisible)
      ? options.maxVisible
      : DEFAULT_MAX_VISIBLE;

    if (!container || !doc) {
      throw new Error("createToaster requires a container and a document");
    }

    const live = [];

    function remove(node) {
      const idx = live.indexOf(node);
      if (idx !== -1) live.splice(idx, 1);
      if (node.timer != null) clearTimeout(node.timer);
      if (node.parentNode) node.parentNode.removeChild(node);
    }

    function show(message, opts2) {
      const settings = opts2 || {};
      const node = doc.createElement("div");
      node.className =
        settings.type === "error" ? "toast toast--error" : "toast";
      node.setAttribute("role", settings.type === "error" ? "alert" : "status");

      const text = doc.createElement("span");
      text.className = "toast__text";
      text.textContent = String(message);
      node.appendChild(text);

      const close = doc.createElement("button");
      close.type = "button";
      close.className = "toast__close";
      close.setAttribute("aria-label", "Dismiss this message");
      close.appendChild(doc.createTextNode("×"));
      close.addEventListener("click", () => remove(node));
      node.appendChild(close);

      container.appendChild(node);
      live.push(node);

      while (live.length > maxVisible && live.length > 0) {
        remove(live[0]);
      }

      if (duration > 0) {
        node.timer = setTimeout(() => remove(node), duration);
      }
      return node;
    }

    function clear() {
      while (live.length > 0) remove(live[0]);
    }

    return { show, clear, count: () => live.length };
  }

  const api = { createToaster, DEFAULT_DURATION, DEFAULT_MAX_VISIBLE };
  root.Toaster = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
