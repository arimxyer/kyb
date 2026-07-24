import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

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

const freshnessState = v.union(
  v.literal("current"),
  v.literal("due-soon"),
  v.literal("overdue"),
);

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

function sourceNextCheckAt(source: Doc<"sources">): number {
  const interval =
    source.refreshIntervalHours ??
    defaultRefreshIntervalHours(source.sourceType);
  return source.nextCheckAt ?? source.checkedAt + interval * 60 * 60 * 1000;
}

function getFreshnessState(
  nextCheckAt: number,
  now: number,
): "current" | "due-soon" | "overdue" {
  if (nextCheckAt <= now) return "overdue";
  if (nextCheckAt <= now + 24 * 60 * 60 * 1000) return "due-soon";
  return "current";
}

export const getResearchStatus = query({
  args: { now: v.number() },
  returns: v.object({
    generatedAt: v.number(),
    counts: v.object({
      trackedSources: v.number(),
      publishedClaims: v.number(),
      queuedChanges: v.number(),
      draftsNeedingReview: v.number(),
      overdueSources: v.number(),
    }),
    sources: v.array(
      v.object({
        id: v.id("sources"),
        title: v.string(),
        publisher: v.string(),
        url: v.string(),
        sourceType,
        isPrimary: v.boolean(),
        checkedAt: v.number(),
        nextCheckAt: v.number(),
        lastChangedAt: v.union(v.number(), v.null()),
        freshnessState,
        ingestionState: v.union(
          v.literal("awaiting-baseline"),
          v.literal("tracked"),
        ),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const [
      sources,
      publishedClaims,
      queuedChanges,
      draftRows,
      needsReviewRows,
      approvedRows,
    ] = await Promise.all([
      ctx.db
        .query("sources")
        .withIndex("by_status_and_next_check_at", (q) =>
          q.eq("status", "active"),
        )
        .take(100),
      ctx.db
        .query("claims")
        .withIndex("by_last_reviewed_at")
        .order("desc")
        .take(250),
      ctx.db
        .query("sourceSnapshots")
        .withIndex("by_review_status_and_fetched_at", (q) =>
          q.eq("reviewStatus", "queued"),
        )
        .take(100),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "draft"),
        )
        .take(100),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "needs-review"),
        )
        .take(100),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "approved"),
        )
        .take(100),
    ]);

    const sourceRows = sources
      .map((source) => {
        const nextCheckAt = sourceNextCheckAt(source);
        return {
          id: source._id,
          title: source.title,
          publisher: source.publisher,
          url: source.url,
          sourceType: source.sourceType,
          isPrimary: source.isPrimary,
          checkedAt: source.checkedAt,
          nextCheckAt,
          lastChangedAt: source.lastChangedAt ?? null,
          freshnessState: getFreshnessState(
            nextCheckAt,
            args.now,
          ),
          ingestionState: source.contentHash
            ? ("tracked" as const)
            : ("awaiting-baseline" as const),
        };
      })
      .sort((a, b) => a.nextCheckAt - b.nextCheckAt);

    return {
      generatedAt: args.now,
      counts: {
        trackedSources: sourceRows.length,
        publishedClaims: publishedClaims.length,
        queuedChanges: queuedChanges.length,
        draftsNeedingReview:
          draftRows.length + needsReviewRows.length + approvedRows.length,
        overdueSources: sourceRows.filter(
          (source) => source.freshnessState === "overdue",
        ).length,
      },
      sources: sourceRows,
    };
  },
});

