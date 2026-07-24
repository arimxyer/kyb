import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const evidenceStatus = v.union(
  v.literal("verified"),
  v.literal("candidate-statement"),
  v.literal("partisan-source"),
  v.literal("needs-review"),
  v.literal("not-found"),
);

const claimCategory = v.union(
  v.literal("agenda"),
  v.literal("record"),
  v.literal("support"),
  v.literal("statements-vs-actions"),
);

const officeLevel = v.union(
  v.literal("federal"),
  v.literal("state"),
  v.literal("county"),
  v.literal("municipal"),
  v.literal("judicial"),
  v.literal("other"),
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

export default defineSchema({
  elections: defineTable({
    slug: v.string(),
    name: v.string(),
    electionDate: v.number(),
    earlyVotingStart: v.optional(v.number()),
    earlyVotingEnd: v.optional(v.number()),
    jurisdiction: v.string(),
    county: v.optional(v.string()),
    pilotZip: v.optional(v.string()),
    candidateSourceId: v.optional(v.id("sources")),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("complete"),
    ),
    lastReviewedAt: v.number(),
  }).index("by_slug", ["slug"]),

  races: defineTable({
    slug: v.string(),
    electionId: v.id("elections"),
    office: v.string(),
    officeLevel,
    districtCode: v.optional(v.string()),
    districtLabel: v.optional(v.string()),
    seatCount: v.number(),
    status: v.union(
      v.literal("unconfirmed"),
      v.literal("confirmed"),
      v.literal("certified"),
    ),
    lastReviewedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_election", ["electionId"]),

  candidates: defineTable({
    slug: v.string(),
    raceId: v.id("races"),
    name: v.string(),
    initials: v.string(),
    party: v.string(),
    ballotLines: v.array(v.string()),
    role: v.string(),
    incumbent: v.boolean(),
    summary: v.string(),
    fecId: v.optional(v.string()),
    campaignUrl: v.optional(v.string()),
    status: v.union(
      v.literal("filed"),
      v.literal("qualified"),
      v.literal("withdrawn"),
      v.literal("unconfirmed"),
    ),
    coverage: v.object({
      profile: v.number(),
      agenda: v.number(),
      record: v.number(),
      funding: v.number(),
    }),
    lastReviewedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_race", ["raceId"])
    .index("by_fec_id", ["fecId"]),

  sources: defineTable({
    externalId: v.string(),
    title: v.string(),
    publisher: v.string(),
    url: v.string(),
    archivalUrl: v.optional(v.string()),
    sourceType,
    isPrimary: v.boolean(),
    publishedAt: v.optional(v.number()),
    checkedAt: v.number(),
    refreshIntervalHours: v.optional(v.number()),
    nextCheckAt: v.optional(v.number()),
    lastChangedAt: v.optional(v.number()),
    contentHash: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("unavailable"),
      v.literal("superseded"),
    ),
  })
    .index("by_external_id", ["externalId"])
    .index("by_url", ["url"])
    .index("by_source_type", ["sourceType"])
    .index("by_status_and_next_check_at", ["status", "nextCheckAt"]),

  claims: defineTable({
    candidateId: v.id("candidates"),
    raceId: v.id("races"),
    sourceId: v.optional(v.id("sources")),
    category: claimCategory,
    topic: v.string(),
    title: v.string(),
    detail: v.string(),
    evidenceStatus,
    claimDate: v.optional(v.number()),
    sortOrder: v.number(),
    lastReviewedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_candidate_and_category", ["candidateId", "category"])
    .index("by_race_and_category", ["raceId", "category"])
    .index("by_source", ["sourceId"])
    .index("by_last_reviewed_at", ["lastReviewedAt"]),

  officeTerms: defineTable({
    candidateId: v.id("candidates"),
    sourceId: v.optional(v.id("sources")),
    officeTitle: v.string(),
    jurisdiction: v.string(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    current: v.boolean(),
    evidenceStatus,
    lastReviewedAt: v.number(),
  }).index("by_candidate_and_started_at", ["candidateId", "startedAt"]),

  endorsements: defineTable({
    candidateId: v.id("candidates"),
    raceId: v.id("races"),
    sourceId: v.optional(v.id("sources")),
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
    announcedAt: v.optional(v.number()),
    evidenceStatus,
    lastReviewedAt: v.number(),
  })
    .index("by_candidate_and_announced_at", ["candidateId", "announcedAt"])
    .index("by_race_and_announced_at", ["raceId", "announcedAt"]),

  financeReports: defineTable({
    candidateId: v.id("candidates"),
    raceId: v.id("races"),
    sourceId: v.optional(v.id("sources")),
    coverageStart: v.optional(v.number()),
    coverageEnd: v.optional(v.number()),
    reportingPeriodLabel: v.string(),
    raised: v.optional(v.number()),
    spent: v.optional(v.number()),
    cashOnHand: v.optional(v.number()),
    asOfDate: v.number(),
    lastReviewedAt: v.number(),
  })
    .index("by_candidate_and_as_of_date", ["candidateId", "asOfDate"])
    .index("by_race_and_as_of_date", ["raceId", "asOfDate"]),

  sourceRefreshes: defineTable({
    resourceKey: v.string(),
    sourceType,
    status: v.union(
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(),
    error: v.optional(v.string()),
  })
    .index("by_resource_and_status", ["resourceKey", "status"])
    .index("by_expires_at", ["expiresAt"]),

  sourceSnapshots: defineTable({
    sourceId: v.id("sources"),
    url: v.string(),
    contentHash: v.string(),
    excerpt: v.string(),
    fetchedAt: v.number(),
    httpStatus: v.number(),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    changeState: v.union(
      v.literal("baseline"),
      v.literal("unchanged"),
      v.literal("changed"),
    ),
    reviewStatus: v.union(
      v.literal("not-needed"),
      v.literal("queued"),
      v.literal("reviewed"),
      v.literal("ignored"),
    ),
    reviewNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_source_and_fetched_at", ["sourceId", "fetchedAt"])
    .index("by_review_status_and_fetched_at", [
      "reviewStatus",
      "fetchedAt",
    ]),

  claimDrafts: defineTable({
    candidateId: v.id("candidates"),
    raceId: v.id("races"),
    sourceId: v.optional(v.id("sources")),
    sourceSnapshotId: v.optional(v.id("sourceSnapshots")),
    replacesClaimId: v.optional(v.id("claims")),
    category: claimCategory,
    topic: v.string(),
    title: v.string(),
    detail: v.string(),
    evidenceStatus,
    claimDate: v.optional(v.number()),
    sortOrder: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("needs-review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("published"),
    ),
    reviewNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    publishedClaimId: v.optional(v.id("claims")),
  })
    .index("by_status_and_updated_at", ["status", "updatedAt"])
    .index("by_candidate_and_status", ["candidateId", "status"])
    .index("by_source_snapshot", ["sourceSnapshotId"]),

  reviewEvents: defineTable({
    sourceSnapshotId: v.optional(v.id("sourceSnapshots")),
    claimDraftId: v.optional(v.id("claimDrafts")),
    action: v.union(
      v.literal("source-change-queued"),
      v.literal("source-change-reviewed"),
      v.literal("source-change-ignored"),
      v.literal("draft-created"),
      v.literal("draft-submitted"),
      v.literal("draft-approved"),
      v.literal("draft-rejected"),
      v.literal("draft-published"),
    ),
    actor: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_source_snapshot", ["sourceSnapshotId"])
    .index("by_claim_draft", ["claimDraftId"]),
});
