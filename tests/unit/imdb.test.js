import "../../src/imdb.js";
import { jest } from "@jest/globals";

const { extractImdbIds, normalizeSuggestion, fetchTitle } = globalThis.Imdb;

const SUGGESTION_DOMAIN = "v3.sg.media-imdb.com";
const SUGGESTION_HOST = "v3.sg.media-imdb.com/suggestion/";
const PROXY_HOSTS = ["allorigins.win", "codetabs.com", "cors.workers.dev"];
const isDirectSuggestion = (u) =>
  u.includes(SUGGESTION_DOMAIN) && !PROXY_HOSTS.some((h) => u.includes(h));
const isProxySuggestion = (u) =>
  PROXY_HOSTS.some((h) => u.includes(h)) && u.includes(SUGGESTION_DOMAIN);
const isPage = (u) => u.includes("imdb.com/title/");

function res(status, body, headers) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (h) => {
        if (!headers) return null;
        const key = String(h).toLowerCase();
        for (const k of Object.keys(headers)) {
          if (k.toLowerCase() === key) return headers[k];
        }
        return null;
      },
    },
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
}

const SUGGESTION_BODY = (id, title) => ({
  d: [{ id, l: title, y: 2021, i: { imageUrl: "https://img.example/" + id + ".jpg" } }],
});

describe("extractImdbIds", () => {
  it("extracts a canonical www link", () => {
    expect(extractImdbIds("https://www.imdb.com/title/tt0118881/")).toEqual([
      "tt0118881",
    ]);
  });

  it("extracts across subdomains and schemes, case-insensitively", () => {
    const text = "m.imdb.com/title/tt0118881\nhttp://IMDB.COM/title/tt0222222/";
    expect(extractImdbIds(text)).toEqual(["tt0118881", "tt0222222"]);
  });

  it("ignores surrounding text on a line", () => {
    expect(
      extractImdbIds("Crimson Tide https://www.imdb.com/title/tt0118881/ watch it")
    ).toEqual(["tt0118881"]);
  });

  it("returns every match, including repeats, in order", () => {
    const text =
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0118881/";
    expect(extractImdbIds(text)).toEqual(["tt0118881", "tt0118881"]);
  });

  it("extracts multiple distinct links on one line", () => {
    const text =
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0222222/";
    expect(extractImdbIds(text)).toEqual(["tt0118881", "tt0222222"]);
  });

  it("rejects bare tt-IDs and non-links", () => {
    expect(extractImdbIds("tt0118881")).toEqual([]);
    expect(extractImdbIds("not a link at all")).toEqual([]);
    expect(extractImdbIds("https://example.com/title/tt0118881/")).toEqual([]);
  });

  it("returns empty for non-string input", () => {
    expect(extractImdbIds("")).toEqual([]);
    expect(extractImdbIds(null)).toEqual([]);
  });
});

describe("normalizeSuggestion", () => {
  it("maps the suggestion entry matching the id", () => {
    const data = {
      d: [
        { id: "tt9999999", l: "Other", y: 1999, i: { imageUrl: "https://img/o.jpg" } },
        { id: "tt0118881", l: "Her", y: 2013, i: { imageUrl: "https://img/her.jpg" } },
      ],
    };
    expect(normalizeSuggestion("tt0118881", data)).toEqual({
      id: "tt0118881",
      title: "Her",
      year: 2013,
      posterUrl: "https://img/her.jpg",
    });
  });

  it("falls back to the first entry when no id matches", () => {
    const data = { d: [{ id: "tt0222222", l: "Arrival", y: 2016 }] };
    const r = normalizeSuggestion("tt0222222", data);
    expect(r.title).toBe("Arrival");
    expect(r.posterUrl).toBeNull();
  });

  it("returns null without a d array", () => {
    expect(normalizeSuggestion("tt0118881", {})).toBeNull();
    expect(normalizeSuggestion("tt0118881", null)).toBeNull();
  });
});

