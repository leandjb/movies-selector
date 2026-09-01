import "../../src/gists-list.js";

const { listUserGists, USERNAME_RE } = globalThis.GistsList;

function makeGist(id, description, fileNames, contentType = "text/plain") {
  const files = {};
  for (const name of fileNames) {
    files[name] = {
      filename: name,
      type: name.endsWith(".txt") ? contentType : "application/json",
      truncated: false,
    };
  }
  return { id, description, files, updated_at: "2024-01-01T00:00:00Z" };
}

function fakeFetch(response) {
  return async () => {
    if (typeof response === "string") {
      throw new Error(response);
    }
    return response;
  };
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

describe("USERNAME_RE", () => {
  it("accepts valid GitHub usernames", () => {
    expect(USERNAME_RE.test("octocat")).toBe(true);
    expect(USERNAME_RE.test("leandjb")).toBe(true);
    expect(USERNAME_RE.test("user-name")).toBe(true);
    expect(USERNAME_RE.test("a")).toBe(true);
    expect(USERNAME_RE.test("a1")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(USERNAME_RE.test("")).toBe(false);
    expect(USERNAME_RE.test("user name")).toBe(false);
    expect(USERNAME_RE.test("user@name")).toBe(false);
    expect(USERNAME_RE.test("a".repeat(40))).toBe(false);
    expect(USERNAME_RE.test("_user")).toBe(false);
  });
});

describe("listUserGists", () => {
  it("returns mapped gists with txt files", async () => {
    const gists = [
      makeGist("abc123def456", "My movies", ["movies.txt"]),
      makeGist("789abc012def", "other", ["code.js"]),
    ];
    const result = await listUserGists("octocat", fakeFetch(jsonResponse(gists)));
    expect(result).toEqual([
      { id: "abc123def456", title: "My movies", date: "2024-01-01T00:00:00Z" },
    ]);
  });

  it("uses filename as title when description is empty", async () => {
    const gists = [makeGist("abc123def456", "", ["list.txt"])];
    const result = await listUserGists("octocat", fakeFetch(jsonResponse(gists)));
    expect(result[0].title).toBe("list.txt");
  });

  it("filters out gists without txt files", async () => {
    const gists = [
      makeGist("abc123def456", "nope", ["code.js"]),
      makeGist("def789abc012", "nope2", ["readme.md"]),
    ];
    await expect(
      listUserGists("octocat", fakeFetch(jsonResponse(gists)))
    ).rejects.toMatchObject({ code: "no-importable-gist" });
  });

  it("rejects invalid username", async () => {
    await expect(listUserGists("")).rejects.toMatchObject({ code: "bad-user" });
    await expect(listUserGists("user name")).rejects.toMatchObject({ code: "bad-user" });
  });

  it("throws network on fetch failure", async () => {
    await expect(
      listUserGists("octocat", fakeFetch("network error"))
    ).rejects.toMatchObject({ code: "network" });
  });

  it("throws rate-limited on 403", async () => {
    await expect(
      listUserGists("octocat", fakeFetch(jsonResponse({}, 403)))
    ).rejects.toMatchObject({ code: "rate-limited" });
  });

  it("throws bad-user on 404", async () => {
    await expect(
      listUserGists("octocat", fakeFetch(jsonResponse({}, 404)))
    ).rejects.toMatchObject({ code: "bad-user" });
  });

  it("throws bad-user when user has no public gists", async () => {
    await expect(
      listUserGists("octocat", fakeFetch(jsonResponse([])))
    ).rejects.toMatchObject({ code: "no-importable-gist" });
  });

  it("throws no-importable-gist when all gists lack txt files", async () => {
    const gists = [makeGist("abc123def456", "code only", ["app.js"])];
    await expect(
      listUserGists("octocat", fakeFetch(jsonResponse(gists)))
    ).rejects.toMatchObject({ code: "no-importable-gist" });
  });

  it("throws network on invalid JSON response", async () => {
    await expect(
      listUserGists("octocat", fakeFetch({ ok: true, status: 200, json: async () => { throw new Error("bad json"); } }))
    ).rejects.toMatchObject({ code: "network" });
  });
});
