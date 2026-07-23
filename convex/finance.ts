import { v } from "convex/values";

import { query } from "./_generated/server";

export const latestForCandidate = query({
  args: { candidateSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("financeReports"),
      sourceId: v.union(v.id("sources"), v.null()),
      reportingPeriodLabel: v.string(),
      coverageStart: v.union(v.number(), v.null()),
      coverageEnd: v.union(v.number(), v.null()),
      raised: v.union(v.number(), v.null()),
      spent: v.union(v.number(), v.null()),
      cashOnHand: v.union(v.number(), v.null()),
      asOfDate: v.number(),
      lastReviewedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.candidateSlug))
      .unique();

    if (!candidate) return null;

    const report = await ctx.db
      .query("financeReports")
      .withIndex("by_candidate_and_as_of_date", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .first();

    if (!report) return null;

    return {
      id: report._id,
      sourceId: report.sourceId ?? null,
      reportingPeriodLabel: report.reportingPeriodLabel,
      coverageStart: report.coverageStart ?? null,
      coverageEnd: report.coverageEnd ?? null,
      raised: report.raised ?? null,
      spent: report.spent ?? null,
      cashOnHand: report.cashOnHand ?? null,
      asOfDate: report.asOfDate,
      lastReviewedAt: report.lastReviewedAt,
    };
  },
});
