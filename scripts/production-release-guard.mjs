import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  resolveConvexUrl,
  validateConvexTarget,
} from "./convex-target-guard.mjs";

const REQUIRED_SECRET_NAMES = [
  "CONVEX_DEPLOY_KEY",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
];

function requireValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is missing from the production environment.`);
  }
  return value;
}

function validateProductionUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("KYB_PRODUCTION_URL must be a valid HTTPS URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "KYB_PRODUCTION_URL must be an HTTPS origin without credentials, a port, path, query, or fragment.",
    );
  }

  return url.origin;
}

export function validateProductionReleaseContext({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const convexUrl = resolveConvexUrl({ cwd, env });
  validateConvexTarget({
    mode: "production-ci",
    convexUrl,
    env,
  });

  if (env.GITHUB_REF !== "refs/heads/main") {
    throw new Error("Production releases are restricted to the main branch.");
  }

  if (!/^[0-9a-f]{40}$/u.test(env.GITHUB_SHA ?? "")) {
    throw new Error("GITHUB_SHA must identify an exact 40-character commit.");
  }

  if (env.RELEASE_CONFIRMATION !== "release production") {
    throw new Error(
      'The workflow confirmation must exactly match "release production".',
    );
  }

  if (env.KYB_PRODUCTION_RELEASE_ENABLED !== "1") {
    throw new Error(
      "KYB_PRODUCTION_RELEASE_ENABLED must be set after production protection is configured.",
    );
  }

  if (env.KYB_PRODUCTION_ENVIRONMENT_PROTECTED !== "1") {
    throw new Error(
      "KYB_PRODUCTION_ENVIRONMENT_PROTECTED must attest that the GitHub environment is protected.",
    );
  }

  for (const name of REQUIRED_SECRET_NAMES) {
    requireValue(env, name);
  }

  return {
    commit: env.GITHUB_SHA,
    convexUrl,
    productionUrl: validateProductionUrl(
      requireValue(env, "KYB_PRODUCTION_URL"),
    ),
  };
}

function run() {
  const result = validateProductionReleaseContext();
  process.stdout.write(
    `Production release guard accepted ${result.commit.slice(0, 12)} for ${new URL(result.productionUrl).hostname}.\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    run();
  } catch (error) {
    process.stderr.write(
      `Production release guard failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
