import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CandidateSummary } from "@/lib/voter-types";

type CandidateCardProps = {
  candidate: CandidateSummary;
  compact?: boolean;
};

export function CandidateCard({
  candidate,
  compact = false,
}: CandidateCardProps) {
  const averageCoverage = Math.round(
    (candidate.coverage.profile +
      candidate.coverage.agenda +
      candidate.coverage.record +
      candidate.coverage.funding) /
      4,
  );

  return (
    <Card className="h-full border-border/90 shadow-sm">
      <CardHeader className={compact ? "gap-3" : "gap-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {candidate.initials}
            </div>
            <div>
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate.party}
                {candidate.incumbent ? " · Incumbent" : " · Challenger"}
              </p>
            </div>
          </div>
          {averageCoverage >= 70 ? (
            <Badge
              variant="outline"
              className="border-teal-700/20 bg-teal-50 text-teal-900"
            >
              <BadgeCheck data-icon="inline-start" aria-hidden="true" />
              {averageCoverage}% sourced
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-700/20 bg-amber-50 text-amber-950"
            >
              <CircleAlert data-icon="inline-start" aria-hidden="true" />
              {averageCoverage}% sourced
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Current or most recent role
          </p>
          <p className="mt-1 text-sm font-medium">{candidate.role}</p>
        </div>
        {!compact && (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              {candidate.summary}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.ballotLines.map((line) => (
                <Badge key={line} variant="secondary">
                  {line}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Link
          href={`/candidate/${candidate.slug}`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full justify-between",
          })}
        >
          View evidence profile
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
