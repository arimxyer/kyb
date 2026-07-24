import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server";

const sourceType = v.union(
  v.literal("government"),
  v.literal("campaign"),
  v.literal("party"),
  v.literal("filing"),
  v.literal("news"),
  v.literal("research"),
  v.literal("social"),
  v.literal("other"),
);

const sourceForFetch = v.object({
  id: v.id("sources"),
  externalId: v.string(),
  title: v.string(),
  publisher: v.string(),
  url: v.string(),
  sourceType,
  isPrimary: v.boolean(),
  contentHash: v.union(v.string(), v.null()),
  refreshIntervalHours: v.number(),
  nextCheckAt: v.union(v.number(), v.null()),
});

function defaultRefreshIntervalHours(
  value: Doc<"sources">["sourceType"],
): number {
  switch (value) {
    case "filing":
    case "news":
    case "social":
    case "campaign":
      return 24;
    case "government":
    case "party":
      return 72;
    case "research":
      return 24 * 14;
    case "other":
      return 24 * 7;
  }
}

export const getSourceForFetch = internalQuery({
  args: { sourceId: v.id("sources") },
  returns: v.union(v.null(), sourceForFetch),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.status !== "active") return null;

    return {
      id: source._id,
      externalId: source.externalId,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      sourceType: source.sourceType,
      isPrimary: source.isPrimary,
      contentHash: source.contentHash ?? null,
      refreshIntervalHours:
        source.refreshIntervalHours ??
        defaultRefreshIntervalHours(source.sourceType),
      nextCheckAt: source.nextCheckAt ?? null,
    };
  },
});

export const listSourcesForRefresh = internalQuery({
  args: {
    limit: v.number(),
    dueAt: v.number(),
    includeNotDue: v.boolean(),
  },
  returns: v.array(sourceForFetch),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit), 1), 50);
    const sources = args.includeNotDue
      ? await ctx.db
          .query("sources")
          .withIndex("by_status_and_next_check_at", (q) =>
            q.eq("status", "active"),
          )
          .take(limit)
      : await ctx.db
          .query("sources")
          .withIndex("by_status_and_next_check_at", (q) =>
            q.eq("status", "active").lte("nextCheckAt", args.dueAt),
          )
          .take(limit);

    return sources.map((source) => ({
      id: source._id,
      externalId: source.externalId,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      sourceType: source.sourceType,
      isPrimary: source.isPrimary,
      contentHash: source.contentHash ?? null,
      refreshIntervalHours:
        source.refreshIntervalHours ??
        defaultRefreshIntervalHours(source.sourceType),
      nextCheckAt: source.nextCheckAt ?? null,
    }));
  },
});

export const recordSourceSnapshot = internalMutation({
  args: {
    sourceId: v.id("sources"),
    url: v.string(),
    contentHash: v.string(),
    excerpt: v.string(),
    fetchedAt: v.number(),
    httpStatus: v.number(),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
  },
  returns: v.object({
    snapshotId: v.id("sourceSnapshots"),
    changeState: v.union(
      v.literal("baseline"),
      v.literal("unchanged"),
      v.literal("changed"),
    ),
    reviewStatus: v.union(
      v.literal("not-needed"),
      v.literal("queued"),
    ),
    nextCheckAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.status !== "active") {
      throw new Error("Source is unavailable for ingestion");
    }

    const changeState =
      source.contentHash === undefined
        ? ("baseline" as const)
        : source.contentHash === args.contentHash
          ? ("unchanged" as const)
          : ("changed" as const);
    const reviewStatus =
      changeState === "changed"
        ? ("queued" as const)
        : ("not-needed" as const);
    const refreshIntervalHours =
      source.refreshIntervalHours ??
      defaultRefreshIntervalHours(source.sourceType);
    const nextCheckAt =
      args.fetchedAt + refreshIntervalHours * 60 * 60 * 1000;

    const snapshotId = await ctx.db.insert("sourceSnapshots", {
      sourceId: source._id,
      url: args.url,
      contentHash: args.contentHash,
      excerpt: args.excerpt.slice(0, 12_000),
      fetchedAt: args.fetchedAt,
      httpStatus: args.httpStatus,
      ...(args.etag ? { etag: args.etag } : {}),
      ...(args.lastModified ? { lastModified: args.lastModified } : {}),
      changeState,
      reviewStatus,
    });

    await ctx.db.patch(source._id, {
      checkedAt: args.fetchedAt,
      refreshIntervalHours,
      nextCheckAt,
      contentHash: args.contentHash,
      ...(changeState === "changed"
        ? { lastChangedAt: args.fetchedAt }
        : {}),
    });

    if (changeState === "changed") {
      await ctx.db.insert("reviewEvents", {
        sourceSnapshotId: snapshotId,
        action: "source-change-queued",
        actor: "source-ingestion",
        createdAt: args.fetchedAt,
      });
    }

    return {
      snapshotId,
      changeState,
      reviewStatus,
      nextCheckAt,
    };
  },
});
