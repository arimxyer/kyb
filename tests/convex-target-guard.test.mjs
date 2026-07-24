import assert from "node:assert/strict";
import { test } from "node:test";

import {
  INTEGRATION_CONVEX_URL,
  PRODUCTION_CONVEX_URL,
  isLocalConvexUrl,
  isPreviewConvexUrl,
  validateConvexTarget,
} from "../scripts/convex-target-guard.mjs";

test("recognizes only loopback HTTP URLs as local Convex", () => {
  assert.equal(isLocalConvexUrl("http://127.0.0.1:3210"), true);
  assert.equal(isLocalConvexUrl("http://localhost:3210"), true);
  assert.equal(isLocalConvexUrl("https://localhost:3210"), false);
  assert.equal(isLocalConvexUrl(INTEGRATION_CONVEX_URL), false);
});

test("recognizes only unknown HTTPS convex.cloud targets as previews", () => {
  assert.equal(
    isPreviewConvexUrl("https://feature-preview-123.convex.cloud"),
    true,
  );
  assert.equal(isPreviewConvexUrl(INTEGRATION_CONVEX_URL), false);
  assert.equal(isPreviewConvexUrl(PRODUCTION_CONVEX_URL), false);
  assert.equal(
    isPreviewConvexUrl("http://feature-preview-123.convex.cloud"),
    false,
  );
  assert.equal(isPreviewConvexUrl("https://convex.cloud.evil.example"), false);
});

test("accepts the configured local and integration lanes", () => {
  assert.deepEqual(
    validateConvexTarget({
      mode: "local",
      convexUrl: "http://127.0.0.1:3210",
    }),
    { lane: "local" },
  );
  assert.deepEqual(
    validateConvexTarget({
      mode: "integration",
      convexUrl: INTEGRATION_CONVEX_URL,
    }),
    { lane: "integration" },
  );
});

test("rejects production from every non-production command", () => {
  for (const mode of ["local", "integration", "non-production"]) {
    assert.throws(
      () => validateConvexTarget({ mode, convexUrl: PRODUCTION_CONVEX_URL }),
      /Refusing to use the production Convex deployment/u,
    );
  }
});

test("requires the protected GitHub Actions release context for production", () => {
  assert.throws(
    () =>
      validateConvexTarget({
        mode: "production-ci",
        convexUrl: PRODUCTION_CONVEX_URL,
        env: {},
      }),
    /restricted to the protected GitHub Actions release job/u,
  );

  assert.deepEqual(
    validateConvexTarget({
      mode: "production-ci",
      convexUrl: PRODUCTION_CONVEX_URL,
      env: {
        CI: "true",
        GITHUB_ACTIONS: "true",
        KYB_ALLOW_PRODUCTION_DEPLOY: "1",
      },
    }),
    { lane: "production" },
  );
});

test("requires the GitHub Actions preview context for preview builds", () => {
  const convexUrl = "https://feature-preview-123.convex.cloud";

  assert.throws(
    () =>
      validateConvexTarget({
        mode: "preview-ci",
        convexUrl,
        env: {},
      }),
    /restricted to the GitHub Actions preview job/u,
  );

  assert.deepEqual(
    validateConvexTarget({
      mode: "preview-ci",
      convexUrl,
      env: {
        CI: "true",
        GITHUB_ACTIONS: "true",
        KYB_ALLOW_PREVIEW_BUILD: "1",
      },
    }),
    { lane: "preview" },
  );
});
