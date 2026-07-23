import { v } from "convex/values";

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

export const getFresh = internalQuery({
  args: {
    resourceKey: v.string(),
    now: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("sourceRefreshes"),
      completedAt: v.number(),
      expiresAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const refresh = await ctx.db
      .query("sourceRefreshes")
      .withIndex("by_resource_and_status", (q) =>
        q.eq("resourceKey", args.resourceKey).eq("status", "succeeded"),
      )
      .order("desc")
      .first();

    if (!refresh || !refresh.completedAt || refresh.expiresAt <= args.now) {
      return null;
    }

    return {
      id: refresh._id,
      completedAt: refresh.completedAt,
      expiresAt: refresh.expiresAt,
    };
  },
});

export const markStarted = internalMutation({
  args: {
    resourceKey: v.string(),
    sourceType,
    startedAt: v.number(),
    expiresAt: v.number(),
  },
  returns: v.id("sourceRefreshes"),
  handler: async (ctx, args) =>
    await ctx.db.insert("sourceRefreshes", {
      resourceKey: args.resourceKey,
      sourceType: args.sourceType,
      status: "running",
      startedAt: args.startedAt,
      expiresAt: args.expiresAt,
    }),
});

export const markSucceeded = internalMutation({
  args: {
    refreshId: v.id("sourceRefreshes"),
    completedAt: v.number(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refreshId, {
      status: "succeeded",
      completedAt: args.completedAt,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

export const markFailed = internalMutation({
  args: {
    refreshId: v.id("sourceRefreshes"),
    completedAt: v.number(),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refreshId, {
      status: "failed",
      completedAt: args.completedAt,
      error: args.error,
    });
    return null;
  },
});
