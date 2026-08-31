/*
 * queue.js — bounded-concurrency task queue with dedup + session cache (no DOM).
 *
 * Loaded as a classic <script> (attaches to window.Queue) and also by Jest
 * (ESM module with no exports; attaches to globalThis.Queue).
 *
 *   const q = createQueue({ worker, concurrency, gap, jitter });
 *   q.enqueue(task, key) -> Promise<result>
 *
 * The queue keeps at most `concurrency` workers in flight and paces slot
 * starts by `gap` (+ up to `jitter`) so a burst of tasks never becomes a
 * burst of simultaneous requests (see the metadata-fetch spec).
 *
 * Two tasks enqueued with the same `key` while one is still in flight share a
 * single worker call (in-flight dedup). A completed result is memoized under
 * its key for the lifetime of the instance (per-session cache), so a repeat
 * task costs no request. Failures are deliberately NOT cached — a retry must
 * be able to run the worker again.
 */
(function (root) {
  "use strict";

  const DEFAULT_CONCURRENCY = 3;
  const DEFAULT_GAP = 150; // ms between slot starts
  const DEFAULT_JITTER = 250; // ms of randomized spread on top of the gap

  function createQueue(opts) {
    const options = opts || {};
    const worker = options.worker;
    if (typeof worker !== "function") {
      throw new Error("createQueue requires a worker function");
    }
    const concurrency = Math.max(
      1,
      Number.isInteger(options.concurrency) ? options.concurrency : DEFAULT_CONCURRENCY
    );
    const gap = Number.isFinite(options.gap) ? options.gap : DEFAULT_GAP;
    const jitter = Number.isFinite(options.jitter) ? options.jitter : DEFAULT_JITTER;
    const sleep =
      options.sleep ||
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const random = options.random || Math.random;

    const waiting = []; // queued jobs, FIFO
    const inFlightByKey = new Map(); // key -> promise (dedup)
    const cache = new Map(); // key -> resolved value
    let active = 0;
    let seq = 0;
    let reserved = 0; // slots promised to a launch that has not fired yet
    let cursor = null; // timeline position of the last reserved launch

    // Reserve a launch slot per waiting job, up-front, spacing each launch
    // `gap` (+ jitter) after the previous one so parallel slots desync
    // instead of firing as one burst. The very first launch is immediate.
    function plan() {
      while (active + reserved < concurrency && waiting.length > 0) {
        const job = waiting.shift();
        reserved += 1;
        const now = Date.now();
        let delay = 0;
        if (cursor === null) {
          cursor = now;
        } else {
          const spread = jitter > 0 ? random() * jitter : 0;
          delay = Math.max(0, gap + spread - (now - cursor));
          cursor = now + delay;
        }
        sleep(delay).then(() => {
          reserved -= 1;
          start(job);
        });
      }
    }

    function start(job) {
      active += 1;
      const done = (err, value) => {
        active -= 1;
        if (job.key != null) inFlightByKey.delete(job.key);
        if (err) {
          job.reject(err);
        } else {
          if (job.key != null) cache.set(job.key, value);
          job.resolve(value);
        }
        plan();
      };
      Promise.resolve()
        .then(() => worker(job.task))
        .then((value) => done(null, value), (err) => done(err || new Error("task failed")));
    }

    function enqueue(task, key) {
      const dedupeKey = key == null ? null : String(key);
      if (dedupeKey != null) {
        if (cache.has(dedupeKey)) return Promise.resolve(cache.get(dedupeKey));
        const running = inFlightByKey.get(dedupeKey);
        if (running) return running;
      }

      const job = { task, key: dedupeKey, seq: seq++ };
      const promise = new Promise((resolve, reject) => {
        job.resolve = resolve;
        job.reject = reject;
      });
      job.promise = promise;
      if (dedupeKey != null) inFlightByKey.set(dedupeKey, promise);
      waiting.push(job);
      plan();
      return promise;
    }

    // Drop a job that has not started yet; its promise rejects so callers can
    // distinguish "never happened" from "happened and failed".
    function cancel(key) {
      if (key == null) return false;
      const k = String(key);
      const idx = waiting.findIndex((j) => j.key === k);
      if (idx === -1) return false;
      const [job] = waiting.splice(idx, 1);
      inFlightByKey.delete(k);
      job.reject(new Error("Task cancelled before it started: " + k));
      return true;
    }

    return {
      enqueue,
      cancel,
      inFlight: () => active,
      pending: () => waiting.length,
      has: (key) => cache.has(String(key)),
      clearCache: () => cache.clear(),
      get concurrency() {
        return concurrency;
      },
    };
  }

  const api = { createQueue, DEFAULT_CONCURRENCY };
  root.Queue = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
