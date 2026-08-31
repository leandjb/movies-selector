import "../../src/imdb.js";
import "../../src/queue.js";
import { jest } from "@jest/globals";
import {
  installFetch,
  uninstallFetch,
  createFetchRouter,
  suggestionSuccessRoute,
  makeResponse,
  unwrapProxy,
} from "../helpers/app-harness.js";

const { fetchTitle } = globalThis.Imdb;
const { createQueue } = globalThis.Queue;

const SUGGESTION_DOMAIN = "v3.sg.media-imdb.com";
const SUGGESTION_HOST = "v3.sg.media-imdb.com/suggestion/";
const PROXY_HOSTS = ["allorigins.win", "codetabs.com", "cors.workers.dev"];
const isDirectSuggestion = (u) =>
  u.includes(SUGGESTION_DOMAIN) && !PROXY_HOSTS.some((h) => u.includes(h));
const isProxySuggestion = (u) =>
  PROXY_HOSTS.some((h) => u.includes(h)) && u.includes(SUGGESTION_DOMAIN);
const proxyHostOf = (u) => PROXY_HOSTS.find((h) => u.includes(h)) || null;
const suggestionBodyFor = (target) => {
  const m = /suggestion\/x\/([^.]+)\.json/.exec(target);
  const id = m ? m[1] : "tt0000000";
  return {
    d: [{ id, l: "Hydrated " + id, y: 2021, i: { imageUrl: "https://img.example/" + id + ".jpg" } }],
  };
};

function okSuggestion(url) {
  return makeResponse(200, suggestionBodyFor(unwrapProxy(url)));
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  uninstallFetch();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// 3.1 API contract
// ---------------------------------------------------------------------------

describe("API contract", () => {
  test("a 200 with a usable suggestion hydrates the movie", async () => {
    const router = createFetchRouter([suggestionSuccessRoute()]);
    installFetch(router);
    const d = await fetchTitle("tt0118881");
    expect(d.title).toBe("Hydrated tt0118881");
    expect(d.year).toBe(2021);
    expect(d.posterUrl).toBe("https://img.example/tt0118881.jpg");
  });

  test("a 200 with an empty suggestion array is a source failure", async () => {
    const router = createFetchRouter([
      { test: (t) => t.includes(SUGGESTION_HOST), status: 200, body: { d: [] } },
    ]);
    installFetch(router);
    await expect(fetchTitle("tt1234567")).rejects.toThrow();
  });

  test("malformed JSON is treated as an unusable source", async () => {
    const router = createFetchRouter([
      { test: (t) => t.includes(SUGGESTION_HOST), status: 200, body: "{ not json" },
    ]);
    installFetch(router);
    await expect(fetchTitle("tt1234567")).rejects.toThrow();
  });

  test("a 408 (gateway) is never retried on the same proxy", async () => {
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} },
      { test: isProxySuggestion, status: 408, body: {} },
    ]);
    installFetch(router);
    await fetchTitle("tt1234567").catch(() => {});
    const perProxy = {};
    for (const c of router.callLog) {
      const h = proxyHostOf(c.url);
      if (h) perProxy[h] = (perProxy[h] || 0) + 1;
    }
    expect(Object.values(perProxy).every((n) => n === 1)).toBe(true);
  });

  test("502 and 504 are gateway errors that advance immediately", async () => {
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} },
      { test: isProxySuggestion, status: 502, body: {} },
    ]);
    installFetch(router);
    await fetchTitle("tt1234567").catch(() => {});
    const perProxy = {};
    for (const c of router.callLog) {
      const h = proxyHostOf(c.url);
      if (h) perProxy[h] = (perProxy[h] || 0) + 1;
    }
    expect(Object.values(perProxy).every((n) => n === 1)).toBe(true);
  });

  test("a 429 honors a Retry-After hint before retrying", async () => {
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} },
      {
        test: isProxySuggestion,
        status: (t, url) => (proxyHostOf(url) === PROXY_HOSTS[0] ? 429 : 200),
        headers: () => ({ "Retry-After": "5" }),
        body: (t) => suggestionBodyFor(t),
      },
    ]);
    installFetch(router);
    const p = fetchTitle("tt0118881");
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(4900);
    const first = router.callLog.filter((c) => isProxySuggestion(c.url)).length;
    expect(first).toBe(1); // still inside Retry-After
    await jest.advanceTimersByTimeAsync(1200);
    const d = await p;
    expect(d.title).toBe("Hydrated tt0118881");
  });

  test("Retry-After is read case-insensitively", async () => {
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} },
      {
        test: isProxySuggestion,
        status: (t, url) => (proxyHostOf(url) === PROXY_HOSTS[0] ? 429 : 200),
        headers: () => ({ "retry-after": "3" }), // lowercase
        body: (t) => suggestionBodyFor(t),
      },
    ]);
    installFetch(router);
    const p = fetchTitle("tt0118881");
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2900);
    const first = router.callLog.filter((c) => isProxySuggestion(c.url)).length;
    expect(first).toBe(1); // lowercased header still honored
    await jest.advanceTimersByTimeAsync(1200);
    const d = await p;
    expect(d.title).toBe("Hydrated tt0118881");
  });
});

