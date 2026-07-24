import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";

const evidenceStatus = v.union(
  v.literal("verified"),
  v.literal("candidate-statement"),
  v.literal("partisan-source"),
  v.literal("needs-review"),
  v.literal("not-found"),
);

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

const sourceSummary = v.object({
  id: v.string(),
  title: v.string(),
  publisher: v.string(),
  url: v.string(),
  sourceType,
  isPrimary: v.boolean(),
  checkedAt: v.number(),
});

const coverage = v.object({
  profile: v.number(),
  agenda: v.number(),
  record: v.number(),
  funding: v.number(),
});

const candidateSummary = v.object({
  slug: v.string(),
  name: v.string(),
  initials: v.string(),
  party: v.string(),
  ballotLines: v.array(v.string()),
  role: v.string(),
  incumbent: v.boolean(),
  summary: v.string(),
  coverage,
});

const agendaItem = v.object({
  topic: v.string(),
  position: v.string(),
  source: v.union(sourceSummary, v.null()),
  status: evidenceStatus,
});

const evidenceItem = v.object({
  title: v.string(),
  detail: v.string(),
  source: v.union(sourceSummary, v.null()),
  status: evidenceStatus,
});

const financeSummary = v.object({
  raised: v.union(v.number(), v.null()),
  spent: v.union(v.number(), v.null()),
  cashOnHand: v.union(v.number(), v.null()),
  coverage: v.string(),
  asOfDate: v.union(v.number(), v.null()),
  source: v.union(sourceSummary, v.null()),
});

const officeTerm = v.object({
  officeTitle: v.string(),
  jurisdiction: v.string(),
  startedAt: v.union(v.number(), v.null()),
  endedAt: v.union(v.number(), v.null()),
  current: v.boolean(),
  status: evidenceStatus,
  source: v.union(sourceSummary, v.null()),
});

const endorsement = v.object({
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
  status: evidenceStatus,
  source: v.union(sourceSummary, v.null()),
});

const candidateProfile = v.object({
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
  coverage,
  lastReviewedAt: v.number(),
  agenda: v.array(agendaItem),
  record: v.array(evidenceItem),
  support: v.array(evidenceItem),
  statementsVsActions: v.array(evidenceItem),
  finance: financeSummary,
  officeTerms: v.array(officeTerm),
  endorsements: v.array(endorsement),
});

const electionSummary = v.object({
  slug: v.string(),
  name: v.string(),
  electionDate: v.number(),
  earlyVotingStart: v.union(v.number(), v.null()),
  earlyVotingEnd: v.union(v.number(), v.null()),
  jurisdiction: v.string(),
  county: v.union(v.string(), v.null()),
  pilotZip: v.union(v.string(), v.null()),
  lastReviewedAt: v.number(),
  candidateSource: v.union(sourceSummary, v.null()),
});

const raceSummary = v.object({
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
  lastReviewedAt: v.number(),
});

type SerializedSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType: Doc<"sources">["sourceType"];
  isPrimary: boolean;
  checkedAt: number;
};

function serializeSource(source: Doc<"sources">): SerializedSource {
  return {
    id: source.externalId,
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    sourceType: source.sourceType,
    isPrimary: source.isPrimary,
    checkedAt: source.checkedAt,
  };
}

async function getSource(
  ctx: QueryCtx,
  sourceId: Id<"sources"> | undefined,
): Promise<SerializedSource | null> {
  if (!sourceId) return null;
  const source = await ctx.db.get(sourceId);
  return source ? serializeSource(source) : null;
}

function serializeCandidateSummary(candidate: Doc<"candidates">) {
  return {
    slug: candidate.slug,
    name: candidate.name,
    initials: candidate.initials,
    party: candidate.party,
    ballotLines: candidate.ballotLines,
    role: candidate.role,
    incumbent: candidate.incumbent,
    summary: candidate.summary,
    coverage: candidate.coverage,
  };
}

