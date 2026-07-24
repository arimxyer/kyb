import assert from "node:assert/strict";
import { test } from "node:test";

import {
  exportWorkerVersion,
  parseWorkerVersionOutput,
} from "../scripts/export-worker-version.mjs";

const versionId = "12345678-1234-4abc-8def-1234567890ab";
const previewUrl =
  "https://candidate-know-your-ballot.example.workers.dev";
const output = [
  JSON.stringify({
    type: "wrangler-session",
    version: 1,
  }),
  JSON.stringify({
    preview_alias_url: previewUrl,
    type: "version-upload",
    version_id: versionId,
    worker_name: "know-your-ballot",
  }),
  "",
].join("\n");

test("extracts the exact candidate version and preview alias", () => {
  assert.deepEqual(parseWorkerVersionOutput(output), {
    previewUrl,
    versionId,
  });
});

test("exports candidate details to GitHub Actions", () => {
  const writes = [];
  const result = exportWorkerVersion({
    env: {
      GITHUB_OUTPUT: "/tmp/github-output",
      WRANGLER_OUTPUT_FILE_PATH: "/tmp/wrangler-output.ndjson",
    },
    read() {
      return output;
    },
    append(...args) {
      writes.push(args);
    },
  });

  assert.deepEqual(result, { previewUrl, versionId });
  assert.deepEqual(writes, [
    [
      "/tmp/github-output",
      `version_id=${versionId}\npreview_url=${previewUrl}\n`,
      "utf8",
    ],
  ]);
});

test("rejects output for another Worker", () => {
  assert.throws(
    () =>
      parseWorkerVersionOutput(
        output.replace('"know-your-ballot"', '"other-worker"'),
      ),
    /unexpected Worker/u,
  );
});

test("rejects a non-Cloudflare candidate URL", () => {
  assert.throws(
    () =>
      parseWorkerVersionOutput(
        output.replace(previewUrl, "https://candidate.example.com"),
      ),
    /unexpected candidate preview URL/u,
  );
});

test("rejects output without a version-upload record", () => {
  assert.throws(
    () =>
      parseWorkerVersionOutput(
        `${JSON.stringify({ type: "wrangler-session" })}\n`,
      ),
    /did not contain a version-upload record/u,
  );
});
