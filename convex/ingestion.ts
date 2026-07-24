import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  internalAction,
  type ActionCtx,
} from "./_generated/server";

const refreshStatus = v.union(
  v.literal("skipped"),
  v.literal("baseline"),
  v.literal("unchanged"),
  v.literal("changed"),
  v.literal("failed"),
);

const refreshResult = v.object({
  sourceId: v.id("sources"),
  status: refreshStatus,
  snapshotId: v.union(v.id("sourceSnapshots"), v.null()),
  httpStatus: v.union(v.number(), v.null()),
  error: v.union(v.string(), v.null()),
});

type RefreshResult = {
  sourceId: Id<"sources">;
  status:
    | "skipped"
    | "baseline"
    | "unchanged"
    | "changed"
    | "failed";
  snapshotId: Id<"sourceSnapshots"> | null;
  httpStatus: number | null;
  error: string | null;
};

type SourceForFetch = {
  id: Id<"sources">;
  externalId: string;
  title: string;
  publisher: string;
  url: string;
  sourceType:
    | "government"
    | "campaign"
    | "party"
    | "filing"
    | "news"
    | "research"
    | "social"
    | "other";
  isPrimary: boolean;
  contentHash: string | null;
  refreshIntervalHours: number;
  nextCheckAt: number | null;
};

type RefreshSummary = {
  requested: number;
  skipped: number;
  baseline: number;
  unchanged: number;
  changed: number;
  failed: number;
  errors: string[];
};

const MAX_RESPONSE_BYTES = 4_000_000;
const MAX_TEXT_CHARACTERS = 250_000;

function compactError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").slice(0, 500);
}

function normalizeText(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function sha256(value: string | Uint8Array): Promise<string> {
  const sourceBytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const bytes = new Uint8Array(sourceBytes.byteLength);
  bytes.set(sourceBytes);
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error(
        `Response is too large (maximum ${MAX_RESPONSE_BYTES} bytes)`,
      );
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function readResponse(response: Response): Promise<{
  contentHash: string;
  excerpt: string;
}> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error(
      `Response is too large (${declaredLength} bytes; maximum ${MAX_RESPONSE_BYTES})`,
    );
  }

  const contentType = (
    response.headers.get("content-type") ?? ""
  ).toLowerCase();
  const isText =
    contentType.includes("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType === "";
  const body = await readLimitedBody(response);

  if (!isText) {
    return {
      contentHash: await sha256(body),
      excerpt: `${contentType || "Binary"} document (${body.byteLength.toLocaleString("en-US")} bytes). Text extraction is not available for this source type.`,
    };
  }

  const rawText = new TextDecoder()
    .decode(body)
    .slice(0, MAX_TEXT_CHARACTERS);
  const normalized = normalizeText(rawText);
  return {
    contentHash: await sha256(normalized),
    excerpt: normalized.slice(0, 12_000),
  };
}

async function refreshOne(
  ctx: ActionCtx,
  sourceId: Id<"sources">,
  force: boolean,
): Promise<RefreshResult> {
  const now = Date.now();
  const source = await ctx.runQuery(
    internal.ingestionData.getSourceForFetch,
    { sourceId },
  );

  if (!source) {
    return {
      sourceId,
      status: "failed",
      snapshotId: null,
      httpStatus: null,
      error: "Source is unavailable for ingestion",
    };
  }

  if (!force && source.nextCheckAt !== null && source.nextCheckAt > now) {
    return {
      sourceId,
      status: "skipped",
      snapshotId: null,
      httpStatus: null,
      error: null,
    };
  }

  const resourceKey = `source:${source.externalId}`;
  if (!force) {
    const freshRefresh = await ctx.runQuery(
      internal.sourceRefreshes.getFresh,
      { resourceKey, now },
    );
    if (freshRefresh) {
      return {
        sourceId,
        status: "skipped",
        snapshotId: null,
        httpStatus: null,
        error: null,
      };
    }
  }

  const provisionalExpiry = now + 15 * 60 * 1000;
  const refreshStart = await ctx.runMutation(
    internal.sourceRefreshes.markStarted,
    {
      resourceKey,
      sourceType: source.sourceType,
      startedAt: now,
      expiresAt: provisionalExpiry,
    },
  );
  if (!refreshStart.started) {
    return {
      sourceId,
      status: "skipped",
      snapshotId: null,
      httpStatus: null,
      error: null,
    };
  }

  let httpStatus: number | null = null;
  try {
    const response = await fetch(source.url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/json,text/plain,application/pdf;q=0.9,*/*;q=0.5",
        "User-Agent":
          "KnowYourBallot/0.1 (+https://know-your-ballot.arimxyer.chatgpt.site)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    httpStatus = response.status;
    if (!response.ok) {
      throw new Error(`Source returned HTTP ${response.status}`);
    }

    const { contentHash, excerpt } = await readResponse(response);
    const fetchedAt = Date.now();
    const snapshot = await ctx.runMutation(
      internal.ingestionData.recordSourceSnapshot,
      {
        sourceId,
        url: response.url || source.url,
        contentHash,
        excerpt,
        fetchedAt,
        httpStatus: response.status,
        ...(response.headers.get("etag")
          ? { etag: response.headers.get("etag")! }
          : {}),
        ...(response.headers.get("last-modified")
          ? { lastModified: response.headers.get("last-modified")! }
          : {}),
      },
    );

    await ctx.runMutation(internal.sourceRefreshes.markSucceeded, {
      refreshId: refreshStart.refreshId,
      completedAt: fetchedAt,
      expiresAt: snapshot.nextCheckAt,
    });

    return {
      sourceId,
      status: snapshot.changeState,
      snapshotId: snapshot.snapshotId,
      httpStatus: response.status,
      error: null,
    };
  } catch (error) {
    const message = compactError(error);
    await ctx.runMutation(internal.sourceRefreshes.markFailed, {
      refreshId: refreshStart.refreshId,
      completedAt: Date.now(),
      error: message,
    });
    return {
      sourceId,
      status: "failed",
      snapshotId: null,
      httpStatus,
      error: message,
    };
  }
}

export const refreshSource = internalAction({
  args: {
    sourceId: v.id("sources"),
    force: v.optional(v.boolean()),
  },
  returns: refreshResult,
  handler: async (ctx, args) =>
    await refreshOne(ctx, args.sourceId, args.force ?? false),
});

export const refreshTrackedSources = internalAction({
  args: {
    limit: v.optional(v.number()),
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    requested: v.number(),
    skipped: v.number(),
    baseline: v.number(),
    unchanged: v.number(),
    changed: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<RefreshSummary> => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 50);
    const sources: SourceForFetch[] = await ctx.runQuery(
      internal.ingestionData.listSourcesForRefresh,
      {
        limit,
        dueAt: Date.now(),
        includeNotDue: args.force ?? false,
      },
    );
    const results: RefreshResult[] = [];

    for (const source of sources) {
      results.push(
        await refreshOne(ctx, source.id, args.force ?? false),
      );
    }

    return {
      requested: sources.length,
      skipped: results.filter((result) => result.status === "skipped").length,
      baseline: results.filter((result) => result.status === "baseline").length,
      unchanged: results.filter((result) => result.status === "unchanged")
        .length,
      changed: results.filter((result) => result.status === "changed").length,
      failed: results.filter((result) => result.status === "failed").length,
      errors: results
        .filter((result) => result.error)
        .map((result) => result.error!)
        .slice(0, 20),
    };
  },
});
