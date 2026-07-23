import { v } from "convex/values";

import { query } from "./_generated/server";

const category = v.union(
  v.literal("agenda"),
  v.literal("record"),
  v.literal("support"),
  v.literal("statements-vs-actions"),
);

const evidenceStatus = v.union(
  v.literal("verified"),
  v.literal("candidate-statement"),
  v.literal("partisan-source"),
  v.literal("needs-review"),
  v.literal("not-found"),
);

export const listForCandidate = query({
  args: {
    candidateSlug: v.string(),
    category: v.optional(category),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.id("claims"),
      sourceId: v.union(v.id("sources"), v.null()),
      category,
      topic: v.string(),
      title: v.string(),
      detail: v.string(),
      evidenceStatus,
      claimDate: v.union(v.number(), v.null()),
      sortOrder: v.number(),
      lastReviewedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.candidateSlug))
      .unique();

    if (!candidate) return [];

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const claims = args.category
      ? await ctx.db
          .query("claims")
          .withIndex("by_candidate_and_category", (q) =>
            q.eq("candidateId", candidate._id).eq("category", args.category!),
          )
          .take(limit)
      : await ctx.db
          .query("claims")
          .withIndex("by_candidate", (q) =>
            q.eq("candidateId", candidate._id),
          )
          .take(limit);

    return claims
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((claim) => ({
        id: claim._id,
        sourceId: claim.sourceId ?? null,
        category: claim.category,
        topic: claim.topic,
        title: claim.title,
        detail: claim.detail,
        evidenceStatus: claim.evidenceStatus,
        claimDate: claim.claimDate ?? null,
        sortOrder: claim.sortOrder,
        lastReviewedAt: claim.lastReviewedAt,
      }));
  },
});