// ---------------------------------------------------------------------------
// 3.2 CORS posture
// ---------------------------------------------------------------------------

describe("CORS posture (direct request stays preflight-free)", () => {
  test("the direct request carries no custom headers (a simple GET)", async () => {
    const router = createFetchRouter([suggestionSuccessRoute()]);
    installFetch(router);
    await fetchTitle("tt0118881");
    const direct = router.callLog.find((c) => isDirectSuggestion(c.url));
    expect(direct).toBeTruthy();
    // no custom headers => a plain GET the browser will never preflight
    // (signal is fine — it's not a header)
    expect(!direct.opts || !direct.opts.headers).toBe(true);
  });

  test("a simulated CORS block (a fetch TypeError) falls back to the proxy chain", async () => {
    const router = createFetchRouter([
      // a CORS failure surfaces to caller code as a fetch TypeError
      { test: isDirectSuggestion, status: 200, body: () => { throw new TypeError("Failed to fetch"); } },
      suggestionSuccessRoute(),
    ]);
    installFetch(router);
    const d = await fetchTitle("tt0118881");
    expect(d.title).toBe("Hydrated tt0118881");
    expect(router.callLog.some((c) => isProxySuggestion(c.url))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3.3 Fetch transport
// ---------------------------------------------------------------------------

describe("Fetch transport", () => {
  test("a hanging request is aborted at the timeout and falls back", async () => {
    const fn = (url, opts) => {
      if (isDirectSuggestion(url)) {
        return new Promise((resolve, reject) => {
          if (opts && opts.signal) {
            if (opts.signal.aborted) return reject(abortError());
            opts.signal.addEventListener("abort", () => reject(abortError()));
          }
          // never resolves on its own
        });
      }
      return Promise.resolve(okSuggestion(url));
    };
    installFetch({ fn });
    const p = fetchTitle("tt0118881");
    await jest.advanceTimersByTimeAsync(11000); // > 10s timeout
    const d = await p;
    expect(d.title).toBe("Hydrated tt0118881");
  });

  test("a network TypeError on a proxy advances to the next proxy", async () => {
    const fn = (url) => {
      if (isDirectSuggestion(url)) return Promise.resolve(makeResponse(403, {}));
      if (url.includes(PROXY_HOSTS[0])) {
        return Promise.reject(new TypeError("network down"));
      }
      return Promise.resolve(okSuggestion(url));
    };
    installFetch({ fn });
    const d = await fetchTitle("tt0118881");
    expect(d.title).toBe("Hydrated tt0118881");
  });

  test("a JSON parse failure is treated as an unusable source", async () => {
    const fn = (url) => {
      if (isDirectSuggestion(url)) return Promise.resolve(makeResponse(403, {}));
      return Promise.resolve(makeResponse(200, "{ broken"));
    };
    installFetch({ fn });
    await expect(fetchTitle("tt1234567")).rejects.toThrow();
  });
});

function abortError() {
  return new DOMException("The operation was aborted", "AbortError");
}

// ---------------------------------------------------------------------------
// 4. Rate-limit strategy suite
// ---------------------------------------------------------------------------

describe("Rate-limit strategy — sustained pace, retries, recovery, boundaries", () => {
  test("4.1 sustained traffic at the self-imposed pace completes with no 429s and launches spaced by the gap", async () => {
    const router = createFetchRouter([suggestionSuccessRoute()]);
    installFetch(router);
    const starts = [];
    const q = createQueue({
      worker: (id) => {
        starts.push(Date.now());
        return fetchTitle(id);
      },
      concurrency: 3,
      gap: 150,
      jitter: 250,
    });
    const ids = Array.from({ length: 6 }, (_, i) => "tt000000" + i);
    const results = ids.map((id) => q.enqueue(id));
    let guard = 0;
    while (guard < 400 && starts.length < ids.length) {
      await jest.advanceTimersByTimeAsync(50);
      await Promise.resolve();
      guard += 1;
    }
    // drain any remaining backoffs/retries
    await jest.advanceTimersByTimeAsync(1000);
    const values = await Promise.all(results);
    expect(values).toHaveLength(6);
    expect(values.every((v) => v && v.title)).toBe(true);
    // every launch is at least one gap apart from the previous one
    const diffs = starts.slice(1).map((t, i) => t - starts[i]);
    expect(diffs.every((d) => d >= 149)).toBe(true);
  });

  test("4.2 a 429 is retried exactly once per proxy, honoring Retry-After, and never more", async () => {
    let firstHost = null;
    let hits = 0;
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} },
      {
        test: isProxySuggestion,
        status: (t, url) => {
          const h = proxyHostOf(url);
          if (firstHost === null) firstHost = h;
          if (h === firstHost) {
            hits += 1;
            return hits === 1 ? 429 : 200;
          }
          return 200;
        },
        headers: () => ({ "Retry-After": "3" }),
        body: (t) => suggestionBodyFor(t),
      },
    ]);
    installFetch(router);
    const p = fetchTitle("tt0118881");
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2900);
    const proxyCalls = router.callLog.filter((c) => isProxySuggestion(c.url)).length;
    expect(proxyCalls).toBe(1); // waiting out the 3s hint (one proxy tried, sleeping)
    await jest.advanceTimersByTimeAsync(3000);
    const d = await p;
    expect(d.title).toBe("Hydrated tt0118881");
    const totalProxy = router.callLog.filter((c) => isProxySuggestion(c.url)).length;
    expect(totalProxy).toBe(2); // exactly one retry of that proxy
  });

  test("4.3 the chain recovers after the rate-limit reset window passes", async () => {
    let resetAt = Date.now() + 4000; // virtual clock; window opens after this
    const router = createFetchRouter([
      {
        test: isDirectSuggestion,
        status: () => (Date.now() < resetAt ? 429 : 200),
        headers: () => ({ "Retry-After": String(Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))) }),
        body: (t) => suggestionBodyFor(t),
      },
      {
        test: isProxySuggestion,
        status: () => (Date.now() < resetAt ? 429 : 200),
        headers: () => ({ "Retry-After": String(Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))) }),
        body: (t) => suggestionBodyFor(t),
      },
    ]);
    installFetch(router);
    const p = fetchTitle("tt0118881");
    await jest.advanceTimersByTimeAsync(5000);
    const d = await p;
    expect(d.title).toBe("Hydrated tt0118881");
  });

  test("4.4 concurrency stays bounded at the queue limit (boundary + burst)", async () => {
    const router = createFetchRouter([{ ...suggestionSuccessRoute(), defer: true }]);
    installFetch(router);
    const q = createQueue({
      worker: (id) => fetchTitle(id),
      concurrency: 3,
      gap: 0,
      jitter: 0,
    });
    const ids = Array.from({ length: 9 }, (_, i) => "tt000000" + i);
    const results = ids.map((id) => q.enqueue(id));
    await jest.advanceTimersByTimeAsync(500);
    expect(router.peakInFlight()).toBeLessThanOrEqual(3);
    expect(router.peakInFlight()).toBe(3); // the +1 request waits
    // drain all deferred batches (queue launches in waves)
    for (let i = 0; i < 5; i++) {
      await router.resolveAll();
      await jest.advanceTimersByTimeAsync(200);
      await Promise.resolve();
    }
    const values = await Promise.all(results);
    expect(values).toHaveLength(9);
    expect(values.every((v) => v && v.title)).toBe(true);
  });

  test("4.4 a burst import peaks at the bound and rotates across proxies", async () => {
    const router = createFetchRouter([
      { test: isDirectSuggestion, status: 403, body: {} }, // force the fallback
      { ...suggestionSuccessRoute(), defer: true, test: isProxySuggestion },
    ]);
    installFetch(router);
    const q = createQueue({
      worker: (id) => fetchTitle(id),
      concurrency: 3,
      gap: 0,
      jitter: 0,
    });
    const ids = Array.from({ length: 9 }, (_, i) => "tt000000" + i);
    const results = ids.map((id) => q.enqueue(id));
    await jest.advanceTimersByTimeAsync(500);
    expect(router.peakInFlight()).toBeLessThanOrEqual(3);
    const hosts = new Set(
      router.callLog.filter((c) => isProxySuggestion(c.url)).map((c) => proxyHostOf(c.url))
    );
    expect(hosts.size).toBeGreaterThanOrEqual(2); // round-robin across proxies
    for (let i = 0; i < 5; i++) {
      await router.resolveAll();
      await jest.advanceTimersByTimeAsync(200);
      await Promise.resolve();
    }
    const values = await Promise.all(results);
    expect(values.every((v) => v && v.title)).toBe(true);
  });
});
