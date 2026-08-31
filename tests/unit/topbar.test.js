import "../../src/topbar.js";

const { missingVotes, pill, countChip, view } = globalThis.Topbar;

describe("missingVotes", () => {
  it("counts the unallocated part of the budget", () => {
    expect(missingVotes({ budget: 10, allocated: 0 })).toBe(10);
    expect(missingVotes({ budget: 10, allocated: 4 })).toBe(6);
    expect(missingVotes({ budget: 10, allocated: 10 })).toBe(0);
  });

  it("never reports a negative count when overallocated", () => {
    expect(missingVotes({ budget: 3, allocated: 9 })).toBe(0);
  });

  it("treats a missing or nonsensical budget as no requirement", () => {
    expect(missingVotes({ budget: null, allocated: 0 })).toBe(0);
    expect(missingVotes({ budget: undefined, allocated: 5 })).toBe(0);
    expect(missingVotes({ budget: "ten", allocated: 0 })).toBe(0);
  });

  it("treats a missing or nonsensical allocation as zero", () => {
    expect(missingVotes({ budget: 10, allocated: null })).toBe(10);
    expect(missingVotes({ budget: 10, allocated: "lots" })).toBe(10);
  });
});

describe("pill", () => {
  it("reports the missing count while votes are unallocated", () => {
    expect(pill({ budget: 10, allocated: 7 })).toMatchObject({
      state: "missing",
      count: 3,
    });
  });

  it("switches to a ready state when the budget is fully allocated", () => {
    expect(pill({ budget: 10, allocated: 10 })).toMatchObject({ state: "ready" });
    expect(pill({ budget: 10, allocated: 12 }).state).toBe("ready");
  });

  it("labels the missing count with the right plural", () => {
    expect(pill({ budget: 10, allocated: 9 }).label).toBe("1 vote missing");
    expect(pill({ budget: 10, allocated: 7 }).label).toBe("3 votes missing");
  });

  it("labels the ready state", () => {
    expect(pill({ budget: 10, allocated: 10 }).label).toBe("All votes cast");
  });

  it("carries an aria label for assistive tech", () => {
    const p = pill({ budget: 10, allocated: 7 });
    expect(p.ariaLabel).toMatch(/3 votes missing/);
  });
});

describe("countChip", () => {
  it("shows the board size against the limit", () => {
    expect(countChip({ count: 0, limit: 9 })).toBe("0 / 9");
    expect(countChip({ count: 6, limit: 9 })).toBe("6 / 9");
    expect(countChip({ count: 9, limit: 9 })).toBe("9 / 9");
  });

  it("defaults the limit to the board's maximum", () => {
    expect(countChip({ count: 4 })).toBe("4 / 9");
  });

  it("clamps a nonsensical count to zero", () => {
    expect(countChip({ count: -2 })).toBe("0 / 9");
    expect(countChip({ count: "many" })).toBe("0 / 9");
  });
});

describe("view", () => {
  it("assembles the whole navbar view-model", () => {
    expect(
      view({ budget: 10, allocated: 6, count: 3, limit: 9 })
    ).toEqual({
      pill: pill({ budget: 10, allocated: 6 }),
      chip: "3 / 9",
      revealDisabled: false,
    });
  });

  it("disables the reveal control on an empty board", () => {
    expect(view({ budget: 10, allocated: 10, count: 0 }).revealDisabled).toBe(true);
  });

  it("keeps the reveal control enabled while votes are missing", () => {
    // The reveal is blocked on click with a toast; it is not disabled.
    expect(view({ budget: 10, allocated: 2, count: 3 }).revealDisabled).toBe(false);
  });
});
