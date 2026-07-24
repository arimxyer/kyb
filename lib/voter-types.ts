import type { FunctionReturnType } from "convex/server";

import type { api } from "@/convex/_generated/api";

export type BallotData = NonNullable<
  FunctionReturnType<typeof api.ballot.getRace>
>;

export type RaceComparisonData = NonNullable<
  FunctionReturnType<typeof api.ballot.getRaceComparison>
>;

export type CandidatePageData = NonNullable<
  FunctionReturnType<typeof api.ballot.getCandidate>
>;

export type CandidateSummary = BallotData["candidates"][number];
export type Candidate = CandidatePageData["candidate"];
export type EvidenceItem = Candidate["record"][number];
export type EvidenceStatus = EvidenceItem["status"];
export type Source = NonNullable<EvidenceItem["source"]>;

export function formatCurrency(value: number | null) {
  if (value === null) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(value);
}

export function formatMonthDayRange(start: number | null, end: number | null) {
  if (start === null || end === null) return "Dates pending confirmation";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
