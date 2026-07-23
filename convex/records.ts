import { v } from "convex/values";

import { query } from "./_generated/server";

const evidenceStatus = v.union(
  v.literal("verified"),
  v.literal("candidate-statement"),
  v.literal("partisan-source"),
  v.literal("needs-review"),
  v.literal("not-found"),
);

export const listOfficeTerms = query({
  args: { candidateSlug: v.string() },
  returns: v.array(
    v.object({
      id: v.id("officeTerms"),
      sourceId: v.union(v.id("sources"), v.null()),
      officeTitle: v.string(),
      jurisdiction: v.string(),
      startedAt: v.union(v.number(), v.null()),
      endedAt: v.union(v.number(), v.null()),
      current: v.boolean(),
      evidenceStatus,
      lastReviewedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.candidateSlug))
      .unique();

    if (!candidate) return [];

    const terms = await ctx.db
      .query("officeTerms")
      .withIndex("by_candidate_and_started_at", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .take(25);

    return terms.map((term) => ({
      id: term._id,
      sourceId: term.sourceId ?? null,
      officeTitle: term.officeTitle,
      jurisdiction: term.jurisdiction,
      startedAt: term.startedAt ?? null,
      endedAt: term.endedAt ?? null,
      current: term.current,
      evidenceStatus: term.evidenceStatus,
      lastReviewedAt: term.lastReviewedAt,
    }));
  },
});

export const listEndorsements = query({
  args: { candidateSlug: v.string() },
  returns: v.array(
    v.object({
      id: v.id("endorsements"),
      sourceId: v.union(v.id("sources"), v.null()),
      endorserName: v.string(),
      endorserType: v.union(
        v.literal("organization"),
        v.literal("official"),
        v.literal("union"),
        v.literal("party"),
        v.literal("publication"),
        v.literal("other"),
      ),
      position: v.union(v.literal("support"), v.literal("oppose")),
      announcedAt: v.union(v.number(), v.null()),
      evidenceStatus,
      lastReviewedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.candidateSlug))
      .unique();

    if (!candidate) return [];

    const endorsements = await ctx.db
      .query("endorsements")
      .withIndex("by_candidate_and_announced_at", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .take(50);

    return endorsements.map((endorsement) => ({
      id: endorsement._id,
      sourceId: endorsement.sourceId ?? null,
      endorserName: endorsement.endorserName,
      endorserType: endorsement.endorserType,
      position: endorsement.position,
      announcedAt: endorsement.announcedAt ?? null,
      evidenceStatus: endorsement.evidenceStatus,
      lastReviewedAt: endorsement.lastReviewedAt,
    }));
  },
});
