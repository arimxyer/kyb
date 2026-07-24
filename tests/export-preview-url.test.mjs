import assert from "node:assert/strict";
import { test } from "node:test";

import { exportPreviewUrl } from "../scripts/export-preview-url.mjs";

const previewUrl = "https://feature-preview-123.convex.cloud";

test("exports only a guarded Convex preview URL to GitHub Actions", () => {
  const writes = [];
  const result = exportPreviewUrl({
    env: {
      CI: "true",
      GITHUB_ACTIONS: "true",
      GITHUB_ENV: "/tmp/github-env",
      KYB_ALLOW_PREVIEW_BUILD: "1",
      NEXT_PUBLIC_CONVEX_URL: previewUrl,
    },
    append(...args) {
      writes.push(args);
    },
  });

  assert.equal(result, previewUrl);
  assert.deepEqual(writes, [
    [
      "/tmp/github-env",
      `NEXT_PUBLIC_CONVEX_URL=${previewUrl}\n`,
      "utf8",
    ],
  ]);
});

test("does not write a preview URL without a GitHub environment file", () => {
  assert.throws(
    () =>
      exportPreviewUrl({
        env: {
          CI: "true",
          GITHUB_ACTIONS: "true",
          KYB_ALLOW_PREVIEW_BUILD: "1",
          NEXT_PUBLIC_CONVEX_URL: previewUrl,
        },
        append() {
          assert.fail("the environment file must not be written");
        },
      }),
    /GITHUB_ENV is unavailable/u,
  );
});
