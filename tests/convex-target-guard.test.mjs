import assert from "node:assert/strict";
import { test } from "node:test";

import {
  INTEGRATION_CONVEX_URL,
  PRODUCTION_CONVEX_URL,
  isLocalConvexUrl,
  validateConvexTarget,
} from "../scripts/convex-target-guard.mjs";

test("recognizes only loopback HTTP URLs as local Convex", () => {
  assert.equal(isLocalConvexUrl("http://127.0.0.1:3210"), true);
  assert.equal(isLocalConvexUrl("http://localhost:3210"), true);
  assert.equal(isLocalConvexUrl("https://localhost:3210"), false);
  assert.equal(isLocalConvexUrl(INTEGRATION_CONVEX_URL), false);
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