async function getRaceAndElection(ctx: QueryCtx, raceSlug: string) {
  const race = await ctx.db
    .query("races")
    .withIndex("by_slug", (q) => q.eq("slug", raceSlug))
    .unique();
  if (!race) return null;

  const election = await ctx.db.get(race.electionId);
  if (!election) return null;

  return { race, election };
}

async function getCandidateProfile(
  ctx: QueryCtx,
  candidate: Doc<"candidates">,
) {
  const [claims, financeReport, terms, endorsementRows] = await Promise.all([
    ctx.db
      .query("claims")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidate._id))
      .take(100),
    ctx.db
      .query("financeReports")
      .withIndex("by_candidate_and_as_of_date", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .first(),
    ctx.db
      .query("officeTerms")
      .withIndex("by_candidate_and_started_at", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .take(25),
    ctx.db
      .query("endorsements")
      .withIndex("by_candidate_and_announced_at", (q) =>
        q.eq("candidateId", candidate._id),
      )
      .order("desc")
      .take(50),
  ]);

  const sourceIds = new Set<Id<"sources">>();
  for (const claim of claims) {
    if (claim.sourceId) sourceIds.add(claim.sourceId);
  }
  if (financeReport?.sourceId) sourceIds.add(financeReport.sourceId);
  for (const term of terms) {
    if (term.sourceId) sourceIds.add(term.sourceId);
  }
  for (const row of endorsementRows) {
    if (row.sourceId) sourceIds.add(row.sourceId);
  }

  const sourceDocuments = await Promise.all(
    [...sourceIds].map(async (sourceId) => ({
      sourceId,
      source: await ctx.db.get(sourceId),
    })),
  );
  const sources = new Map<string, SerializedSource>();
  for (const { sourceId, source } of sourceDocuments) {
    if (source) sources.set(String(sourceId), serializeSource(source));
  }

  const resolveSource = (sourceId: Id<"sources"> | undefined) =>
    sourceId ? (sources.get(String(sourceId)) ?? null) : null;

  const orderedClaims = [...claims].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const agenda = orderedClaims
    .filter((claim) => claim.category === "agenda")
    .map((claim) => ({
      topic: claim.topic,
      position: claim.detail,
      source: resolveSource(claim.sourceId),
      status: claim.evidenceStatus,
    }));
  const mapEvidence = (category: Doc<"claims">["category"]) =>
    orderedClaims
      .filter((claim) => claim.category === category)
      .map((claim) => ({
        title: claim.title,
        detail: claim.detail,
        source: resolveSource(claim.sourceId),
        status: claim.evidenceStatus,
      }));

  return {
    ...serializeCandidateSummary(candidate),
    fecId: candidate.fecId ?? null,
    campaignUrl: candidate.campaignUrl ?? null,
    lastReviewedAt: candidate.lastReviewedAt,
    agenda,
    record: mapEvidence("record"),
    support: mapEvidence("support"),
    statementsVsActions: mapEvidence("statements-vs-actions"),
    finance: financeReport
      ? {
          raised: financeReport.raised ?? null,
          spent: financeReport.spent ?? null,
          cashOnHand: financeReport.cashOnHand ?? null,
          coverage: financeReport.reportingPeriodLabel,
          asOfDate: financeReport.asOfDate,
          source: resolveSource(financeReport.sourceId),
        }
      : {
          raised: null,
          spent: null,
          cashOnHand: null,
          coverage: "No comparable filing captured",
          asOfDate: null,
          source: null,
        },
    officeTerms: terms.map((term) => ({
      officeTitle: term.officeTitle,
      jurisdiction: term.jurisdiction,
      startedAt: term.startedAt ?? null,
      endedAt: term.endedAt ?? null,
      current: term.current,
      status: term.evidenceStatus,
      source: resolveSource(term.sourceId),
    })),
    endorsements: endorsementRows.map((row) => ({
      endorserName: row.endorserName,
      endorserType: row.endorserType,
      position: row.position,
      announcedAt: row.announcedAt ?? null,
      status: row.evidenceStatus,
      source: resolveSource(row.sourceId),
    })),
  };
}

