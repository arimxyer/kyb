import assert from "node:assert/strict";
import { test } from "node:test";

import { validateProductionReleaseContext } from "../scripts/production-release-guard.mjs";

const validEnvironment = {
  CI: "true",
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  CLOUDFLARE_API_TOKEN: "cloudflare-token",
  CONVEX_DEPLOY_KEY: "production-deploy-key",
  GITHUB_ACTIONS: "true",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: "a".repeat(40),
  KYB_ALLOW_PRODUCTION_DEPLOY: "1",
  KYB_PRODUCTION_ENVIRONMENT_PROTECTED: "1",
  KYB_PRODUCTION_RELEASE_ENABLED: "1",
  KYB_PRODUCTION_URL: "https://know-your-ballot.example.workers.dev",
  NEXT_PUBLIC_CONVEX_URL: "https://warmhearted-raccoon-48.convex.cloud",
  RELEASE_CONFIRMATION: "release production",
};

test("accepts a fully guarded production release context", () => {
  assert.deepEqual(
    validateProductionReleaseContext({ env: validEnvironment }),
    {
      commit: "a".repeat(40),
      convexUrl: "https://warmhearted-raccoon-48.convex.cloud",
      productionUrl: "https://know-your-ballot.example.workers.dev",
    },
  );
});

test("rejects a release without the production protection attestation", () => {
  assert.throws(
    () =>
      validateProductionReleaseContext({
        env: {
          ...validEnvironment,
          KYB_PRODUCTION_ENVIRONMENT_PROTECTED: "",
        },
      }),
    /must attest that the GitHub environment is protected/u,
  );
});

test("rejects a release from any ref other than main", () => {
  assert.throws(
    () =>
      validateProductionReleaseContext({
        env: {
          ...validEnvironment,
          GITHUB_REF: "refs/heads/feature",
        },
      }),
    /restricted to the main branch/u,
  );
});

test("rejects an unsafe production verification URL", () => {
  assert.throws(
    () =>
      validateProductionReleaseContext({
        env: {
          ...validEnvironment,
          KYB_PRODUCTION_URL: "http://localhost:8788/path",
        },
      }),
    /must be an HTTPS origin/u,
  );
});

test("rejects a release with missing environment credentials", () => {
  assert.throws(
    () =>
      validateProductionReleaseContext({
        env: {
          ...validEnvironment,
          CLOUDFLARE_API_TOKEN: "",
        },
      }),
    /CLOUDFLARE_API_TOKEN is missing/u,
  );
});
