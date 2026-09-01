/*
 * imdb.js — link parsing + title metadata fetch/normalize.
 *
 * Loaded as a classic <script> (attaches to window.Imdb) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Imdb).
 *
 * ----------------------------------------------------------------------------
 * DATA SOURCE CONTRACT — direct-first, proxies as fallback (first usable wins)
 *
 *   1. IMDb suggestion API — https://v3.sg.media-imdb.com/suggestion/x/{id}.json
 *      (IMDb-owned, lightweight, not bot-blocked; it SENDS
 *      Access-Control-Allow-Origin, so the browser can call it directly with no
 *      proxy — one request, ~86 ms measured on 2026-08-30). Shape:
 *      { d: [{ id, l: title, y: year, i: { imageUrl } }] }. It provides
 *      title/year/poster only — no rating.
 *
 *      This is fetched DIRECTLY first. The old premise ("NO CORS headers, so
 *      via proxies") was wrong: measured live on 2026-08-30 the endpoint returns
 *      ACAO echoing the caller's origin and answered in ~86 ms, while all three
 *      proxies failed that same session (allorigins 500/520 after 13.4 s,
 *      codetabs 522, cors.workers.dev 429). The proxies are a fallback only.
 *
 *   2. IMDb title page JSON-LD — DELETED. It was WAF-blocked (HTTP 202 with a
 *      zero-byte body direct, 522 through every proxy), so it never rendered a
 *      rating anyway. Ratings are gone: no fetch, no badge, no normalization.
 *
 *   A response that yields no usable fields counts as a source failure and moves
 *   the chain on. If every source fails, the card degrades to placeholder dashes
 *   — never a crash or fabricated data.
 *
 *   PROXY ROTATION: every fallback chain starts at a rotating offset so parallel
 *   hydration requests spread across proxies instead of hammering one (see the
 *   metadata-fetch spec's bounded-concurrency requirement).
 *
 *   RATE LIMITS: a 429 carrying `Retry-After` waits exactly that long (capped by
 *   RETRY_AFTER_CAP) before retrying the same proxy once. A gateway failure
 *   (408/502/504) advances to the next source immediately. The per-movie request
 *   budget is emergent: 1 direct + 3 proxies x 2 attempts = 7 worst case.
 * ----------------------------------------------------------------------------
 */
