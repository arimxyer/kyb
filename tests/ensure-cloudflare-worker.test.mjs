import assert from "node:assert/strict";
import { test } from "node:test";

import { ensureCloudflareWorker } from "../scripts/ensure-cloudflare-worker.mjs";

test("skips bootstrap when the Cloudflare Worker exists", () => {
  const calls = [];
  const result = ensureCloudflareWorker({
    run(args, options) {
      calls.push([args, options]);
      return { status: 0, stderr: "", stdout: "[]" };
    },
  });

  assert.deepEqual(result, { bootstrapped: false });
  assert.equal(calls.length, 1);
});

test("creates a maintenance Worker only for Cloudflare missing-worker code 10007", () => {
  const calls = [];
  const results = [
    {
      status: 1,
      stderr: "Worker not found [code: 10007]",
      stdout: "",
    },
    { status: 0, stderr: "", stdout: "" },
  ];

  const result = ensureCloudflareWorker({
    run(args, options) {
      calls.push([args, options]);
      return results.shift();
    },
  });

  assert.deepEqual(result, { bootstrapped: true });
  assert.deepEqual(calls[1], [
    [
      "deploy",
      "--config",
      "wrangler.bootstrap.jsonc",
      "--keep-vars",
    ],
    undefined,
  ]);
});

test("does not bootstrap over an unrelated Cloudflare lookup failure", () => {
  assert.throws(
    () =>
      ensureCloudflareWorker({
        run() {
          return {
            status: 1,
            stderr: "Authentication failed",
            stdout: "",
          };
        },
      }),
    /Unable to inspect the existing Cloudflare Worker/u,
  );
});

test("reports a failed maintenance bootstrap", () => {
  const results = [
    {
      status: 1,
      stderr: "Worker not found [code: 10007]",
      stdout: "",
    },
    { status: 1, stderr: "", stdout: "" },
  ];

  assert.throws(
    () =>
      ensureCloudflareWorker({
        run() {
          return results.shift();
        },
      }),
    /maintenance bootstrap failed/u,
  );
});
