/*
 * gist.js — GitHub gist fetching for the board importer (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.Gist) and also by Jest
 * (attaches to globalThis.Gist).
 *
 * Gists are CORS-open on api.github.com, so no proxy machinery is needed:
 * one keyless GET returns the gist JSON with file contents inline (unless a
 * file is truncated, in which case its raw_url is fetched as a fallback).
 *
 * Errors carry a `code` so callers can show a specific message:
 *   bad-ref | network | not-found | rate-limited | no-text-file
 */
(function (root) {
  "use strict";

  const API_BASE = "https://api.github.com/gists/";
  const BARE_ID_RE = /^[0-9a-f]{32}$/i;
  const URL_ID_RE = /gist\.github(?:usercontent)?\.com\/(?:[^/\s]+\/)?([0-9a-f]{32})(?:[/?#]|$)/i;

  function gistError(code, message) {
    const err = new Error(message || code);
    err.code = code;
    return err;
  }

  function defaultFetch() {
    return typeof fetch === "function" ? fetch : null;
  }

  // Accepts a bare 32-hex id or a gist URL (user optional, ?ref/trailing
  // slash tolerated). Returns the id (lowercase) or null.
  function parseGistRef(text) {
    const s = String(text || "").trim();
    if (!s) return null;
    if (BARE_ID_RE.test(s)) return s.toLowerCase();
    const m = URL_ID_RE.exec(s);
    return m ? m[1].toLowerCase() : null;
  }

  function isTextFile(f) {
    return (
      f != null &&
      (f.type === "text/plain" || (/\.txt$/i).test(String(f.filename || "")))
    );
  }

  async function fetchTextFile(file, doFetch) {
    if (file.truncated && file.raw_url) {
      let raw;
      try {
        raw = await doFetch(file.raw_url);
      } catch {
        throw gistError("network", "Could not load the truncated gist file.");
      }
      if (!raw || !raw.ok) {
        throw gistError("network", "Could not load the truncated gist file.");
      }
      try {
        return { name: file.filename, content: await raw.text() };
      } catch {
        throw gistError("network", "Could not read the truncated gist file.");
      }
    }
    if (typeof file.content !== "string") {
      throw gistError("no-text-file", "The gist's text file has no content.");
    }
    return { name: file.filename, content: file.content };
  }

  // Resolves { name, content } with the gist's first text file, or throws
  // a coded error (see header).
  async function fetchGistText(ref, fetchImpl) {
    const id = parseGistRef(ref);
    if (!id) {
      throw gistError("bad-ref", "Not a gist URL or id.");
    }

    const doFetch = fetchImpl || defaultFetch();
    if (!doFetch) throw gistError("network", "No fetch implementation.");

    let res;
    try {
      res = await doFetch(API_BASE + id, {
        headers: { Accept: "application/vnd.github+json" },
      });
    } catch {
      throw gistError("network", "Could not reach GitHub.");
    }
    if (res && res.status === 403) {
      throw gistError("rate-limited", "GitHub rate limit hit.");
    }
    if (!res || !res.ok) {
      throw gistError("not-found", "Gist not found.");
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw gistError("network", "GitHub returned invalid JSON.");
    }

    const files = data && data.files ? Object.values(data.files) : [];
    const file = files.find(isTextFile);
    if (!file) {
      throw gistError("no-text-file", "The gist has no .txt file.");
    }
    return fetchTextFile(file, doFetch);
  }

  const api = { parseGistRef, fetchGistText };
  root.Gist = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
