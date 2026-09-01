/*
 * gists-list.js — GitHub gist listing by username (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.GistsList) and also
 * by Jest (attaches to globalThis.GistsList).
 *
 * Uses the unauthenticated gist list endpoint:
 *   GET https://api.github.com/users/{username}/gists?per_page=100
 *
 * Returns only gists whose files contain a .txt file, mapped to
 * { id, title, date } for display.
 *
 * Errors carry a `code` so callers can show a specific message:
 *   bad-user | network | rate-limited | no-importable-gist
 */
(function (root) {
  "use strict";

  const API_BASE = "https://api.github.com/users/";
  const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

  function listError(code, message) {
    const err = new Error(message || code);
    err.code = code;
    return err;
  }

  function defaultFetch() {
    return typeof fetch === "function" ? fetch : null;
  }

  function isTxtFile(files) {
    return Object.values(files).some(function (f) {
      return (
        f != null &&
        (f.type === "text/plain" || (/\.txt$/i).test(String(f.filename || "")))
      );
    });
  }

  // Maps a gist list-item object to { id, title, date }.
  function mapGist(g) {
    var files = g.files ? Object.values(g.files) : [];
    var txtFile = files.find(function (f) {
      return (
        f != null &&
        (f.type === "text/plain" || (/\.txt$/i).test(String(f.filename || "")))
      );
    });
    return {
      id: g.id,
      title: g.description || (txtFile ? txtFile.filename : "gist"),
      date: g.updated_at || g.created_at || "",
    };
  }

  async function listUserGists(username, fetchImpl) {
    var user = String(username || "").trim();
    if (!user || !USERNAME_RE.test(user)) {
      throw listError("bad-user", "Not a valid GitHub username.");
    }

    var doFetch = fetchImpl || defaultFetch();
    if (!doFetch) throw listError("network", "No fetch implementation.");

    var res;
    try {
      res = await doFetch(API_BASE + user + "/gists?per_page=100", {
        headers: { Accept: "application/vnd.github+json" },
      });
    } catch {
      throw listError("network", "Could not reach GitHub.");
    }
    if (res && res.status === 403) {
      throw listError("rate-limited", "GitHub rate limit hit.");
    }
    if (res && res.status === 404) {
      throw listError("bad-user", "GitHub user not found.");
    }
    if (!res || !res.ok) {
      throw listError("network", "GitHub returned an error.");
    }

    var data;
    try {
      data = await res.json();
    } catch {
      throw listError("network", "GitHub returned invalid JSON.");
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw listError("no-importable-gist", "That user has no public gists.");
    }

    var importable = data.filter(function (g) {
      return g.files && isTxtFile(g.files);
    });

    if (importable.length === 0) {
      throw listError(
        "no-importable-gist",
        "That user has no gist with a .txt file."
      );
    }

    return importable.map(mapGist);
  }

  var api = { listUserGists: listUserGists, USERNAME_RE: USERNAME_RE };
  root.GistsList = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
