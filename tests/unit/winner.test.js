import "../../src/winner.js";

const { tallyResults } = globalThis.Winner;

const movies = (ids) =>
  ids.map((id) => ({ id, title: `Film ${id}`, year: 2000, posterUrl: `https://img/${id}.jpg` }));

describe("tallyResults", () => {
  it("returns exact percentages and a votes-descending summary when fully allocated", () => {
    const r = tallyResults(movies(["a", "b", "c"]), { a: 5, b: 3, c: 2 }, 10);
    expect(r.ok).toBe(true);
    expect(r.total).toBe(10);
    expect(r.winnerId).toBe("a");
    expect(r.rows.map((row) => [row.id, row.votes, row.pct])).toEqual([
      ["a", 5, 50],
      ["b", 3, 30],
      ["c", 2, 20],
    ]);
  });

  it("breaks ties in favor of the earliest-added movie", () => {
    const r = tallyResults(movies(["first", "second", "third"]), { first: 4, second: 4, third: 2 }, 10);
    expect(r.ok).toBe(true);
    expect(r.winnerId).toBe("first");
    expect(r.rows[0].id).toBe("first");
    expect(r.rows[1].id).toBe("second");
  });

  it("refuses to reveal while any budget is unallocated and reports the remainder", () => {
    const r = tallyResults(movies(["a", "b"]), { a: 3 }, 10);
    expect(r).toEqual({ ok: false, reason: "missing-votes", remaining: 7 });
  });

  it("refuses an empty board", () => {
    expect(tallyResults([], { a: 5 }, 10)).toEqual({
      ok: false,
      reason: "empty-board",
    });
  });

  it("includes zero-vote movies in the summary at 0%", () => {
    const r = tallyResults(movies(["a", "b", "c"]), { a: 10 }, 10);
    expect(r.ok).toBe(true);
    expect(r.rows.map((row) => [row.id, row.votes, row.pct])).toEqual([
      ["a", 10, 100],
      ["b", 0, 0],
      ["c", 0, 0],
    ]);
  });

  it("flips from blocked to ready exactly when the last vote is allocated", () => {
    const list = movies(["a", "b"]);
    const before = tallyResults(list, { a: 8, b: 1 }, 10);
    expect(before.ok).toBe(false);
    expect(before.remaining).toBe(1);
    const after = tallyResults(list, { a: 8, b: 2 }, 10);
    expect(after.ok).toBe(true);
    expect(after.winnerId).toBe("a");
  });

  it("ignores orphan votes for movies no longer on the board", () => {
    const r = tallyResults(movies(["a", "b"]), { a: 6, b: 4, gone: 5 }, 10);
    expect(r.ok).toBe(true);
    expect(r.total).toBe(10);
  });
});
