import "./imdb.js";
import "./board.js";
import "./gist.js";
import "./winner.js";

const { createBoard } = globalThis.Board;
const { extractImdbIds, fetchTitle } = globalThis.Imdb;
const { fetchGistText } = globalThis.Gist;
const { tallyResults } = globalThis.Winner;

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _has: (k) => m.has(k),
  };
}

// Simulates the app's add-then-hydrate pipeline against a fake fetch.
async function addAndHydrate(board, raw, fetchImpl) {
  const summary = board.addFromText(raw, extractImdbIds);
  for (const id of summary.addedIds) {
    try {
      const details = await fetchTitle(id, fetchImpl);
      board.hydrate(id, details);
    } catch {
      board.hydrate(id, null);
    }
  }
  return summary;
}

function unwrapProxy(url) {
  try {
    if (url.includes("allorigins.win/raw?url="))
      return decodeURIComponent(url.split("raw?url=")[1]);
    if (url.includes("codetabs.com/v1/proxy?quest="))
      return decodeURIComponent(url.split("quest=")[1]);
    if (url.includes("corsproxy.io/?url="))
      return decodeURIComponent(url.split("corsproxy.io/?url=")[1]);
    if (url.includes("cors.workers.dev/?"))
      return url.split("cors.workers.dev/?")[1];
  } catch {
    /* fall through */
  }
  return url;
}

const isPageTarget = (t) => t.includes("imdb.com/title");
const isSuggestionTarget = (t) => t.includes("media-imdb.com");

const titleOf = (m) =>
  m.primaryTitle || (m.titleText && m.titleText.text) || null;
const yearOf = (m) =>
  m.startYear || (m.releaseDate && m.releaseDate.year) || null;
const ratingOf = (m) => {
  if (m.ratings && m.ratings.aggregateRating != null)
    return m.ratings.aggregateRating;
  if (m.rating && typeof m.rating === "object")
    return m.rating.aggregateRating;
  return m.rating != null ? m.rating : null;
};
const posterOf = (m) =>
  (m.primaryImage && m.primaryImage.url) || m.image || null;

const ldHtmlFor = (id, m) =>
  '<html><head><script type="application/ld+json">' +
  JSON.stringify({
    "@type": "Movie",
    name: titleOf(m),
    image: posterOf(m),
    datePublished: String(yearOf(m) || 2000) + "-01-01",
    aggregateRating: { ratingValue: ratingOf(m) },
  }) +
  "<\/script></head></html>";

const suggestionFor = (id, m) => ({
  d: [{ id, l: titleOf(m), y: yearOf(m), i: { imageUrl: posterOf(m) } }],
});

// Routed fake: answers whichever provider the chain tries (page via proxy,
// suggestion via proxy, or the legacy direct API).
const fakeFetch = (map) => async (url) => {
  const target = unwrapProxy(url);
  const idMatch = /(tt\d{7,10})/.exec(target);
  const data = idMatch ? map[idMatch[1]] : null;
  if (!data) {
    return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
  }
  if (target.includes("api.imdbapi.dev")) {
    return { ok: true, json: async () => data };
  }
  if (isPageTarget(target)) {
    return { ok: true, text: async () => ldHtmlFor(idMatch[1], data), json: async () => ({}) };
  }
  if (isSuggestionTarget(target)) {
    return { ok: true, json: async () => suggestionFor(idMatch[1], data) };
  }
  return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
};

// Like fakeFetch, but the suggestion endpoint is down (403) so the chain is
// forced to fall back to the IMDb page JSON-LD (which carries the rating).
const fakeFetchSuggestionDown = (map) => async (url) => {
  const target = unwrapProxy(url);
  const idMatch = /(tt\d{7,10})/.exec(target);
  const data = idMatch ? map[idMatch[1]] : null;
  if (!data) {
    return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
  }
  if (target.includes("api.imdbapi.dev")) {
    return { ok: true, json: async () => data };
  }
  if (isPageTarget(target)) {
    return { ok: true, text: async () => ldHtmlFor(idMatch[1], data), json: async () => ({}) };
  }
  if (isSuggestionTarget(target)) {
    return { ok: false, status: 403, text: async () => "", json: async () => ({}) };
  }
  return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
};

