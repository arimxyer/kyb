import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  resolveConvexUrl,
  validateConvexTarget,
} from "./convex-target-guard.mjs";

const resetConfirmation = "RESET_LOCAL_PROTOTYPE";
const maxResetBatches = 10_000;

function invokeConvex(
  functionName,
  args,
  { cwd = process.cwd(), env = process.env } = {},
) {
  const result = spawnSync(
    "bunx",
    [
      "convex",
      "run",
      functionName,
      JSON.stringify(args),
      "--deployment",
      "local",
    ],
    {
      cwd,
      encoding: "utf8",
      env,
    },
  );

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `Convex ${functionName} failed: ${result.stderr.trim() || "unknown error"}`,
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Convex ${functionName} returned malformed JSON: ${result.stdout.trim()}`,
    );
  }
}

export function resetLocalFixtures({
  cwd = process.cwd(),
  env = process.env,
  invoke = invokeConvex,
} = {}) {
  validateConvexTarget({
    mode: "local",
    convexUrl: resolveConvexUrl({ cwd, env }),
    env,
  });

  const localConvexEnv = {
    ...env,
    CONVEX_AGENT_MODE: "anonymous",
  };

  let documentsDeleted = 0;
  let batches = 0;

  while (batches < maxResetBatches) {
    const result = invoke(
      "seed:resetPrototypeBatch",
      { confirmation: resetConfirmation },
      { cwd, env: localConvexEnv },
    );

    if (
      result?.status !== "reset-batch" ||
      typeof result.deleted !== "number" ||
      typeof result.done !== "boolean"
    ) {
      throw new Error("Convex reset returned an unexpected result.");
    }

    documentsDeleted += result.deleted;
    batches += 1;

    if (result.done) {
      const seed = invoke("seed:prototype", {}, { cwd, env: localConvexEnv });

      if (seed?.status !== "seeded") {
        throw new Error("Convex seed did not create a fresh prototype dataset.");
      }

      return {
        status: "ready",
        documentsDeleted,
        batches,
        seed,
      };
    }
  }

  throw new Error(
    `Convex reset exceeded the safety limit of ${maxResetBatches} batches.`,
  );
}

function run() {
  const result = resetLocalFixtures();
  process.stdout.write(
    `Local Convex fixtures ready: deleted ${result.documentsDeleted} documents and seeded ${result.seed.elections} election.\n`,
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
      `Local Convex fixture reset failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
