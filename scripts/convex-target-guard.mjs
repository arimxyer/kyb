import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const INTEGRATION_CONVEX_URL =
  "https://sleek-snail-205.convex.cloud";
export const PRODUCTION_CONVEX_URL =
  "https://warmhearted-raccoon-48.convex.cloud";

const SUPPORTED_MODES = new Set([
  "local",
  "integration",
  "non-production",
  "preview-ci",
  "production-ci",
]);

function unquote(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readEnvFileValue(filePath, key) {
  try {
    const contents = readFileSync(filePath, "utf8");

    for (const rawLine of contents.split(/\r?\n/u)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separator = line.indexOf("=");
      if (separator === -1 || line.slice(0, separator).trim() !== key) continue;

      return unquote(line.slice(separator + 1).trim());
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  return undefined;
}

export function resolveConvexUrl({
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  return (
    env.NEXT_PUBLIC_CONVEX_URL ||
    readEnvFileValue(resolve(cwd, ".env.local"), "NEXT_PUBLIC_CONVEX_URL") ||
    readEnvFileValue(resolve(cwd, ".env"), "NEXT_PUBLIC_CONVEX_URL") ||
    ""
  );
}

export function isLocalConvexUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

export function isPreviewConvexUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.port === "" &&
      url.hostname.endsWith(".convex.cloud") &&
      value !== INTEGRATION_CONVEX_URL &&
      value !== PRODUCTION_CONVEX_URL
    );
  } catch {
    return false;
  }
}

export function validateConvexTarget({
  mode,
  convexUrl,
  env = process.env,
}) {
  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(
      `Unknown Convex target mode "${mode}". Expected ${[
        ...SUPPORTED_MODES,
      ].join(", ")}.`,
    );
  }

  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is unset. Select a Convex deployment before starting the frontend.",
    );
  }

  if (mode !== "production-ci" && convexUrl === PRODUCTION_CONVEX_URL) {
    throw new Error(
      "Refusing to use the production Convex deployment outside the protected production command.",
    );
  }

  const isLocal = isLocalConvexUrl(convexUrl);
  const isIntegration = convexUrl === INTEGRATION_CONVEX_URL;
  const isPreview = isPreviewConvexUrl(convexUrl);

  if (mode === "local" && !isLocal) {
    throw new Error(
      "The local lane requires a local Convex URL on localhost or 127.0.0.1.",
    );
  }

  if (mode === "integration" && !isIntegration) {
    throw new Error(
      "The integration lane requires the configured sleek-snail-205 Convex deployment.",
    );
  }

  if (mode === "non-production" && !isLocal && !isIntegration) {
    throw new Error(
      "The non-production lane accepts only local Convex or the configured integration deployment.",
    );
  }

  if (mode === "preview-ci") {
    if (!isPreview) {
      throw new Error(
        "The preview command requires a non-production Convex preview deployment.",
      );
    }

    if (
      env.CI !== "true" ||
      env.GITHUB_ACTIONS !== "true" ||
      env.KYB_ALLOW_PREVIEW_BUILD !== "1"
    ) {
      throw new Error(
        "Preview builds are restricted to the GitHub Actions preview job.",
      );
    }
  }

  if (mode === "production-ci") {
    if (convexUrl !== PRODUCTION_CONVEX_URL) {
      throw new Error(
        "The production command requires the configured production Convex URL.",
      );
    }

    if (
      env.CI !== "true" ||
      env.GITHUB_ACTIONS !== "true" ||
      env.KYB_ALLOW_PRODUCTION_DEPLOY !== "1"
    ) {
      throw new Error(
        "Production deployment is restricted to the protected GitHub Actions release job.",
      );
    }
  }

  return {
    lane:
      mode === "production-ci"
        ? "production"
        : mode === "preview-ci"
          ? "preview"
        : isLocal
          ? "local"
          : "integration",
  };
}

function run() {
  const mode = process.argv[2];
  const convexUrl = resolveConvexUrl();
  const result = validateConvexTarget({ mode, convexUrl });
  process.stdout.write(`Convex target guard: ${result.lane} lane accepted.\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    run();
  } catch (error) {
    process.stderr.write(
      `Convex target guard failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  }
}
