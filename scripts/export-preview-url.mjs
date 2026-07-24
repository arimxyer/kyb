import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  resolveConvexUrl,
  validateConvexTarget,
} from "./convex-target-guard.mjs";

export function exportPreviewUrl({
  cwd = process.cwd(),
  env = process.env,
  append = appendFileSync,
} = {}) {
  const convexUrl = resolveConvexUrl({ cwd, env });
  validateConvexTarget({
    mode: "preview-ci",
    convexUrl,
    env,
  });

  if (!env.GITHUB_ENV) {
    throw new Error("GITHUB_ENV is unavailable outside GitHub Actions.");
  }

  append(env.GITHUB_ENV, `NEXT_PUBLIC_CONVEX_URL=${convexUrl}\n`, "utf8");
  return convexUrl;
}

function run() {
  const convexUrl = exportPreviewUrl();
  process.stdout.write(
    `Captured Convex preview URL for post-deploy verification: ${new URL(convexUrl).hostname}\n`,
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
      `Preview URL export failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