export const getRace = query({
  args: { raceSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      election: electionSummary,
      race: raceSummary,
      candidates: v.array(candidateSummary),
    }),
  ),
  handler: async (ctx, args) => {
    const result = await getRaceAndElection(ctx, args.raceSlug);
    if (!result) return null;
    const { race, election } = result;

    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_race", (q) => q.eq("raceId", race._id))
      .take(20);
    const candidateSource = await getSource(ctx, election.candidateSourceId);

    return {
      election: {
        slug: election.slug,
        name: election.name,
        electionDate: election.electionDate,
        earlyVotingStart: election.earlyVotingStart ?? null,
        earlyVotingEnd: election.earlyVotingEnd ?? null,
        jurisdiction: election.jurisdiction,
        county: election.county ?? null,
        pilotZip: election.pilotZip ?? null,
        lastReviewedAt: election.lastReviewedAt,
        candidateSource,
      },
      race: {
        slug: race.slug,
        office: race.office,
        officeLevel: race.officeLevel,
        districtCode: race.districtCode ?? null,
        districtLabel: race.districtLabel ?? null,
        seatCount: race.seatCount,
        lastReviewedAt: race.lastReviewedAt,
      },
      candidates: candidates.map(serializeCandidateSummary),
    };
  },
});

export const getRaceComparison = query({
  args: { raceSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      election: electionSummary,
      race: raceSummary,
      candidates: v.array(candidateProfile),
    }),
  ),
  handler: async (ctx, args) => {
    const result = await getRaceAndElection(ctx, args.raceSlug);
    if (!result) return null;
    const { race, election } = result;

    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_race", (q) => q.eq("raceId", race._id))
      .take(20);
    const candidateSource = await getSource(ctx, election.candidateSourceId);
    const profiles = await Promise.all(
      candidates.map((candidate) => getCandidateProfile(ctx, candidate)),
    );

    return {
      election: {
        slug: election.slug,
        name: election.name,
        electionDate: election.electionDate,
        earlyVotingStart: election.earlyVotingStart ?? null,
        earlyVotingEnd: election.earlyVotingEnd ?? null,
        jurisdiction: election.jurisdiction,
        county: election.county ?? null,
        pilotZip: election.pilotZip ?? null,
        lastReviewedAt: election.lastReviewedAt,
        candidateSource,
      },
      race: {
        slug: race.slug,
        office: race.office,
        officeLevel: race.officeLevel,
        districtCode: race.districtCode ?? null,
        districtLabel: race.districtLabel ?? null,
        seatCount: race.seatCount,
        lastReviewedAt: race.lastReviewedAt,
      },
      candidates: profiles,
    };
  },
});

export const getCandidate = query({
  args: { candidateSlug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      election: electionSummary,
      race: raceSummary,
      candidate: candidateProfile,
    }),
  ),
  handler: async (ctx, args) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_slug", (q) => q.eq("slug", args.candidateSlug))
      .unique();
    if (!candidate) return null;

    const race = await ctx.db.get(candidate.raceId);
    if (!race) return null;
    const election = await ctx.db.get(race.electionId);
    if (!election) return null;

    const [candidateSource, profile] = await Promise.all([
      getSource(ctx, election.candidateSourceId),
      getCandidateProfile(ctx, candidate),
    ]);

    return {
      election: {
        slug: election.slug,
        name: election.name,
        electionDate: election.electionDate,
        earlyVotingStart: election.earlyVotingStart ?? null,
        earlyVotingEnd: election.earlyVotingEnd ?? null,
        jurisdiction: election.jurisdiction,
        county: election.county ?? null,
        pilotZip: election.pilotZip ?? null,
        lastReviewedAt: election.lastReviewedAt,
        candidateSource,
      },
      race: {
        slug: race.slug,
        office: race.office,
        officeLevel: race.officeLevel,
        districtCode: race.districtCode ?? null,
        districtLabel: race.districtLabel ?? null,
        seatCount: race.seatCount,
        lastReviewedAt: race.lastReviewedAt,
      },
      candidate: profile,
    };
  },
});
