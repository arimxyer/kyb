import { v } from "convex/values";

import { query } from "./_generated/server";

const coverage = v.object({
  profile: v.number(),
  agenda: v.number(),
  record: v.number(),
  funding: v.number(),
});

const candidateProfile = v.object({
  id: v.id("candidates"),
  raceId: v.id("races"),
  slug: v.string(),
  name: v.string(),
  initials: v.string(),
  party: v.string(),
  ballotLines: v.array(v.string()),
  role: v.string(),
  incumbent: v.boolean(),
  summary: v.string(),
  fecId: v.union(v.string(), v.null()),
  campaignUrl: v.union(v.string(), v.null()),
  status: v.union(
    v.literal("filed"),
    v.literal("qualified"),
    v.literal("withdrawn"),
    v.literal("unconfirmed"),
  ),
  coverage,
  lastReviewedAt: v.number(),
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), candidateProfile),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!candidate) return null;

    return {
      id: candidate._id,
      raceId: candidate.raceId,
      slug: candidate.slug,
      name: candidate.name,
      initials: candidate.initials,
      party: candidate.party,
      ballotLines: candidate.ballotLines,
      role: candidate.role,
      incumbent: candidate.incumbent,
      summary: candidate.summary,
      fecId: candidate.fecId ?? null,
      campaignUrl: candidate.campaignUrl ?? null,
      status: candidate.status,
      coverage: candidate.coverage,
      lastReviewedAt: candidate.lastReviewedAt,
    };
  },
});
