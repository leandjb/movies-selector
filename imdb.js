/*
 * imdb.js — link parsing + title metadata fetch/normalize.
 *
 * Loaded as a classic <script> (attaches to window.Imdb) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Imdb).
 *
 * ----------------------------------------------------------------------------
 * DATA SOURCE CONTRACT — provider chain (first usable result wins)
 *
 *   Proxies are tried SEQUENTIALLY, one at a time, and a failed attempt
 *   (429/408/5xx or network error) is retried with capped exponential backoff
 *   + jitter before the next proxy is tried. This keeps request volume low so
 *   bulk imports of many movies don't trip proxy rate limits (see
 *   resilient-metadata-fetch design).
 *
 *   1. IMDb suggestion API — https://v3.sg.media-imdb.com/suggestion/x/{id}.json
 *      (IMDb-owned, lightweight, not bot-blocked; NO CORS headers, so via
 *      proxies). Shape: { d: [{ id, l: title, y: year, i: { imageUrl } }] }.
 *      Tried FIRST: it is the lightest source and hydrates most movies with a
 *      single request. Provides title/year/poster; rating is unavailable and
 *      renders "—".
 *
 *   2. IMDb title page JSON-LD — https://www.imdb.com/title/{id}/ embedded
 *      <script type="application/ld+json"> (name, image, datePublished,
 *      aggregateRating.ratingValue). Tried second, via proxies, only to add the
 *      rating (suggestion lacks it). IMDb blocks many server-side fetchers so
 *      this is a softer fallback.
 *
 *   A response that yields no usable fields counts as a provider failure and
 *   moves the chain on. If every provider fails, the card degrades to
 *   placeholder dashes — never a crash or fabricated data.
 *
 *   PROXY ROTATION: every fetch starts its proxy chain at a rotating offset, so
 *   consecutive fetches (including the parallel ones the hydration queue
 *   launches) spread across proxies instead of hammering the first one — see
 *   the metadata-fetch spec's bounded-concurrency requirement.
 *
 *   RATE LIMITS: a 429 carrying `Retry-After` waits exactly that long (capped
 *   by RETRY_AFTER_CAP) before retrying; without the header it falls back to
 *   the capped exponential backoff.
 * ----------------------------------------------------------------------------
 */
