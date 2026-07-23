import { v } from "convex/values";

import { query } from "./_generated/server";

const candidateSummary = v.object({
  id: v.id("candidates"),
  slug: v.string(),
  name: v.string(),
  initials: v.string(),
  party: v.string(),
  ballotLines: v.array(v.string()),
  role: v.string(),
  incumbent: v.boolean(),
  summary: v.string(),
  coverage: v.object({
    profile: v.number(),
    agenda: v.number(),
    record: v.number(),
    funding: v.number(),
  }),
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("races"),
      slug: v.string(),
      office: v.string(),
      officeLevel: v.union(
        v.literal("federal"),
        v.literal("state"),
        v.literal("county"),
        v.literal("municipal"),
        v.literal("judicial"),
        v.literal("other"),
      ),
      districtCode: v.union(v.string(), v.null()),
      districtLabel: v.union(v.string(), v.null()),
      seatCount: v.number(),
      status: v.union(
        v.literal("unconfirmed"),
        v.literal("confirmed"),
        v.literal("certified"),
      ),
      election: v.object({
        id: v.id("elections"),
        slug: v.string(),
        name: v.string(),
        electionDate: v.number(),
        jurisdiction: v.string(),
      }),
      candidates: v.array(candidateSummary),
    }),
  ),
  handler: async (ctx, args) => {
    const race = await ctx.db
      .query("races")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!race) return null;

    const election = await ctx.db.get(race.electionId);
    if (!election) return null;

    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_race", (q) => q.eq("raceId", race._id))
      .take(20);

    return {
      id: race._id,
      slug: race.slug,
      office: race.office,
      officeLevel: race.officeLevel,
      districtCode: race.districtCode ?? null,
      districtLabel: race.districtLabel ?? null,
      seatCount: race.seatCount,
      status: race.status,
      election: {
        id: election._id,
        slug: election.slug,
        name: election.name,
        electionDate: election.electionDate,
        jurisdiction: election.jurisdiction,
      },
      candidates: candidates.map((candidate) => ({
        id: candidate._id,
        slug: candidate.slug,
        name: candidate.name,
        initials: candidate.initials,
        party: candidate.party,
        ballotLines: candidate.ballotLines,
        role: candidate.role,
        incumbent: candidate.incumbent,
        summary: candidate.summary,
        coverage: candidate.coverage,
      })),
    };
  },
});