export const getReviewQueue = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    sourceChanges: v.array(
      v.object({
        id: v.id("sourceSnapshots"),
        sourceId: v.id("sources"),
        sourceTitle: v.string(),
        publisher: v.string(),
        url: v.string(),
        contentHash: v.string(),
        excerpt: v.string(),
        fetchedAt: v.number(),
        httpStatus: v.number(),
      }),
    ),
    claimDrafts: v.array(
      v.object({
        id: v.id("claimDrafts"),
        candidateId: v.id("candidates"),
        candidateName: v.string(),
        sourceId: v.union(v.id("sources"), v.null()),
        category: claimCategory,
        topic: v.string(),
        title: v.string(),
        detail: v.string(),
        evidenceStatus,
        status: v.union(
          v.literal("draft"),
          v.literal("needs-review"),
          v.literal("approved"),
        ),
        updatedAt: v.number(),
        reviewNotes: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
    const [snapshots, drafts, needsReview, approved] = await Promise.all([
      ctx.db
        .query("sourceSnapshots")
        .withIndex("by_review_status_and_fetched_at", (q) =>
          q.eq("reviewStatus", "queued"),
        )
        .order("desc")
        .take(limit),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "draft"),
        )
        .order("desc")
        .take(limit),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "needs-review"),
        )
        .order("desc")
        .take(limit),
      ctx.db
        .query("claimDrafts")
        .withIndex("by_status_and_updated_at", (q) =>
          q.eq("status", "approved"),
        )
        .order("desc")
        .take(limit),
    ]);

    const sourceIds = new Set<Id<"sources">>();
    const candidateIds = new Set<Id<"candidates">>();
    for (const snapshot of snapshots) sourceIds.add(snapshot.sourceId);
    for (const draft of [...drafts, ...needsReview, ...approved]) {
      candidateIds.add(draft.candidateId);
      if (draft.sourceId) sourceIds.add(draft.sourceId);
    }

    const [sources, candidates] = await Promise.all([
      Promise.all(
        [...sourceIds].map(async (id) => [id, await ctx.db.get(id)] as const),
      ),
      Promise.all(
        [...candidateIds].map(
          async (id) => [id, await ctx.db.get(id)] as const,
        ),
      ),
    ]);
    const sourceMap = new Map(
      sources
        .filter((entry): entry is readonly [Id<"sources">, Doc<"sources">] =>
          Boolean(entry[1]),
        )
        .map(([id, source]) => [id, source]),
    );
    const candidateMap = new Map(
      candidates
        .filter(
          (entry): entry is readonly [
            Id<"candidates">,
            Doc<"candidates">,
          ] => Boolean(entry[1]),
        )
        .map(([id, candidate]) => [id, candidate]),
    );

    return {
      sourceChanges: snapshots.flatMap((snapshot) => {
        const source = sourceMap.get(snapshot.sourceId);
        if (!source) return [];
        return [
          {
            id: snapshot._id,
            sourceId: source._id,
            sourceTitle: source.title,
            publisher: source.publisher,
            url: snapshot.url,
            contentHash: snapshot.contentHash,
            excerpt: snapshot.excerpt,
            fetchedAt: snapshot.fetchedAt,
            httpStatus: snapshot.httpStatus,
          },
        ];
      }),
      claimDrafts: [...drafts, ...needsReview, ...approved]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit)
        .flatMap((draft) => {
          const candidate = candidateMap.get(draft.candidateId);
          if (!candidate) return [];
          return [
            {
              id: draft._id,
              candidateId: candidate._id,
              candidateName: candidate.name,
              sourceId: draft.sourceId ?? null,
              category: draft.category,
              topic: draft.topic,
              title: draft.title,
              detail: draft.detail,
              evidenceStatus: draft.evidenceStatus,
              status: draft.status as
                | "draft"
                | "needs-review"
                | "approved",
              updatedAt: draft.updatedAt,
              reviewNotes: draft.reviewNotes ?? null,
            },
          ];
        }),
    };
  },
});

export const createClaimDraft = internalMutation({
  args: {
    candidateId: v.id("candidates"),
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
    actor: v.string(),
  },
  returns: v.id("claimDrafts"),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const title = args.title.trim();
    const topic = args.topic.trim();
    const detail = args.detail.trim();
    if (!title || !topic || !detail) {
      throw new Error("Topic, title, and detail are required");
    }

    const suppliedSource = args.sourceId
      ? await ctx.db.get(args.sourceId)
      : null;
    if (args.sourceId && !suppliedSource) throw new Error("Source not found");

    const snapshot = args.sourceSnapshotId
      ? await ctx.db.get(args.sourceSnapshotId)
      : null;
    if (args.sourceSnapshotId && !snapshot) {
      throw new Error("Source snapshot not found");
    }
    if (
      suppliedSource &&
      snapshot &&
      snapshot.sourceId !== suppliedSource._id
    ) {
      throw new Error("Source snapshot does not match the selected source");
    }
    const sourceId = suppliedSource?._id ?? snapshot?.sourceId;

    if (args.replacesClaimId) {
      const existingClaim = await ctx.db.get(args.replacesClaimId);
      if (
        !existingClaim ||
        existingClaim.candidateId !== candidate._id
      ) {
        throw new Error("Replacement claim does not match the candidate");
      }
    }

    const now = Date.now();
    const draftId = await ctx.db.insert("claimDrafts", {
      candidateId: candidate._id,
      raceId: candidate.raceId,
      ...(sourceId ? { sourceId } : {}),
      ...(args.sourceSnapshotId
        ? { sourceSnapshotId: args.sourceSnapshotId }
        : {}),
      ...(args.replacesClaimId
        ? { replacesClaimId: args.replacesClaimId }
        : {}),
      category: args.category,
      topic,
      title,
      detail,
      evidenceStatus: args.evidenceStatus,
      ...(args.claimDate ? { claimDate: args.claimDate } : {}),
      sortOrder: args.sortOrder,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("reviewEvents", {
      claimDraftId: draftId,
      action: "draft-created",
      actor: args.actor.trim() || "editor",
      createdAt: now,
    });

    return draftId;
  },
});

export const submitClaimDraft = internalMutation({
  args: {
    draftId: v.id("claimDrafts"),
    actor: v.string(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status !== "draft") {
      throw new Error("Only draft claims can be submitted for review");
    }
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      status: "needs-review",
      updatedAt: now,
      ...(args.note ? { reviewNotes: args.note.trim() } : {}),
    });
    await ctx.db.insert("reviewEvents", {
      claimDraftId: draft._id,
      action: "draft-submitted",
      actor: args.actor.trim() || "editor",
      ...(args.note ? { note: args.note.trim() } : {}),
      createdAt: now,
    });
    return null;
  },
});