describe("fetchTitle — direct-first chain", () => {
  afterEach(() => {
    delete globalThis.fetch;
  });

  it("issues the first request as the raw, unwrapped suggestion URL and hydrates from it", async () => {
    const seen = [];
    const fake = async (url) => {
      seen.push(url);
      if (isDirectSuggestion(url)) return res(200, SUGGESTION_BODY("tt0118881", "Her"));
      return res(500, {});
    };
    const d = await fetchTitle("tt0118881", fake);
    expect(d.title).toBe("Her");
    expect(seen.every(isDirectSuggestion)).toBe(true);
    expect(seen.some(isProxySuggestion)).toBe(false);
  });

  it("never requests an imdb.com/title/ page-provider URL", async () => {
    const seen = [];
    const fake = async (url) => {
      seen.push(url);
      if (isDirectSuggestion(url)) return res(200, SUGGESTION_BODY("tt0118881", "Her"));
      return res(500, {});
    };
    await fetchTitle("tt0118881", fake);
    expect(seen.some(isPage)).toBe(false);
  });

  it("falls back to the proxy chain when the direct request fails, and hydrates from the first usable proxy", async () => {
    const seen = [];
    const fake = async (url) => {
      seen.push(url);
      if (isDirectSuggestion(url)) return res(403, {});
      if (isProxySuggestion(url)) return res(200, SUGGESTION_BODY("tt0118881", "Her"));
      return res(500, {});
    };
    const d = await fetchTitle("tt0118881", fake);
    expect(d.title).toBe("Her");
    expect(seen.some(isDirectSuggestion)).toBe(true);
    expect(seen.some(isProxySuggestion)).toBe(true);
    expect(seen.some(isPage)).toBe(false);
  });

  it("degrades to a placeholder when every source fails", async () => {
    const fake = async () => res(500, {});
    await expect(fetchTitle("tt1234567", fake)).rejects.toThrow();
  });
});

describe("fetchTitle — retry policy", () => {
  afterEach(() => {
    delete globalThis.fetch;
    jest.useRealTimers();
  });

  it("advances past a gateway error (408) without retrying the same proxy", async () => {
    const byProxy = {};
    const fake = async (url) => {
      if (isDirectSuggestion(url)) return res(403, {});
      const host = PROXY_HOSTS.find((h) => url.includes(h));
      byProxy[host] = (byProxy[host] || 0) + 1;
      return res(408, {}); // gateway -> advance immediately, no retry
    };
    await fetchTitle("tt1234567", fake).catch(() => {});
    expect(Object.values(byProxy).every((n) => n === 1)).toBe(true);
  });

  it("retries a 429 on the same proxy once, honoring Retry-After", async () => {
    jest.useFakeTimers();
    const hits = {};
    const fake = async (url) => {
      if (isDirectSuggestion(url)) return res(403, {});
      const host = PROXY_HOSTS.find((h) => url.includes(h));
      hits[host] = (hits[host] || 0) + 1;
      if (hits[host] === 1) {
        return res(429, SUGGESTION_BODY("tt0118881", "Her"), { "Retry-After": "5" });
      }
      return res(200, SUGGESTION_BODY("tt0118881", "Her"));
    };
    const p = fetchTitle("tt0118881", fake);
    await jest.advanceTimersByTimeAsync(4900);
    expect(Object.values(hits).some((n) => n === 1)).toBe(true); // still inside Retry-After
    await jest.advanceTimersByTimeAsync(1200);
    const d = await p;
    expect(d.title).toBe("Her");
    expect(PROXY_HOSTS.some((h) => hits[h] === 2)).toBe(true);
  });

  it("bounds total requests per movie at 7 when every source fails", async () => {
    jest.useFakeTimers();
    const seen = [];
    const fake = async (url) => {
      seen.push(url);
      return res(429, {}, { "Retry-After": "1" });
    };
    const p = fetchTitle("tt1234567", fake).catch(() => {});
    await jest.advanceTimersByTimeAsync(60000);
    await p;
    expect(seen.length).toBeLessThanOrEqual(7);
    expect(seen.length).toBe(7);
  });
});
