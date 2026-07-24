import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const WORKER_NAME = "know-your-ballot";
const MISSING_WORKER_CODE =
  /(?:\[code:\s*10007\]|"code"\s*:\s*10007)/u;

function runWrangler(args, { capture = false } = {}) {
  const result = spawnSync("bun", ["x", "wrangler", ...args], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) throw result.error;

  return {
    status: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

export function ensureCloudflareWorker({ run = runWrangler } = {}) {
  const lookup = run(
    ["deployments", "list", "--name", WORKER_NAME, "--json"],
    { capture: true },
  );

  if (lookup.status === 0) {
    return { bootstrapped: false };
  }

  const lookupOutput = `${lookup.stdout}\n${lookup.stderr}`;
  if (!MISSING_WORKER_CODE.test(lookupOutput)) {
    throw new Error(
      `Unable to inspect the existing Cloudflare Worker: ${lookup.stderr || lookup.stdout || `Wrangler exited ${lookup.status}`}`,
    );
  }

  const bootstrap = run([
    "deploy",
    "--config",
    "wrangler.bootstrap.jsonc",
    "--keep-vars",
  ]);

  if (bootstrap.status !== 0) {
    throw new Error(
      `Cloudflare maintenance bootstrap failed with exit code ${bootstrap.status}.`,
    );
  }

  return { bootstrapped: true };
}

function run() {
  const result = ensureCloudflareWorker();
  process.stdout.write(
    result.bootstrapped
      ? "Created the initial 503 maintenance Worker.\n"
      : "Cloudflare Worker already exists; bootstrap skipped.\n",
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
      `Cloudflare Worker bootstrap failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
