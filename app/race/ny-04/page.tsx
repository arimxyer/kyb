import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  Landmark,
  ListChecks,
  ShieldQuestion,
} from "lucide-react";

import { EvidenceExplorer } from "@/components/evidence-explorer";
import { EvidenceStatusBadge } from "@/components/evidence-status";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  candidates,
  election,
  formatCurrency,
  getSource,
} from "@/lib/voter-data";

export const metadata: Metadata = {
  title: "Compare NY-04 Candidates",
  description:
    "Compare the 2026 NY-04 candidates by agenda, experience, funding, and evidence coverage.",
};

export default function RaceComparisonPage() {
  return (
    <main>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/ballot?zip=11557"
            className={buttonVariants({
              variant: "ghost",
              className: "-ml-2",
            })}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Back to ballot
          </Link>
          <div className="mt-5 max-w-3xl">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary"
            >
              Side-by-side evidence
            </Badge>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Compare candidates for U.S. House
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {election.district} · {election.name}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section aria-labelledby="candidate-summary-heading">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-primary" aria-hidden="true" />
            <h2
              id="candidate-summary-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Field at a glance
            </h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Card
                key={candidate.slug}
                className="border-border/90 shadow-sm"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {candidate.initials}
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {candidate.name}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.party}
                        {candidate.incumbent ? " · Incumbent" : ""}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {candidate.summary}
                  </p>
                  <Link
                    href={`/candidate/${candidate.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full",
                    })}
                  >
                    Open full profile
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="agenda-heading">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-primary" aria-hidden="true" />
            <h2 id="agenda-heading" className="text-xl font-semibold tracking-tight">
              Agenda and stated priorities
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            These are sourced descriptions, not endorsements. Candidate
            statements remain labeled as candidate statements.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Card key={candidate.slug} className="border-border/90 shadow-sm">
                <CardHeader>
                  <CardTitle>{candidate.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {candidate.agenda.map((item) => {
                    const source = getSource(item.sourceId);
                    return (
                      <article
                        key={`${candidate.slug}-${item.topic}`}
                        className="border-t border-border pt-4 first:border-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{item.topic}</h3>
                          <EvidenceStatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.position}
                        </p>
                        {source && (
                          <div className="mt-3">
                            <SourceLink source={source} />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="finance-heading">
          <div className="flex items-center gap-2">
            <CircleDollarSign
              className="size-5 text-primary"
              aria-hidden="true"
            />
            <h2
              id="finance-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Campaign-finance snapshots
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Reporting windows differ. Totals are shown with their coverage
            period rather than treated as a direct measure of support.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {candidates.map((candidate) => {
              const source = getSource(candidate.finance.sourceId);
              return (
                <Card
                  key={candidate.slug}
                  className="border-border/90 shadow-sm"
                >
                  <CardHeader>
                    <CardTitle>{candidate.name}</CardTitle>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {candidate.finance.coverage}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      ["Receipts", candidate.finance.raised],
                      ["Disbursements", candidate.finance.spent],
                      ["Cash on hand", candidate.finance.cashOnHand],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="flex items-baseline justify-between gap-4 border-t border-border pt-3 first:border-0 first:pt-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {label as string}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(value as number | null)}
                        </span>
                      </div>
                    ))}
                    {source ? (
                      <div className="pt-2">
                        <SourceLink source={source} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                        <ShieldQuestion className="size-4" aria-hidden="true" />
                        No comparable filing captured
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <EvidenceExplorer />
      </div>
    </main>
  );
}
