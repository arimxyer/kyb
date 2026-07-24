import { v } from "convex/values";

import {
  candidates as prototypeCandidates,
  election as prototypeElection,
  sources as prototypeSources,
} from "./fixtures/prototype";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

const reviewedAt = Date.parse("2026-07-23T12:00:00-04:00");
const electionDate = Date.parse("2026-11-03T12:00:00-05:00");
const earlyVotingStart = Date.parse("2026-10-24T12:00:00-04:00");
const earlyVotingEnd = Date.parse("2026-11-01T12:00:00-05:00");

const seedResult = v.object({
  status: v.union(v.literal("seeded"), v.literal("already-seeded")),
  elections: v.number(),
  races: v.number(),
  candidates: v.number(),
  sources: v.number(),
  claims: v.number(),
  officeTerms: v.number(),
  endorsements: v.number(),
  financeReports: v.number(),
});

export const prototype = internalMutation({
  args: {},
  returns: seedResult,
  handler: async (ctx) => {
    const existingElection = await ctx.db
      .query("elections")
      .withIndex("by_slug", (q) => q.eq("slug", "2026-general"))
      .unique();

    if (existingElection) {
      return {
        status: "already-seeded" as const,
        elections: 0,
        races: 0,
        candidates: 0,
        sources: 0,
        claims: 0,
        officeTerms: 0,
        endorsements: 0,
        financeReports: 0,
      };
    }

    const sourceIds = new Map<string, Id<"sources">>();

    for (const source of prototypeSources) {
      const sourceId = await ctx.db.insert("sources", {
        externalId: source.id,
        title: source.title,
        publisher: source.publisher,
        url: source.url,
        sourceType: source.sourceType,
        isPrimary: source.sourceType === "government",
        checkedAt: reviewedAt,
        status: "active",
      });
      sourceIds.set(source.id, sourceId);
    }

    const candidateSourceId = sourceIds.get(
      prototypeElection.candidateSourceId,
    );

    const electionId = await ctx.db.insert("elections", {
      slug: "2026-general",
      name: prototypeElection.name,
      electionDate,
      earlyVotingStart,
      earlyVotingEnd,
      jurisdiction: "New York",
      county: prototypeElection.county,
      pilotZip: prototypeElection.pilotZip,
      ...(candidateSourceId ? { candidateSourceId } : {}),
      status: "scheduled",
      lastReviewedAt: reviewedAt,
    });

    const raceId = await ctx.db.insert("races", {
      slug: "ny-04",
      electionId,
      office: "U.S. Representative",
      officeLevel: "federal",
      districtCode: prototypeElection.districtCode,
      districtLabel: prototypeElection.district,
      seatCount: 1,
      status: "confirmed",
      lastReviewedAt: reviewedAt,
    });

    const candidateIds = new Map<string, Id<"candidates">>();

    for (const candidate of prototypeCandidates) {
      const candidateId = await ctx.db.insert("candidates", {
        slug: candidate.slug,
        raceId,
        name: candidate.name,
        initials: candidate.initials,
        party: candidate.party,
        ballotLines: candidate.ballotLines,
        role: candidate.role,
        incumbent: candidate.incumbent,
        summary: candidate.summary,
        ...(candidate.fecId ? { fecId: candidate.fecId } : {}),
        status: "qualified",
        coverage: candidate.coverage,
        lastReviewedAt: reviewedAt,
      });
      candidateIds.set(candidate.slug, candidateId);
    }

    let claimCount = 0;

    for (const candidate of prototypeCandidates) {
      const candidateId = candidateIds.get(candidate.slug);
      if (!candidateId) {
        throw new Error(`Missing candidate ID for ${candidate.slug}`);
      }

      const insertClaim = async ({
        category,
        topic,
        title,
        detail,
        sourceExternalId,
        evidenceStatus,
        sortOrder,
      }: {
        category:
          | "agenda"
          | "record"
          | "support"
          | "statements-vs-actions";
        topic: string;
        title: string;
        detail: string;
        sourceExternalId: string | null;
        evidenceStatus:
          | "verified"
          | "candidate-statement"
          | "partisan-source"
          | "needs-review"
          | "not-found";
        sortOrder: number;
      }) => {
        const sourceId = sourceExternalId
          ? sourceIds.get(sourceExternalId)
          : null;

        await ctx.db.insert("claims", {
          candidateId,
          raceId,
          ...(sourceId ? { sourceId } : {}),
          category,
          topic,
          title,
          detail,
          evidenceStatus,
          sortOrder,
          lastReviewedAt: reviewedAt,
        });
        claimCount += 1;
      };

      for (const [index, item] of candidate.agenda.entries()) {
        await insertClaim({
          category: "agenda",
          topic: item.topic,
          title: item.topic,
          detail: item.position,
          sourceExternalId: item.sourceId,
          evidenceStatus: item.status,
          sortOrder: index,
        });
      }

      for (const [index, item] of candidate.record.entries()) {
        await insertClaim({
          category: "record",
          topic: "Public record",
          title: item.title,
          detail: item.detail,
          sourceExternalId: item.sourceId,
          evidenceStatus: item.status,
          sortOrder: index,
        });
      }

      for (const [index, item] of candidate.support.entries()) {
        await insertClaim({
          category: "support",
          topic: "Support",
          title: item.title,
          detail: item.detail,
          sourceExternalId: item.sourceId,
          evidenceStatus: item.status,
          sortOrder: index,
        });
      }

      for (const [index, item] of candidate.statementsVsActions.entries()) {
        await insertClaim({
          category: "statements-vs-actions",
          topic: "Statements versus actions",
          title: item.title,
          detail: item.detail,
          sourceExternalId: item.sourceId,
          evidenceStatus: item.status,
          sortOrder: index,
        });
      }
    }

    const lauraId = candidateIds.get("laura-gillen");
    const driscollId = candidateIds.get("jeanine-driscoll");
    if (!lauraId || !driscollId) {
      throw new Error("Required candidate IDs were not created");
    }

    const gillenHouseSource = sourceIds.get("gillen-house-about");
    const driscollCampaignSource = sourceIds.get("driscoll-campaign");

    await ctx.db.insert("officeTerms", {
      candidateId: lauraId,
      ...(gillenHouseSource ? { sourceId: gillenHouseSource } : {}),
      officeTitle: "U.S. Representative",
      jurisdiction: "New York’s 4th Congressional District",
      startedAt: Date.parse("2025-01-03T12:00:00-05:00"),
      current: true,
      evidenceStatus: "verified",
      lastReviewedAt: reviewedAt,
    });

    await ctx.db.insert("officeTerms", {
      candidateId: lauraId,
      ...(gillenHouseSource ? { sourceId: gillenHouseSource } : {}),
      officeTitle: "Hempstead Town Supervisor",
      jurisdiction: "Town of Hempstead, New York",
      startedAt: Date.parse("2018-01-01T12:00:00-05:00"),
      endedAt: Date.parse("2019-12-31T12:00:00-05:00"),
      current: false,
      evidenceStatus: "verified",
      lastReviewedAt: reviewedAt,
    });

    await ctx.db.insert("officeTerms", {
      candidateId: driscollId,
      ...(driscollCampaignSource
        ? { sourceId: driscollCampaignSource }
        : {}),
      officeTitle: "Hempstead Town Receiver of Taxes",
      jurisdiction: "Town of Hempstead, New York",
      current: true,
      evidenceStatus: "candidate-statement",
      lastReviewedAt: reviewedAt,
    });

    const gillenEndorsementSource = sourceIds.get("gillen-endorsement");
    const driscollNrccSource = sourceIds.get("driscoll-nrcc");

    await ctx.db.insert("endorsements", {
      candidateId: lauraId,
      raceId,
      ...(gillenEndorsementSource
        ? { sourceId: gillenEndorsementSource }
        : {}),
      endorserName: "Congressional Black Caucus PAC",
      endorserType: "organization",
      position: "support",
      announcedAt: Date.parse("2026-03-13T12:00:00-04:00"),
      evidenceStatus: "candidate-statement",
      lastReviewedAt: reviewedAt,
    });

    await ctx.db.insert("endorsements", {
      candidateId: driscollId,
      raceId,
      ...(driscollNrccSource ? { sourceId: driscollNrccSource } : {}),
      endorserName: "NRCC MAGA Majority program",
      endorserType: "party",
      position: "support",
      announcedAt: Date.parse("2026-07-15T12:00:00-04:00"),
      evidenceStatus: "partisan-source",
      lastReviewedAt: reviewedAt,
    });

    let financeReportCount = 0;

    for (const candidate of prototypeCandidates) {
      if (
        candidate.finance.raised === null &&
        candidate.finance.spent === null &&
        candidate.finance.cashOnHand === null
      ) {
        continue;
      }

      const candidateId = candidateIds.get(candidate.slug);
      if (!candidateId) continue;

      const sourceId = candidate.finance.sourceId
        ? sourceIds.get(candidate.finance.sourceId)
        : null;

      const coverageStart =
        candidate.slug === "laura-gillen"
          ? Date.parse("2025-01-01T12:00:00-05:00")
          : Date.parse("2026-04-01T12:00:00-04:00");

      await ctx.db.insert("financeReports", {
        candidateId,
        raceId,
        ...(sourceId ? { sourceId } : {}),
        coverageStart,
        coverageEnd: Date.parse("2026-06-30T12:00:00-04:00"),
        reportingPeriodLabel: candidate.finance.coverage,
        ...(candidate.finance.raised === null
          ? {}
          : { raised: candidate.finance.raised }),
        ...(candidate.finance.spent === null
          ? {}
          : { spent: candidate.finance.spent }),
        ...(candidate.finance.cashOnHand === null
          ? {}
          : { cashOnHand: candidate.finance.cashOnHand }),
        asOfDate: Date.parse("2026-06-30T12:00:00-04:00"),
        lastReviewedAt: reviewedAt,
      });
      financeReportCount += 1;
    }

    return {
      status: "seeded" as const,
      elections: 1,
      races: 1,
      candidates: prototypeCandidates.length,
      sources: prototypeSources.length,
      claims: claimCount,
      officeTerms: 3,
      endorsements: 2,
      financeReports: financeReportCount,
    };
  },
});

export const reviewFoundation = internalMutation({
  args: {},
  returns: v.object({
    status: v.literal("ready"),
    sourcesChecked: v.number(),
    sourcesUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_status_and_next_check_at", (q) =>
        q.eq("status", "active"),
      )
      .take(100);
    let sourcesUpdated = 0;

    for (const source of sources) {
      if (
        source.refreshIntervalHours !== undefined &&
        source.nextCheckAt !== undefined
      ) {
        continue;
      }

      const refreshIntervalHours =
        source.sourceType === "filing" ||
        source.sourceType === "news" ||
        source.sourceType === "social" ||
        source.sourceType === "campaign"
          ? 24
          : source.sourceType === "government" ||
                source.sourceType === "party"
            ? 72
            : source.sourceType === "research"
              ? 24 * 14
              : 24 * 7;

      await ctx.db.patch(source._id, {
        refreshIntervalHours:
          source.refreshIntervalHours ?? refreshIntervalHours,
        nextCheckAt:
          source.nextCheckAt ??
          source.checkedAt + refreshIntervalHours * 60 * 60 * 1000,
      });
      sourcesUpdated += 1;
    }

    return {
      status: "ready" as const,
      sourcesChecked: sources.length,
      sourcesUpdated,
    };
  },
});