describe("integration: paste -> board -> fetch -> hydrate -> persist", () => {
  it("walks the full add flow with a single link (suggestion-first)", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const fetchImpl = fakeFetch({
      tt0118881: {
        primaryTitle: "Her",
        startYear: 2013,
        rating: { aggregateRating: 8.0 },
        primaryImage: { url: "https://img/her.jpg" },
      },
    });

    const summary = await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/",
      fetchImpl
    );
    expect(summary.addedIds).toEqual(["tt0118881"]);
    expect(board.count()).toBe(1);
    expect(board.list()[0].title).toBe("Her");
    expect(board.list()[0].year).toBe(2013);
    // suggestion API is tried first and carries no rating
    expect(board.list()[0].rating).toBeNull();
    expect(board.list()[0].status).toBe("ready");

    // persistence: a fresh board restores the hydrated movie
    const restored = createBoard(store, { extractFn: extractImdbIds });
    restored.load();
    expect(restored.count()).toBe(1);
    expect(restored.list()[0].title).toBe("Her");
  });

  it("fills the rating from the page JSON-LD when the suggestion is unavailable", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const fetchImpl = fakeFetchSuggestionDown({
      tt0118881: {
        primaryTitle: "Her",
        startYear: 2013,
        rating: { aggregateRating: 8.0 },
        primaryImage: { url: "https://img/her.jpg" },
      },
    });
    const summary = await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/",
      fetchImpl
    );
    expect(board.list()[0].title).toBe("Her");
    expect(board.list()[0].rating).toBe(8.0);
    expect(board.list()[0].status).toBe("ready");
  });

  it("enforces the 9-cap and reports skipped across a file import", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const ids = Array.from({ length: 12 }, (_, i) => `tt${String(i + 1).padStart(7, "0")}`);
    const map = {};
    ids.forEach((id) => {
      map[id] = {
        primaryTitle: "Film " + id,
        startYear: 2000,
        rating: { aggregateRating: 7 },
        primaryImage: { url: "https://img/" + id + ".jpg" },
      };
    });
    const summary = await addAndHydrate(
      board,
      ids.map((id) => `https://www.imdb.com/title/${id}/`).join("\n"),
      fakeFetch(map)
    );
    expect(board.count()).toBe(9);
    expect(summary.skipped).toBe(3);
  });

  it("degrades gracefully when a fetch fails (placeholder, not crash)", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const summary = await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/",
      async () => {
        throw new Error("boom");
      }
    );
    expect(summary.addedIds).toEqual(["tt0118881"]);
    const m = board.list()[0];
    expect(m.status).toBe("error");
    expect(m.title).toBeNull();
    expect(m.rating).toBeNull();
  });
});

describe("integration: clear removes board and its votes", () => {
  it("clears the board key and prunes votes for removed movies", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0222222/",
      fakeFetch({
        tt0118881: { primaryTitle: "Her", startYear: 2013, rating: { aggregateRating: 8 } },
        tt0222222: { primaryTitle: "Arrival", startYear: 2016, rating: { aggregateRating: 7.9 } },
      })
    );

    // votes keyed by movie id (mirrors app.js movieVotes.v1 shape)
    const votes = { budget: 5, byId: { tt0118881: 2, tt0222222: 3, tt9999999: 1 } };

    // app-level clear: wipe the board, then prune votes not on the board
    board.clear();
    for (const id of Object.keys(votes.byId)) {
      if (!board.hasId(id)) delete votes.byId[id];
    }

    expect(board.count()).toBe(0);
    expect(store._has("shortlistBoard.v1")).toBe(false);
    expect(votes.byId).toEqual({});
  });
});

describe("integration: removing a single movie", () => {
  const pruneVotes = (votes, board) => {
    for (const id of Object.keys(votes.byId)) {
      if (!board.hasId(id)) delete votes.byId[id];
    }
  };

  it("removes one card, prunes only its votes, and keeps the rest", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0222222/",
      fakeFetch({
        tt0118881: { primaryTitle: "Her", startYear: 2013, rating: { aggregateRating: 8 } },
        tt0222222: { primaryTitle: "Arrival", startYear: 2016, rating: { aggregateRating: 7.9 } },
      })
    );
    const votes = { budget: 10, byId: { tt0118881: 3, tt0222222: 2 } };

    board.remove("tt0118881");
    pruneVotes(votes, board);

    expect(board.count()).toBe(1);
    expect(board.hasId("tt0118881")).toBe(false);
    expect(board.hasId("tt0222222")).toBe(true);
    expect(votes.byId).toEqual({ tt0222222: 2 });
  });

  it("lets the removed movie be re-added and clears the board on last removal", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0222222/",
      fakeFetch({
        tt0118881: { primaryTitle: "Her", startYear: 2013, rating: { aggregateRating: 8 } },
        tt0222222: { primaryTitle: "Arrival", startYear: 2016, rating: { aggregateRating: 7.9 } },
      })
    );

    const removed = board.remove("tt0118881");
    const summary = board.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(removed).toBe(true);
    expect(summary.addedIds).toEqual(["tt0118881"]);
    expect(summary.duplicates).toBe(0);
    expect(board.count()).toBe(2);

    board.remove("tt0118881");
    board.remove("tt0222222");
    expect(board.count()).toBe(0);
    expect(store._has("shortlistBoard.v1")).toBe(true);
  });
});

