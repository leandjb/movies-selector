## 1. Sequential provider chain in imdb.js

- [x] 1.1 Replace `raceProxies` with a `tryProxies` sequential fallback: iterate proxies in order, one request at a time, each wrapped in the existing 8–10 s timeout; advance on failure. Verify: `node --check imdb.js` passes.
- [x] 1.2 Add per-attempt retry with capped exponential backoff + jitter (per design D4: base 1.5 s, cap 6 s, max 2 retries per proxy) on 429, 408, 5xx, and rejected fetches, before advancing to the next proxy. Verify: unit test asserts a 429 then 200 on the same proxy URL succeeds with 2 calls.
- [x] 1.3 Reorder providers to suggestion-first (`fetchFromSuggestion` → `fetchFromImdbPage` → `fetchFromImdbapiDev`) and remove corsproxy.io from `PROXIES` (leaving allorigins, codetabs, test.cors.workers.dev). Verify: unit test asserts the suggestion URL is requested before any page URL.
- [x] 1.4 Update `imdb.test.js`: rewrite fake-fetch routing for sequential order, add retry/backoff tests (fake timers or injected delay), keep all existing normalization tests green. Verify: `node --experimental-vm-modules node_modules/jest/bin/jest.js` passes.

## 2. Shared hydration queue in app.js

- [x] 2.1 Add a module-scope FIFO queue helper with concurrency 1 and a 300–800 ms randomized gap between jobs (design D1). Verify: unit-testable pure helper or integration test asserting serialized fetch order with fake fetch.
- [x] 2.2 Route paste hydration (`handleAdd`), file-import hydration, and the boot retry loop over `needsHydration()` through the queue; guard each job with `board.hasId(id)` before applying results (design D6). Verify: integration test with 3 movies asserts fetches happen one at a time in file order.
- [x] 2.3 Keep card creation, summary reporting, cap enforcement, and persistence behavior unchanged. Verify: all existing `board.test.js` and `integration.test.js` tests pass unmodified (except fetch fakes).

## 3. Verification

- [x] 3.1 Full suite green and syntax clean: `node --check imdb.js app.js board.js && node --experimental-vm-modules node_modules/jest/bin/jest.js`. Verify: 0 failures.
- [x] 3.2 Manual check in the browser: import `movies_list.txt`, confirm cards fill in progressively over ~15–40 s with no 429 storm in the Network tab, and unresolved cards still show placeholders. Verify: observable behavior in DevTools.
- [x] 3.3 Run `openspec validate resilient-metadata-fetch --strict` and mark tasks complete. Verify: validation passes.
