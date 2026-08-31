import "../../src/queue.js";
import { jest } from "@jest/globals";

const { createQueue } = globalThis.Queue;

// A worker whose completion the test controls: it starts immediately and
// resolves only when the test releases it, so slot occupancy is observable.
function controlledWorker() {
  const jobs = [];
  const worker = (task) => {
    let release;
    const done = new Promise((resolve) => {
      release = resolve;
    });
    jobs.push({ task, release });
    return done;
  };
  return { worker, jobs };
}

// A delayed worker: resolves with its task after `ms` of fake time.
function timedWorker(ms) {
  return (task) => new Promise((resolve) => setTimeout(() => resolve(task), ms));
}

describe("createQueue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs tasks up to the concurrency bound, never more", async () => {
    const { worker, jobs } = controlledWorker();
    const q = createQueue({ worker, concurrency: 3, gap: 0, jitter: 0 });
    for (const id of ["a", "b", "c", "d", "e"]) q.enqueue(id);

    // Nothing has started yet: the per-slot start gap has not elapsed.
    expect(jobs).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(0);
    expect(jobs.map((j) => j.task)).toEqual(["a", "b", "c"]);

    // Finish one — the next task takes the freed slot, still <= 3 in flight.
    jobs[0].release("ok-a");
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(0);
    expect(jobs.map((j) => j.task)).toEqual(["a", "b", "c", "d"]);
    expect(q.inFlight()).toBeLessThanOrEqual(3);
  });

  it("reports in-flight and queued counts", async () => {
    const { worker, jobs } = controlledWorker();
    const q = createQueue({ worker, concurrency: 2, gap: 0, jitter: 0 });
    q.enqueue("a");
    q.enqueue("b");
    q.enqueue("c");
    await jest.advanceTimersByTimeAsync(0);
    expect(q.inFlight()).toBe(2);
    expect(q.pending()).toBe(1);
    jobs[0].release(1);
    await jest.advanceTimersByTimeAsync(0);
    expect(q.inFlight()).toBe(2);
    expect(q.pending()).toBe(0);
  });

  it("staggers slot starts by the configured gap", async () => {
    const started = [];
    const worker = (task) => {
      started.push({ task, at: Date.now() });
      return Promise.resolve(task);
    };
    const q = createQueue({ worker, concurrency: 2, gap: 200, jitter: 0 });
    q.enqueue("a");
    q.enqueue("b");
    q.enqueue("c");
    await jest.advanceTimersByTimeAsync(1000);
    expect(started).toHaveLength(3);
    expect(started[1].at - started[0].at).toBeGreaterThan(0);
  });

  it("enqueued tasks settle in FIFO order", async () => {
    const q = createQueue({ worker: timedWorker(50), concurrency: 3, gap: 0, jitter: 0 });
    const results = ["a", "b", "c", "d", "e"].map((id) => q.enqueue(id));
    await jest.advanceTimersByTimeAsync(1000);
    await expect(Promise.all(results)).resolves.toEqual(["a", "b", "c", "d", "e"]);
  });

  it("isolates failures: a rejected task does not stall or fail its siblings", async () => {
    const worker = (task) =>
      task === "bad" ? Promise.reject(new Error("boom")) : Promise.resolve(task);
    const q = createQueue({ worker, concurrency: 2, gap: 0, jitter: 0 });
    const bad = q.enqueue("bad", "bad");
    const good = q.enqueue("good", "good");
    // Attach assertions before advancing, so the rejection is never unhandled.
    const badAssertion = expect(bad).rejects.toThrow("boom");
    const goodAssertion = expect(good).resolves.toBe("good");
    await jest.advanceTimersByTimeAsync(1000);
    await badAssertion;
    await goodAssertion;
    expect(q.pending()).toBe(0);
  });

  it("deduplicates concurrent tasks with the same key to one worker call", async () => {
    const calls = [];
    const { worker, jobs } = controlledWorker();
    const tracking = (task) => {
      calls.push(task);
      return worker(task);
    };
    const q = createQueue({ worker: tracking, concurrency: 3, gap: 0, jitter: 0 });
    const first = q.enqueue("tt1", "tt1");
    const second = q.enqueue("tt1", "tt1");
    await jest.advanceTimersByTimeAsync(0);
    expect(calls).toEqual(["tt1"]);
    jobs[0].release("detail");
    await jest.advanceTimersByTimeAsync(0);
    await expect(Promise.all([first, second])).resolves.toEqual(["detail", "detail"]);
  });

  it("serves a repeat key from the cache without calling the worker again", async () => {
    const calls = [];
    const worker = (task) => {
      calls.push(task);
      return Promise.resolve("detail:" + task);
    };
    const q = createQueue({ worker, concurrency: 2, gap: 0, jitter: 0 });
    const first = q.enqueue("tt1", "tt1");
    await jest.advanceTimersByTimeAsync(1000);
    await expect(first).resolves.toBe("detail:tt1");

    const again = q.enqueue("tt1", "tt1");
    await jest.advanceTimersByTimeAsync(1000);
    await expect(again).resolves.toBe("detail:tt1");
    expect(calls).toEqual(["tt1"]);
  });

  it("does not cache failures, so a retry re-runs the worker", async () => {
    let attempts = 0;
    const worker = () => {
      attempts += 1;
      return attempts === 1
        ? Promise.reject(new Error("nope"))
        : Promise.resolve("ok");
    };
    const q = createQueue({ worker, concurrency: 1, gap: 0, jitter: 0 });
    const first = q.enqueue("tt2", "tt2");
    const assertion = expect(first).rejects.toThrow("nope");
    await jest.advanceTimersByTimeAsync(1000);
    await assertion;

    const retry = q.enqueue("tt2", "tt2");
    await jest.advanceTimersByTimeAsync(1000);
    await expect(retry).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });

  it("drops a queued task that is cancelled before it starts", async () => {
    const { worker, jobs } = controlledWorker();
    const q = createQueue({ worker, concurrency: 1, gap: 0, jitter: 0 });
    q.enqueue("a", "a");
    const cancelled = q.enqueue("b", "b");
    const assertion = expect(cancelled).rejects.toThrow(/cancel/i);
    await jest.advanceTimersByTimeAsync(0);
    q.cancel("b");
    jobs[0].release("ok");
    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(jobs.map((j) => j.task)).toEqual(["a"]);
  });

  it("exposes a default concurrency greater than one", () => {
    const q = createQueue({ worker: () => Promise.resolve(1) });
    expect(q.concurrency).toBeGreaterThan(1);
  });
});
