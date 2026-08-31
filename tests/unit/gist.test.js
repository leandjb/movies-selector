import "../../src/gist.js";

const { parseGistRef, fetchGistText } = globalThis.Gist;

const ID = "f14aba6d67faf726ac12a5936ccd14a3";
const GIST_URL = `https://gist.github.com/leandjb/${ID}`;

const gistJson = (files) => ({
  ok: true,
  status: 200,
  json: async () => ({ files }),
});

describe("parseGistRef", () => {
  it("accepts a full gist URL with a user", () => {
    expect(parseGistRef(GIST_URL)).toBe(ID);
  });

  it("accepts a gist URL without a user", () => {
    expect(parseGistRef(`https://gist.github.com/${ID}`)).toBe(ID);
  });

  it("tolerates ?ref queries and trailing slashes", () => {
    expect(parseGistRef(`${GIST_URL}?ref=x`)).toBe(ID);
    expect(parseGistRef(`${GIST_URL}/`)).toBe(ID);
  });

  it("accepts a bare 32-hex id (any case)", () => {
    expect(parseGistRef(ID)).toBe(ID);
    expect(parseGistRef(ID.toUpperCase())).toBe(ID.toLowerCase());
  });

  it("returns null for empty, short, non-hex, or unrelated text", () => {
    expect(parseGistRef("")).toBeNull();
    expect(parseGistRef(null)).toBeNull();
    expect(parseGistRef("f14aba6d")).toBeNull();
    expect(parseGistRef("zzzzaba6d67faf726ac12a5936ccd14a3")).toBeNull();
    expect(parseGistRef("https://www.imdb.com/title/tt0118881/")).toBeNull();
  });
});

describe("fetchGistText", () => {
  const TXT_CONTENT =
    "https://www.imdb.com/title/tt0112573/\nhttps://www.imdb.com/title/tt0111161/\n";

  it("fetches the gist and returns the text file's name and content", async () => {
    const seen = [];
    const fake = async (url) => {
      seen.push(url);
      return gistJson({
        "imbd-list.txt": {
          filename: "imbd-list.txt",
          type: "text/plain",
          truncated: false,
          content: TXT_CONTENT,
        },
      });
    };
    const out = await fetchGistText(GIST_URL, fake);
    expect(seen).toEqual([`https://api.github.com/gists/${ID}`]);
    expect(out).toEqual({ name: "imbd-list.txt", content: TXT_CONTENT });
  });

  it("picks the first .txt/text/plain file and skips the rest", async () => {
    const fake = async () =>
      gistJson({
        "README.md": {
          filename: "README.md",
          type: "text/markdown",
          truncated: false,
          content: "not this one",
        },
        "list.txt": {
          filename: "list.txt",
          type: "text/plain",
          truncated: false,
          content: TXT_CONTENT,
        },
      });
    const out = await fetchGistText(ID, fake);
    expect(out.name).toBe("list.txt");
  });

  it("refetches the raw_url when the file is truncated", async () => {
    const calls = [];
    const fake = async (url) => {
      calls.push(url);
      if (calls.length === 1) {
        return gistJson({
          "big.txt": {
            filename: "big.txt",
            type: "text/plain",
            truncated: true,
            raw_url: `https://gist.githubusercontent.com/x/${ID}/raw`,
            content: "",
          },
        });
      }
      return { ok: true, status: 200, text: async () => TXT_CONTENT };
    };
    const out = await fetchGistText(ID, fake);
    expect(calls[1]).toBe(`https://gist.githubusercontent.com/x/${ID}/raw`);
    expect(out.content).toBe(TXT_CONTENT);
  });

  it("rejects with bad-ref for unparseable input without fetching", async () => {
    const fake = async () => {
      throw new Error("should not be called");
    };
    await expect(fetchGistText("not a gist", fake)).rejects.toMatchObject({
      code: "bad-ref",
    });
  });

  it("rejects with network when the request throws", async () => {
    const fake = async () => {
      throw new TypeError("offline");
    };
    await expect(fetchGistText(GIST_URL, fake)).rejects.toMatchObject({
      code: "network",
    });
  });

  it("rejects with not-found for a missing gist", async () => {
    const fake = async () => ({ ok: false, status: 404 });
    await expect(fetchGistText(ID, fake)).rejects.toMatchObject({
      code: "not-found",
    });
  });

  it("rejects with rate-limited on 403", async () => {
    const fake = async () => ({ ok: false, status: 403 });
    await expect(fetchGistText(ID, fake)).rejects.toMatchObject({
      code: "rate-limited",
    });
  });

  it("rejects with no-text-file when the gist has no text file", async () => {
    const fake = async () =>
      gistJson({
        "only.md": {
          filename: "only.md",
          type: "text/markdown",
          truncated: false,
          content: "# nope",
        },
      });
    await expect(fetchGistText(ID, fake)).rejects.toMatchObject({
      code: "no-text-file",
    });
  });

  it("rejects with network when the truncated fallback fails", async () => {
    const fake = async (url) => {
      if (url.startsWith("https://api.github.com")) {
        return gistJson({
          "big.txt": {
            filename: "big.txt",
            type: "text/plain",
            truncated: true,
            raw_url: "https://gist.githubusercontent.com/x/raw",
          },
        });
      }
      return { ok: false, status: 500 };
    };
    await expect(fetchGistText(ID, fake)).rejects.toMatchObject({
      code: "network",
    });
  });
});