describe("integration: gist import feeds the add pipeline", () => {
  const GIST_ID = "f14aba6d67faf726ac12a5936ccd14a3";
  const GIST_URL = `https://gist.github.com/leandjb/${GIST_ID}`;
  const GIST_TXT = [
    "https://www.imdb.com/title/tt0118881/",
    "https://www.imdb.com/title/tt0222222/",
    "not a link",
  ].join("\n");

  const gistFetch = (txtContent) => async (url) => {
    if (url.includes("api.github.com/gists/")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          files: {
            "imbd-list.txt": {
              filename: "imbd-list.txt",
              type: "text/plain",
              truncated: false,
              content: txtContent,
            },
          },
        }),
      };
    }
    return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
  };

  it("fetches gist text and merges it through addFromText (dupes/invalid reported)", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    // one movie already on the board -> the gist import reports it as a dupe
    board.addFromText("https://www.imdb.com/title/tt0118881/");

    const { name, content } = await fetchGistText(GIST_URL, gistFetch(GIST_TXT));
    expect(name).toBe("imbd-list.txt");

    const summary = board.addFromText(content);
    expect(summary.addedIds).toEqual(["tt0222222"]);
    expect(summary.duplicates).toBe(1); // tt0118881 already on the board
    expect(summary.invalid).toBe(1); // "not a link"
    expect(board.count()).toBe(2);
    expect(board.list().map((m) => m.id)).toEqual(["tt0118881", "tt0222222"]);
  });

  it("respects the board cap when a gist import overflows it", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const { content } = await fetchGistText(
      GIST_ID,
      gistFetch(
        Array.from({ length: 12 }, (_, i) => `https://www.imdb.com/title/tt${String(i + 1).padStart(7, "0")}/`).join("\n")
      )
    );
    const summary = board.addFromText(content);
    expect(board.count()).toBe(9);
    expect(summary.skipped).toBe(3);
  });

  it("leaves the board untouched when the gist fetch fails", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    board.addFromText("https://www.imdb.com/title/tt0118881/");

    const failing = async (url) => {
      if (url.includes("api.github.com")) throw new TypeError("offline");
      return { ok: false, status: 404 };
    };
    await expect(fetchGistText(GIST_URL, failing)).rejects.toMatchObject({
      code: "network",
    });
    expect(board.count()).toBe(1);
    expect(board.hasId("tt0118881")).toBe(true);
    expect(store._has("shortlistBoard.v1")).toBe(true);
  });
});

describe("integration: blind-vote reveal tally over a live board", () => {
  const LINKS3 = [
    "https://www.imdb.com/title/tt0118881/",
    "https://www.imdb.com/title/tt0222222/",
    "https://www.imdb.com/title/tt0108052/",
  ].join("\n");

  it("tallies an app-shaped votes map against a hydrated board", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    const fetchImpl = fakeFetch({
      tt0118881: { primaryTitle: "Her", startYear: 2013, rating: { aggregateRating: 8 } },
      tt0222222: { primaryTitle: "Arrival", startYear: 2016, rating: { aggregateRating: 7.9 } },
      tt0108052: { primaryTitle: "Schindler's List", startYear: 1993, rating: { aggregateRating: 9 } },
    });
    await addAndHydrate(board, LINKS3, fetchImpl);

    const votes = { budget: 10, byId: { tt0222222: 5, tt0118881: 5 } };
    const r = tallyResults(board.list(), votes.byId, votes.budget);
    expect(r.ok).toBe(true);
    expect(r.winnerId).toBe("tt0118881"); // tie -> earliest added wins
    expect(r.rows[0].id).toBe("tt0118881");
    expect(r.rows[0].pct).toBe(50);
    expect(r.rows.map((row) => row.id)).toEqual([
      "tt0118881",
      "tt0222222",
      "tt0108052",
    ]);
    expect(r.rows[2].votes).toBe(0);
  });

  it("stays blocked until the last vote is allocated, then resolves", async () => {
    const store = makeStorage();
    const board = createBoard(store, { extractFn: extractImdbIds });
    await addAndHydrate(
      board,
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0222222/",
      fakeFetch({
        tt0118881: { primaryTitle: "Her", startYear: 2013, rating: { aggregateRating: 8 } },
        tt0222222: { primaryTitle: "Arrival", startYear: 2016, rating: { aggregateRating: 7.9 } },
      })
    );

    const votes = { budget: 5, byId: { tt0118881: 3, tt0222222: 1 } };
    const blocked = tallyResults(board.list(), votes.byId, votes.budget);
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("missing-votes");
    expect(blocked.remaining).toBe(1);

    votes.byId.tt0222222 = 2;
    const ready = tallyResults(board.list(), votes.byId, votes.budget);
    expect(ready.ok).toBe(true);
    expect(ready.total).toBe(5);
  });
});
