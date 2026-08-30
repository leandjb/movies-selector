import "./imdb.js";
import { jest } from "@jest/globals";

const { extractImdbIds, normalizeSuggestion, fetchTitle } =
  globalThis.Imdb;

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
      rating: null,
      posterUrl: "https://img/her.jpg",
    });
  });

  it("falls back to the first entry when no id matches", () => {
    const data = { d: [{ id: "tt0222222", l: "Arrival", y: 2016 }] };
    const r = normalizeSuggestion("tt0222222", data);
    expect(r.title).toBe("Arrival");
    expect(r.posterUrl).toBeNull();
  });

  it("maps JSON-LD from the IMDb page fallback", () => {
    const ld = {
      "@type": "Movie",
      name: "Crimson Tide",
      image: "https://m.media-amazon.com/x.jpg",
      datePublished: "1995-05-12",
      aggregateRating: { ratingValue: 7.3, ratingCount: 1000 },
    };
    expect(globalThis.Imdb.normalizeLd("tt0118881", ld)).toEqual({
      id: "tt0118881",
      title: "Crimson Tide",
      year: 1995,
      rating: 7.3,
      posterUrl: "https://m.media-amazon.com/x.jpg",
    });
  });

  it("returns null without a d array", () => {
    expect(normalizeSuggestion("tt0118881", {})).toBeNull();
    expect(normalizeSuggestion("tt0118881", null)).toBeNull();
  });
});

const LD_HTML =
  '<html><head><script type="application/ld+json">{"@type":"Movie","name":"Crimson Tide","image":"https://m.media-amazon.com/x.jpg","datePublished":"1995-05-12","aggregateRating":{"ratingValue":7.3}}<\/script></head></html>';

const isPageUrl = (u) =>
  u.includes("imdb.com%2Ftitle") || u.includes("imdb.com/title");
const isSuggestionUrl = (u) => u.includes("suggestion");

// Which proxy in Imdb.PROXIES order wrapped a URL (0-based): replay each
// wrapper against the known suggestion URL and match the exact result.
const proxyIndexOf = (u, id) => {
  const { PROXIES } = globalThis.Imdb;
  const target =
    "https://v3.sg.media-imdb.com/suggestion/x/" + id + ".json";
  for (let i = 0; i < PROXIES.length; i += 1) {
    if (PROXIES[i](target) === u) return i;
  }
  return -1;
};

const suggestionOk = () => ({
  ok: true,
  json: async () => ({
    d: [{ id: "tt0118881", l: "Her", y: 2013, i: { imageUrl: "https://img/her.jpg" } }],
  }),
});

// Records every URL tried, in order, before finally answering.
const recorder = (answer) => {
  const seen = [];
  const fake = async (url) => {
    seen.push(url);
    return answer(url, seen.length);
  };
  return { fake, seen };
};

const fail = (status) => ({
  ok: false,
  status,
  text: async () => "",
  json: async () => ({}),
});

