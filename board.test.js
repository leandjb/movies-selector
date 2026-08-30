import "./imdb.js";
import "./board.js";

const { createBoard } = globalThis.Board;
const extract = globalThis.Imdb.extractImdbIds;

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _has: (k) => m.has(k),
    _map: m,
  };
}

const LINKS = (n) =>
  Array.from({ length: n }, (_, i) => `https://www.imdb.com/title/tt${String(i + 1).padStart(7, "0")}/`).join("\n");

describe("board.addFromText", () => {
  it("adds one card per valid link and reports zero invalid", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    const s = b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(s.addedIds).toEqual(["tt0118881"]);
    expect(s.invalid).toBe(0);
    expect(s.duplicates).toBe(0);
    expect(b.count()).toBe(1);
  });

  it("reports an invalid paste", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    const s = b.addFromText("this is not a link");
    expect(s.addedIds).toEqual([]);
    expect(s.invalid).toBe(1);
    expect(b.count()).toBe(0);
  });

  it("dedupes duplicates within input and against the board", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    const s1 = b.addFromText(
      "https://www.imdb.com/title/tt0118881/ https://www.imdb.com/title/tt0118881/"
    );
    expect(s1.addedIds).toEqual(["tt0118881"]);
    expect(s1.duplicates).toBe(1); // second occurrence on the board
    const s2 = b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(s2.duplicates).toBe(1); // already on the board
    expect(b.count()).toBe(1);
  });

  it("caps the board at 9 and reports skipped", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    const s = b.addFromText(LINKS(12));
    expect(b.count()).toBe(9);
    expect(s.addedIds.length).toBe(9);
    expect(s.skipped).toBe(3);
    expect(b.isFull()).toBe(true);
  });

  it("rejects additions when full", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText(LINKS(9));
    const s = b.addFromText("https://www.imdb.com/title/tt9999999/");
    expect(s.addedIds).toEqual([]);
    expect(s.skipped).toBe(1);
    expect(b.count()).toBe(9);
  });

  it("counts junk lines as invalid in a file import", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    const s = b.addFromText(
      "https://www.imdb.com/title/tt0118881/\ngarbage line\nhttps://www.imdb.com/title/tt0222222/"
    );
    expect(s.addedIds).toEqual(["tt0118881", "tt0222222"]);
    expect(s.invalid).toBe(1);
  });
});

describe("board persistence and clear", () => {
  it("round-trips through storage", () => {
    const store = makeStorage();
    const b1 = createBoard(store, { extractFn: extract });
    b1.addFromText("https://www.imdb.com/title/tt0118881/");
    b1.hydrate("tt0118881", {
      id: "tt0118881",
      title: "Her",
      year: 2013,
      rating: 8.0,
      posterUrl: "https://img/x.jpg",
    });
    const b2 = createBoard(store, { extractFn: extract });
    b2.load();
    expect(b2.count()).toBe(1);
    expect(b2.list()[0].title).toBe("Her");
    expect(b2.list()[0].status).toBe("ready");
  });

  it("clears the board and removes the storage key", () => {
    const store = makeStorage();
    const b = createBoard(store, { extractFn: extract });
    b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(store._has("shortlistBoard.v1")).toBe(true);
    b.clear();
    expect(b.count()).toBe(0);
    expect(store._has("shortlistBoard.v1")).toBe(false);
  });

  it("marks a movie error when hydration fails", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(b.list()[0].status).toBe("loading");
    b.hydrate("tt0118881", null);
    expect(b.list()[0].status).toBe("error");
  });
});

describe("board.remove", () => {
  it("removes only the targeted movie and persists", () => {
    const store = makeStorage();
    const b = createBoard(store, { extractFn: extract });
    b.addFromText(LINKS(3));
    expect(b.remove("tt0000002")).toBe(true);
    expect(b.count()).toBe(2);
    expect(b.hasId("tt0000002")).toBe(false);
    expect(store._has("shortlistBoard.v1")).toBe(true);
    const b2 = createBoard(store, { extractFn: extract });
    b2.load();
    expect(b2.count()).toBe(2);
    expect(b2.hasId("tt0000002")).toBe(false);
    expect(b2.hasId("tt0000001")).toBe(true);
  });

  it("is a no-op for an unknown id and returns false", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText(LINKS(2));
    expect(b.remove("tt9999999")).toBe(false);
    expect(b.count()).toBe(2);
  });

  it("lets a removed movie be re-added (not a duplicate)", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(b.remove("tt0118881")).toBe(true);
    const s = b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(s.addedIds).toEqual(["tt0118881"]);
    expect(s.duplicates).toBe(0);
    expect(b.count()).toBe(1);
  });

  it("never resurrects a removed movie on hydrate", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(b.remove("tt0118881")).toBe(true);
    expect(b.hydrate("tt0118881", { title: "Her" })).toBe(false);
    expect(b.count()).toBe(0);
    expect(b.hasId("tt0118881")).toBe(false);
  });

  it("leaves an empty board when the last movie is removed", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText("https://www.imdb.com/title/tt0118881/");
    expect(b.remove("tt0118881")).toBe(true);
    expect(b.count()).toBe(0);
  });
});

describe("board insertion order", () => {
  // The app renders cards in board.list() order and votes live outside the
  // board, so this order is the stable display order — it must never shift.
  it("keeps list() in insertion order through add, hydrate, and remove", () => {
    const b = createBoard(makeStorage(), { extractFn: extract });
    b.addFromText(LINKS(3));
    expect(b.list().map((m) => m.id)).toEqual([
      "tt0000001",
      "tt0000002",
      "tt0000003",
    ]);
    b.hydrate("tt0000002", { title: "Middle" });
    expect(b.list().map((m) => m.id)).toEqual([
      "tt0000001",
      "tt0000002",
      "tt0000003",
    ]);
    b.remove("tt0000001");
    expect(b.list().map((m) => m.id)).toEqual(["tt0000002", "tt0000003"]);
    b.addFromText("https://www.imdb.com/title/tt0000004/");
    expect(b.list().map((m) => m.id)).toEqual([
      "tt0000002",
      "tt0000003",
      "tt0000004",
    ]);
  });
});