export const decideClaimDraft = internalMutation({
  args: {
    draftId: v.id("claimDrafts"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    actor: v.string(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status !== "needs-review") {
      throw new Error("Claim draft is not awaiting review");
    }

    const now = Date.now();
    const approved = args.decision === "approve";
    await ctx.db.patch(draft._id, {
      status: approved ? "approved" : "rejected",
      updatedAt: now,
      reviewedAt: now,
      ...(args.note ? { reviewNotes: args.note.trim() } : {}),
    });
    await ctx.db.insert("reviewEvents", {
      claimDraftId: draft._id,
      action: approved ? "draft-approved" : "draft-rejected",
      actor: args.actor.trim() || "reviewer",
      ...(args.note ? { note: args.note.trim() } : {}),
      createdAt: now,
    });
    return null;
  },
});

export const publishClaimDraft = internalMutation({
  args: {
    draftId: v.id("claimDrafts"),
    actor: v.string(),
  },
  returns: v.id("claims"),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status !== "approved") {
      throw new Error("Only approved claim drafts can be published");
    }

    const now = Date.now();
    let claimId: Id<"claims">;
    if (draft.replacesClaimId) {
      const existingClaim = await ctx.db.get(draft.replacesClaimId);
      if (
        !existingClaim ||
        existingClaim.candidateId !== draft.candidateId
      ) {
        throw new Error("Replacement claim is unavailable");
      }
      await ctx.db.patch(existingClaim._id, {
        ...(draft.sourceId ? { sourceId: draft.sourceId } : {}),
        category: draft.category,
        topic: draft.topic,
        title: draft.title,
        detail: draft.detail,
        evidenceStatus: draft.evidenceStatus,
        ...(draft.claimDate ? { claimDate: draft.claimDate } : {}),
        sortOrder: draft.sortOrder,
        lastReviewedAt: now,
      });
      claimId = existingClaim._id;
    } else {
      claimId = await ctx.db.insert("claims", {
        candidateId: draft.candidateId,
        raceId: draft.raceId,
        ...(draft.sourceId ? { sourceId: draft.sourceId } : {}),
        category: draft.category,
        topic: draft.topic,
        title: draft.title,
        detail: draft.detail,
        evidenceStatus: draft.evidenceStatus,
        ...(draft.claimDate ? { claimDate: draft.claimDate } : {}),
        sortOrder: draft.sortOrder,
        lastReviewedAt: now,
      });
    }

    await ctx.db.patch(draft._id, {
      status: "published",
      updatedAt: now,
      publishedAt: now,
      publishedClaimId: claimId,
    });
    await ctx.db.insert("reviewEvents", {
      claimDraftId: draft._id,
      action: "draft-published",
      actor: args.actor.trim() || "publisher",
      createdAt: now,
    });
    await ctx.db.patch(draft.candidateId, { lastReviewedAt: now });

    return claimId;
  },
});

export const decideSourceChange = internalMutation({
  args: {
    snapshotId: v.id("sourceSnapshots"),
    decision: v.union(v.literal("reviewed"), v.literal("ignored")),
    actor: v.string(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot || snapshot.reviewStatus !== "queued") {
      throw new Error("Source change is not awaiting review");
    }

    const now = Date.now();
    await ctx.db.patch(snapshot._id, {
      reviewStatus: args.decision,
      reviewedAt: now,
      ...(args.note ? { reviewNotes: args.note.trim() } : {}),
    });
    await ctx.db.insert("reviewEvents", {
      sourceSnapshotId: snapshot._id,
      action:
        args.decision === "reviewed"
          ? "source-change-reviewed"
          : "source-change-ignored",
      actor: args.actor.trim() || "reviewer",
      ...(args.note ? { note: args.note.trim() } : {}),
      createdAt: now,
    });
    return null;
  },
});
