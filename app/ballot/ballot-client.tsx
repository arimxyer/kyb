"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Info,
  MapPin,
} from "lucide-react";

import { CandidateCard } from "@/components/candidate-card";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import {
  formatDate,
  formatMonthDayRange,
} from "@/lib/voter-types";

export function BallotClient({ zip }: { zip?: string }) {
  const data = useQuery(api.ballot.getRace, { raceSlug: "ny-04" });

  if (data === undefined) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full border-border/90 shadow-sm">
          <CardHeader>
            <CardTitle>Ballot data is being prepared</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              The location matched, but the NY-04 candidate dataset has not
              finished loading. Please check again shortly.
            </p>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Return home
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { election, race, candidates } = data;
  const pilotZip = zip || election.pilotZip || "11557";

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
                Pilot location matched
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Your 2026 ballot
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                ZIP {pilotZip} · Hewlett, {election.county || "Nassau County"},
                New York
              </p>
            </div>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline" })}
            >
              Change location
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>{election.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Election Day · {formatDate(election.electionDate)}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Early voting:{" "}
                {formatMonthDayRange(
                  election.earlyVotingStart,
                  election.earlyVotingEnd,
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Info className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Prototype coverage</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Federal race first; full local ballot coming later
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Candidate list checked {formatDate(election.lastReviewedAt)}.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Federal office
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {race.office} · {race.districtCode}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {race.districtLabel} · {candidates.length} candidates listed
              </p>
            </div>
            <Link href="/race/ny-04" className={buttonVariants()}>
              Compare all candidates
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.slug} candidate={candidate} />
            ))}
          </div>

          {election.candidateSource && (
            <div className="mt-5 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Ballot status can change. Candidate lines are based on the
                county’s published list and should be verified before voting.
              </p>
              <SourceLink source={election.candidateSource} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
