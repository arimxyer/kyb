import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const WORKER_NAME = "know-your-ballot";
const CANDIDATE_HOST_PREFIX = `candidate-${WORKER_NAME}.`;
const VERSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export function parseWorkerVersionOutput(contents) {
  const entries = contents
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const upload = entries.findLast((entry) => entry.type === "version-upload");

  if (!upload) {
    throw new Error("Wrangler output did not contain a version-upload record.");
  }

  if (upload.worker_name !== WORKER_NAME) {
    throw new Error(
      `Wrangler uploaded unexpected Worker "${upload.worker_name ?? ""}".`,
    );
  }

  if (
    typeof upload.version_id !== "string" ||
    !VERSION_ID_PATTERN.test(upload.version_id)
  ) {
    throw new Error("Wrangler returned an invalid Worker version ID.");
  }

  let previewUrl;
  try {
    previewUrl = new URL(upload.preview_alias_url);
  } catch {
    throw new Error("Wrangler did not return the candidate preview alias.");
  }

  if (
    previewUrl.protocol !== "https:" ||
    previewUrl.hostname.startsWith(CANDIDATE_HOST_PREFIX) === false ||
    previewUrl.hostname.endsWith(".workers.dev") === false ||
    previewUrl.pathname !== "/" ||
    previewUrl.search ||
    previewUrl.hash
  ) {
    throw new Error("Wrangler returned an unexpected candidate preview URL.");
  }

  return {
    previewUrl: previewUrl.origin,
    versionId: upload.version_id,
  };
}

export function exportWorkerVersion({
  env = process.env,
  read = readFileSync,
  append = appendFileSync,
} = {}) {
  if (!env.WRANGLER_OUTPUT_FILE_PATH) {
    throw new Error("WRANGLER_OUTPUT_FILE_PATH is unavailable.");
  }
  if (!env.GITHUB_OUTPUT) {
    throw new Error("GITHUB_OUTPUT is unavailable outside GitHub Actions.");
  }

  const result = parseWorkerVersionOutput(
    read(env.WRANGLER_OUTPUT_FILE_PATH, "utf8"),
  );
  append(
    env.GITHUB_OUTPUT,
    `version_id=${result.versionId}\npreview_url=${result.previewUrl}\n`,
    "utf8",
  );
  return result;
}

function run() {
  const result = exportWorkerVersion();
  process.stdout.write(
    `Captured Cloudflare candidate ${result.versionId.slice(0, 12)} at ${new URL(result.previewUrl).hostname}.\n`,
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
      `Worker version export failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