describe("fetchTitle", () => {
  afterEach(() => {
    delete globalThis.fetch;
  });

  it("fetches the IMDb suggestion via a proxy (primary provider)", async () => {
    const fake = async (url) => {
      if (isSuggestionUrl(url)) {
        return {
          ok: true,
          json: async () => ({
            d: [{ id: "tt0118881", l: "Her", y: 2013, i: { imageUrl: "https://img/her.jpg" } }],
          }),
        };
      }
      return fail(403);
    };
    const d = await fetchTitle("tt0118881", fake);
    expect(d.title).toBe("Her");
    expect(d.year).toBe(2013);
    expect(d.rating).toBeNull();
    expect(d.posterUrl).toBe("https://img/her.jpg");
  });

  it("falls back to the IMDb page JSON-LD when the suggestion is blocked", async () => {
    const fake = async (url) => {
      if (isSuggestionUrl(url)) return fail(403);
      if (isPageUrl(url)) {
        return { ok: true, text: async () => LD_HTML, json: async () => ({}) };
      }
      return fail(404);
    };
    const d = await fetchTitle("tt0118881", fake);
    expect(d.title).toBe("Crimson Tide");
    expect(d.year).toBe(1995);
    expect(d.rating).toBe(7.3);
    expect(d.posterUrl).toBe("https://m.media-amazon.com/x.jpg");
  });

  it("retries a 429 on the same proxy with backoff before advancing", async () => {
    const tries = new Map();
    const fake = async (url) => {
      if (!isSuggestionUrl(url)) return fail(403);
      const n = (tries.get(url) || 0) + 1;
      tries.set(url, n);
      if (n === 1) {
        return { ok: false, status: 429, text: async () => "", json: async () => ({}) };
      }
      return {
        ok: true,
        json: async () => ({
          d: [{ id: "tt0118881", l: "Her", y: 2013, i: { imageUrl: "https://img/her.jpg" } }],
        }),
      };
    };
    const d = await fetchTitle("tt0118881", fake);
    expect(d.title).toBe("Her");
  });

  it("rotates the starting proxy across successive fetches", async () => {
    const id = "tt0118881";
    const { fake, seen } = recorder((url) =>
      isSuggestionUrl(url) ? suggestionOk() : fail(403)
    );
    await fetchTitle(id, fake);
    await fetchTitle(id, fake);
    await fetchTitle(id, fake);

    // Each fetch succeeds on its first attempt, so the suggestion URLs seen
    // are exactly the starting proxy of each fetch. Rotation state is shared
    // by earlier tests in this file, so assert the cycle, not the offset:
    // each fetch starts one proxy further along, wrapping around.
    const starters = seen.filter(isSuggestionUrl).map((u) => proxyIndexOf(u, id));
    const total = globalThis.Imdb.PROXIES.length;
    expect(starters).toHaveLength(3);
    expect(starters.every((i) => i >= 0 && i < total)).toBe(true);
    expect(starters[1]).toBe((starters[0] + 1) % total);
    expect(starters[2]).toBe((starters[1] + 1) % total);
  });

  it("honors Retry-After seconds on a 429 before retrying", async () => {
    jest.useFakeTimers();
    try {
      let hits = 0;
      const fake = async (url) => {
        if (!isSuggestionUrl(url)) return fail(403);
        hits += 1;
        if (hits === 1) {
          return {
            ok: false,
            status: 429,
            headers: { get: (h) => (h.toLowerCase() === "retry-after" ? "7" : null) },
            text: async () => "",
            json: async () => ({}),
          };
        }
        return suggestionOk();
      };
      const p = fetchTitle("tt0118881", fake);
      await jest.advanceTimersByTimeAsync(6500);
      expect(hits).toBe(1); // still waiting out Retry-After
      await jest.advanceTimersByTimeAsync(1000);
      const d = await p;
      expect(d.title).toBe("Her");
    } finally {
      jest.useRealTimers();
    }
  });

  it("honors a Retry-After HTTP-date", async () => {
    jest.useFakeTimers();
    try {
      let hits = 0;
      const fake = async (url) => {
        if (!isSuggestionUrl(url)) return fail(403);
        hits += 1;
        if (hits === 1) {
          // HTTP-dates are whole seconds: ceil so the delta is >= 5000 ms
          // rather than up to a second short.
          const later = new Date(
            Math.ceil((Date.now() + 5000) / 1000) * 1000
          ).toUTCString();
          return {
            ok: false,
            status: 429,
            headers: { get: (h) => (h.toLowerCase() === "retry-after" ? later : null) },
            text: async () => "",
            json: async () => ({}),
          };
        }
        return suggestionOk();
      };
      const p = fetchTitle("tt0118881", fake);
      await jest.advanceTimersByTimeAsync(4900);
      expect(hits).toBe(1);
      await jest.advanceTimersByTimeAsync(1200);
      await expect(p).resolves.toMatchObject({ title: "Her" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("caps an absurd Retry-After at the documented ceiling", async () => {
    jest.useFakeTimers();
    try {
      let hits = 0;
      const fake = async (url) => {
        if (!isSuggestionUrl(url)) return fail(403);
        hits += 1;
        if (hits === 1) {
          return {
            ok: false,
            status: 429,
            headers: { get: (h) => (h.toLowerCase() === "retry-after" ? "600" : null) },
            text: async () => "",
            json: async () => ({}),
          };
        }
        return suggestionOk();
      };
      const p = fetchTitle("tt0118881", fake);
      // 600 s hint, capped: still waiting at 14.5 s, retried by 15.1 s.
      await jest.advanceTimersByTimeAsync(14500);
      expect(hits).toBe(1);
      await jest.advanceTimersByTimeAsync(600);
      expect(hits).toBe(2);
      await jest.advanceTimersByTimeAsync(0);
      await expect(p).resolves.toMatchObject({ title: "Her" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("falls back to backoff when Retry-After is missing", async () => {
    jest.useFakeTimers();
    try {
      let hits = 0;
      const fake = async (url) => {
        if (!isSuggestionUrl(url)) return fail(403);
        hits += 1;
        if (hits === 1) return fail(429);
        return suggestionOk();
      };
      const p = fetchTitle("tt0118881", fake);
      await jest.advanceTimersByTimeAsync(1400);
      expect(hits).toBe(1);
      await jest.advanceTimersByTimeAsync(600);
      await expect(p).resolves.toMatchObject({ title: "Her" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("never calls the dead api.imdbapi.dev provider", async () => {
    const { fake, seen } = recorder((url) =>
      isSuggestionUrl(url) ? suggestionOk() : fail(403)
    );
    await fetchTitle("tt0118881", fake);
    expect(seen.some((u) => u.includes("api.imdbapi.dev"))).toBe(false);
  });

  it("throws the most specific error when every provider fails", async () => {
    const fake = async () => fail(404);
    await expect(fetchTitle("tt1234567", fake)).rejects.toThrow(/404/);
  });

  it("throws when the network fetch rejects everywhere", async () => {
    const fake = async () => {
      throw new Error("network down");
    };
    await expect(fetchTitle("tt1234567", fake)).rejects.toThrow(/network down/);
  });

  it("throws the most specific error when every provider fails", async () => {
    const fake = async () => fail(404);
    await expect(fetchTitle("tt1234567", fake)).rejects.toThrow(/404/);
  });

  it("throws when the network fetch rejects everywhere", async () => {
    const fake = async () => {
      throw new Error("network down");
    };
    await expect(fetchTitle("tt1234567", fake)).rejects.toThrow(/network down/);
  });

  it("extracts JSON-LD even when the script tag has extra attributes", () => {
    const html =
      '<script id="ld" type="application/ld+json" data-x="1">{"name":"Her","aggregateRating":{"ratingValue":8.0}}<\/script>';
    const parsed = globalThis.Imdb.extractLdJson(html);
    expect(parsed.name).toBe("Her");
  });
});
