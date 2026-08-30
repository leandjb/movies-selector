import "./imdb.js";

const { extractImdbIds, normalizeTitle, normalizeSuggestion, fetchTitle } =
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

describe("normalizeTitle", () => {
  it("maps the expected fields", () => {
    const d = {
      primaryTitle: "Her",
      startYear: 2013,
      rating: { aggregateRating: 8.0 },
      primaryImage: { url: "https://img/x.jpg" },
    };
    expect(normalizeTitle("tt1234567", d)).toEqual({
      id: "tt1234567",
      title: "Her",
      year: 2013,
      rating: 8.0,
      posterUrl: "https://img/x.jpg",
    });
  });

  it("falls back through alternate field names", () => {
    const d = {
      originalTitle: "Arrival",
      releaseDate: "2016-11-11",
      imdbRating: 7.9,
      image: "https://img/y.jpg",
    };
    expect(normalizeTitle("tt2222222", d)).toEqual({
      id: "tt2222222",
      title: "Arrival",
      year: 2016,
      rating: 7.9,
      posterUrl: "https://img/y.jpg",
    });
  });

  it("returns nulls for missing fields", () => {
    const r = normalizeTitle("tt3333333", {});
    expect(r.title).toBeNull();
    expect(r.year).toBeNull();
    expect(r.rating).toBeNull();
    expect(r.posterUrl).toBeNull();
  });

  it("returns null when data is not an object", () => {
    expect(normalizeTitle("tt3333333", null)).toBeNull();
  });

  it("maps the real IMDbAPI nested shape (titleText/ratings/releaseDate/primaryImage)", () => {
    const d = {
      id: "tt1375666",
      titleType: "movie",
      titleText: { text: "Inception", original: "Inception" },
      originalTitleText: { text: "Inception", original: "Inception" },
      ratings: { aggregateRating: 8.8, voteCount: 2500000 },
      releaseDate: { day: 16, month: 7, year: 2010 },
      primaryImage: { url: "https://img/inception.jpg" },
    };
    expect(normalizeTitle("tt1375666", d)).toEqual({
      id: "tt1375666",
      title: "Inception",
      year: 2010,
      rating: 8.8,
      posterUrl: "https://img/inception.jpg",
    });
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

  it("uses the legacy API as the last resort", async () => {
    const fake = async (url) => {
      if (url.includes("api.imdbapi.dev")) {
        return {
          ok: true,
          json: async () => ({
            titleText: { text: "Inception" },
            ratings: { aggregateRating: 8.8 },
            releaseDate: { year: 2010 },
            primaryImage: { url: "https://img/z.jpg" },
          }),
        };
      }
      return fail(403);
    };
    const d = await fetchTitle("tt1375666", fake);
    expect(d.title).toBe("Inception");
    expect(d.rating).toBe(8.8);
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

  it("treats an unusable legacy payload as a failure", async () => {
    const fake = async (url) => {
      if (url.includes("api.imdbapi.dev")) {
        return { ok: true, json: async () => ({ id: "tt0118881" }) };
      }
      return fail(403);
    };
    await expect(fetchTitle("tt0118881", fake)).rejects.toThrow();
  });

  it("extracts JSON-LD even when the script tag has extra attributes", () => {
    const html =
      '<script id="ld" type="application/ld+json" data-x="1">{"name":"Her","aggregateRating":{"ratingValue":8.0}}<\/script>';
    const parsed = globalThis.Imdb.extractLdJson(html);
    expect(parsed.name).toBe("Her");
  });
});