(function (root) {
  "use strict";

  // One IMDb title link anywhere in a line (any subdomain/scheme).
  // Bare tt-IDs are intentionally NOT accepted (spec requires a real link).
  const LINK_RE = /imdb\.com\/title\/(tt\d{7,10})/gi;

  const PAGE_URL = (id) => "https://www.imdb.com/title/" + id + "/";
  const SUGGESTION_URL = (id) =>
    "https://v3.sg.media-imdb.com/suggestion/x/" + encodeURIComponent(id) + ".json";

  // Keyless CORS proxies, tried sequentially (first win). corsproxy.io is
  // dropped: keyless requests always 401, so every call was pure waste.
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
    Boolean(n && (n.title || n.posterUrl || n.year != null || n.rating != null));

  // Pull the JSON-LD block out of an IMDb title page.
  function extractLdJson(html) {
    const m =
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(
        html || ""
      );
    if (!m) return null;
    try {
      return JSON.parse(m[1].trim());
    } catch {
      return null;
    }
  }

  function findTitleLd(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    const candidates = [];
    if (Array.isArray(parsed)) candidates.push(...parsed);
    else {
      candidates.push(parsed);
      if (Array.isArray(parsed["@graph"])) candidates.push(...parsed["@graph"]);
    }
    return (
      candidates.find(
        (c) => c && typeof c === "object" && c.name && c.aggregateRating
      ) || null
    );
  }

  function normalizeLd(id, parsed) {
    const ld = findTitleLd(parsed);
    if (!ld) return null;
    const year = toNum(
      typeof ld.datePublished === "string" ? ld.datePublished.slice(0, 4) : null
    );
    let poster = ld.image;
    if (Array.isArray(poster)) poster = poster[0];
    if (poster != null && typeof poster === "object") {
      poster = poster.url || poster.contentUrl;
    }
    return {
      id: id,
      title: typeof ld.name === "string" ? ld.name : null,
      year: year,
      rating: toNum(ld.aggregateRating && ld.aggregateRating.ratingValue),
      posterUrl: typeof poster === "string" ? poster : null,
    };
  }

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
      rating: null, // the suggestion API carries no rating
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
  const RETRIES = 2; // up to 3 attempts per proxy (1 + 2 retries)
  const BACKOFF_BASE = 1500; // ms (exponential)
  const BACKOFF_CAP = 6000; // ms (per-attempt ceiling)
  const BACKOFF_JITTER = 500; // ms (randomized)
  const RETRY_AFTER_CAP = 15000; // ms — never stall the queue on a huge hint

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Rotate the proxy list so each caller starts at a different proxy. The
  // queue launches fetches in parallel slots; rotation is what keeps those
  // parallel requests off the same proxy.
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

  // Retry transient failures (rate limit / timeout / server error / network).
  // A parse error or "no usable fields" result is NOT retried — move on.
  function isRetryable(status) {
    return status === 429 || status === 408 || (status >= 500 && status < 600);
  }

  function isNetworkError(err) {
    if (!err) return true;
    return err.name === "AbortError" || err.name === "TypeError";
  }

  // Try each proxy URL in order. On a retryable failure, wait `backoff(attempt)`
  // and retry the SAME proxy before advancing. Resolves with the first usable
  // normalized result; throws an AggregateError when every proxy is exhausted.
  async function tryProxies(urls, parseBody, doFetch) {
    const errors = [];
    for (const url of urls) {
      let attempt = 0;
      while (attempt <= RETRIES) {
        try {
          const res = await withTimeout(doFetch, url);
          if (!res.ok) {
            errors.push(new Error(url + " responded " + res.status));
            if (isRetryable(res.status) && attempt < RETRIES) {
              // Respect the server's own hint when it gives one; otherwise
              // back off on our own schedule. Both are capped.
              const hint = retryAfterMs(res);
              await sleep(
                hint == null ? backoff(attempt) : Math.min(hint, RETRY_AFTER_CAP)
              );
              attempt += 1;
              continue;
            }
            break;
          }
          const data = await parseBody(res);
          if (hasAnyField(data)) return data;
          errors.push(new Error(url + " returned no usable data"));
          break;
        } catch (err) {
          errors.push(err);
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

  // Provider 1: IMDb suggestion API via proxies (title/year/poster only).
  async function fetchFromSuggestion(id, doFetch) {
    const urls = rotatedProxies().map((wrap) => wrap(SUGGESTION_URL(id)));
    return tryProxies(
      urls,
      async (res) => {
        const n = normalizeSuggestion(id, await res.json());
        if (!hasAnyField(n)) throw new Error("no usable suggestion fields");
        return n;
      },
      doFetch
    );
  }

  // Provider 2: IMDb page JSON-LD via proxies (adds the rating).
  async function fetchFromImdbPage(id, doFetch) {
    const urls = rotatedProxies().map((wrap) => wrap(PAGE_URL(id)));
    return tryProxies(
      urls,
      async (res) => {
        const n = normalizeLd(id, extractLdJson(await res.text()));
        if (!hasAnyField(n)) throw new Error("no usable JSON-LD fields");
        return n;
      },
      doFetch
    );
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
    const providers = [fetchFromSuggestion, fetchFromImdbPage];
    const errors = [];
    for (const provider of providers) {
      try {
        return await provider(id, doFetch);
      } catch (e) {
        errors.push(e);
      }
    }
    throw pickError(errors) || new Error("All IMDb providers failed");
  }

  const api = {
    extractImdbIds,
    fetchTitle,
    normalizeLd,
    normalizeSuggestion,
    extractLdJson,
    LINK_RE,
    PROXIES,
  };
  root.Imdb = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