(function (root) {
  "use strict";

  // One IMDb title link anywhere in a line (any subdomain/scheme).
  // Accepts locale-prefixed paths (e.g. /it/title/, /pt-br/title/) and bare
  // canonical paths (/title/). Bare tt-IDs are intentionally NOT accepted
  // (spec requires a real link).
  const LINK_RE = /imdb\.com\/(?:[^\/\s]+\/)?title\/(tt\d{7,10})/gi;

  const SUGGESTION_URL = (id) =>
    "https://v3.sg.media-imdb.com/suggestion/x/" + encodeURIComponent(id) + ".json";

  // Keyless CORS proxies, tried sequentially as a FALLBACK (first usable wins).
  // corsproxy.io is dropped: keyless requests always 401, pure waste.
  const PROXIES = [
    (url) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
    (url) => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url),
    (url) => "https://test.cors.workers.dev/?" + url,
  ];

  function extractImdbIds(text) {
    if (!text || typeof text !== "string") return [];
    const out = [];
    const re = new RegExp(LINK_RE.source, "gi");
    let m;
    while ((m = re.exec(text)) !== null) {
      out.push(m[1]);
    }
    return out;
  }

  function pick(obj, keys) {
    if (obj == null) return undefined;
    for (const k of keys) {
      if (obj[k] != null) return obj[k];
    }
    return undefined;
  }

  function toNum(v) {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  const hasAnyField = (n) =>
    Boolean(n && (n.title || n.posterUrl || n.year != null));

  // Suggestion API entry: { id, l: title, y: year, i: { imageUrl } }.
  function normalizeSuggestion(id, data) {
    if (!data || !Array.isArray(data.d)) return null;
    const entry = data.d.find((e) => e && e.id === id) || data.d[0];
    if (!entry) return null;
    let poster = entry.i;
    if (poster != null && typeof poster === "object") poster = poster.imageUrl;
    return {
      id: id,
      title: typeof entry.l === "string" ? entry.l : null,
      year: toNum(entry.y),
      posterUrl: typeof poster === "string" ? poster : null,
    };
  }

  function withTimeout(doFetch, url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let promise;
    try {
      promise = Promise.resolve(doFetch(url, { signal: controller.signal }));
    } catch (e) {
      clearTimeout(timer);
      return Promise.reject(e);
    }
    promise.then(
      () => clearTimeout(timer),
      () => clearTimeout(timer)
    );
    return promise;
  }

  // ---- Sequential proxy fallback with bounded retry ------------------------
  const RETRIES = 1; // up to 2 attempts per proxy (1 initial + 1 retry)
  const BACKOFF_BASE = 1500; // ms (exponential)
  const BACKOFF_CAP = 6000; // ms (per-attempt ceiling)
  const BACKOFF_JITTER = 500; // ms (randomized)
  const RETRY_AFTER_CAP = 15000; // ms — never stall the queue on a huge hint

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Rotate the proxy list so each caller starts at a different proxy. The queue
  // launches fetches in parallel slots; rotation is what keeps those parallel
  // requests off the same proxy.
  let rotation = 0;
  function rotatedProxies() {
    const offset = rotation++ % PROXIES.length;
    return PROXIES.slice(offset).concat(PROXIES.slice(0, offset));
  }

  // `Retry-After` is either delta-seconds or an HTTP-date. Returns ms, or null
  // when the header is missing/unparseable (caller falls back to backoff).
  function retryAfterMs(res) {
    const headers = res && res.headers;
    const raw = headers && typeof headers.get === "function"
      ? headers.get("Retry-After") || headers.get("retry-after")
      : null;
    if (raw == null) return null;
    const seconds = Number(String(raw).trim());
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const at = Date.parse(String(raw));
    if (!Number.isFinite(at)) return null;
    return Math.max(0, at - Date.now());
  }

  function backoff(attempt) {
    const base = Math.min(BACKOFF_BASE * 2 ** attempt, BACKOFF_CAP);
    return base + Math.random() * BACKOFF_JITTER;
  }

  // A gateway error (408/502/504) means the proxy itself is struggling — advance
  // to the next source immediately rather than retrying a dead hop.
  function isGateway(status) {
    return status === 408 || status === 502 || status === 504;
  }

  function isNetworkError(err) {
    if (!err) return true;
    return err.name === "AbortError" || err.name === "TypeError";
  }

  // Try each proxy URL in order. On a retryable failure, wait `backoff(attempt)`
  // (or honor `Retry-After`) and retry the SAME proxy once before advancing.
  // Resolves with the first usable normalized result; throws an AggregateError
  // when every proxy is exhausted.
  async function tryProxies(urls, id, doFetch) {
    const errors = [];
    for (const url of urls) {
      let attempt = 0;
      while (attempt <= RETRIES) {
        try {
          const res = await withTimeout(doFetch, url);
          if (!res.ok) {
            errors.push(new Error(url + " responded " + res.status));
            // Gateway failures: advance immediately, no retry.
            if (isGateway(res.status)) break;
            // Rate limited: retry once, honoring Retry-After (capped).
            if (res.status === 429 && attempt < RETRIES) {
              const hint = retryAfterMs(res);
              await sleep(hint == null ? backoff(attempt) : Math.min(hint, RETRY_AFTER_CAP));
              attempt += 1;
              continue;
            }
            // Other non-OK (403/404/...): do not retry.
            break;
          }
          const data = normalizeSuggestion(id, await res.json());
          if (hasAnyField(data)) return data;
          errors.push(new Error(url + " returned no usable data"));
          break;
        } catch (err) {
          errors.push(err);
          // Network blips retry once; other throws give up on this source.
          if (isNetworkError(err) && attempt < RETRIES) {
            await sleep(backoff(attempt));
            attempt += 1;
            continue;
          }
          break;
        }
      }
    }
    throw new AggregateError(errors, "All proxies failed");
  }

  // Provider failures arrive wrapped in AggregateError (one per proxy chain).
  // Flatten to the first leaf error so callers — and the toast the visitor
  // reads — see the real cause ("responded 404"), not "All proxies failed".
  function pickError(errors) {
    const leaves = [];
    const walk = (e) => {
      if (!e) return;
      const isAggregate =
        typeof AggregateError !== "undefined" &&
        e instanceof AggregateError &&
        Array.isArray(e.errors);
      if (isAggregate) {
        for (const inner of e.errors) walk(inner);
      } else {
        leaves.push(e);
      }
    };
    for (const e of errors) walk(e);
    return leaves[0] || errors[0] || new Error("All IMDb providers failed");
  }

  async function fetchTitle(id, fetchImpl) {
    const doFetch =
      fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
    if (typeof doFetch !== "function") {
      throw new Error("No fetch implementation available");
    }
    const errors = [];

    // 1) Direct, no proxy — the happy path (~86 ms measured).
    try {
      const res = await withTimeout(doFetch, SUGGESTION_URL(id));
      if (res.ok) {
        const n = normalizeSuggestion(id, await res.json());
        if (hasAnyField(n)) return n;
      }
    } catch (e) {
      errors.push(e);
    }

    // 2) Fallback: the same endpoint through the rotating proxy chain.
    try {
      const urls = rotatedProxies().map((wrap) => wrap(SUGGESTION_URL(id)));
      return await tryProxies(urls, id, doFetch);
    } catch (e) {
      errors.push(e);
      throw pickError(errors) || new Error("All IMDb providers failed");
    }
  }

  const api = {
    extractImdbIds,
    fetchTitle,
    normalizeSuggestion,
    LINK_RE,
    PROXIES,
  };
  root.Imdb = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
