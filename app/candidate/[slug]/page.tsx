import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  CircleCheckBig,
  Landmark,
  Megaphone,
  ScanSearch,
  Users,
} from "lucide-react";

import { CoverageMeter } from "@/components/coverage-meter";
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
  formatCurrency,
  getCandidate,
  getSource,
  type EvidenceItem,
} from "@/lib/voter-data";

type CandidatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return candidates.map((candidate) => ({ slug: candidate.slug }));
}

export async function generateMetadata({
  params,
}: CandidatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const candidate = getCandidate(slug);

  if (!candidate) return {};

  return {
    title: candidate.name,
    description: `Review ${candidate.name}’s agenda, public record, campaign finance, support, and source coverage.`,
  };
}

function EvidenceList({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="space-y-5">
      {items.map((item) => {
        const source = getSource(item.sourceId);
        return (
          <article
            key={item.title}
            className="border-t border-border pt-5 first:border-0 first:pt-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold">{item.title}</h3>
              <EvidenceStatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.detail}
            </p>
            {source && (
              <div className="mt-3">
                <SourceLink source={source} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { slug } = await params;
  const candidate = getCandidate(slug);

  if (!candidate) notFound();

  const financeSource = getSource(candidate.finance.sourceId);

  return (
    <main>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <Link
            href="/race/ny-04"
            className={buttonVariants({
              variant: "ghost",
              className: "-ml-2",
            })}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Back to comparison
          </Link>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                {candidate.initials}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {candidate.name}
                  </h1>
                  {candidate.incumbent && (
                    <Badge variant="secondary">Incumbent</Badge>
                  )}
                </div>
                <p className="mt-2 text-base text-muted-foreground">
                  {candidate.party} · {candidate.role}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.ballotLines.map((line) => (
                    <Badge key={line} variant="outline">
                      Ballot line: {line}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <CircleCheckBig className="size-4" aria-hidden="true" />
                Evidence profile
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sources checked July 23, 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
        <div className="space-y-8">
          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <Landmark className="size-5 text-primary" aria-hidden="true" />
              <CardTitle>Profile summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-muted-foreground">
                {candidate.summary}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <Megaphone className="size-5 text-primary" aria-hidden="true" />
              <div>
                <CardTitle>Agenda and platform</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  What the candidate says they would prioritize
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {candidate.agenda.map((item) => {
                const source = getSource(item.sourceId);
                return (
                  <article
                    key={item.topic}
                    className="border-t border-border pt-5 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
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

          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <BriefcaseBusiness
                className="size-5 text-primary"
                aria-hidden="true"
              />
              <div>
                <CardTitle>Public record and experience</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Offices held and work that can be sourced
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <EvidenceList items={candidate.record} />
            </CardContent>
          </Card>

          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <Users className="size-5 text-primary" aria-hidden="true" />
              <div>
                <CardTitle>Support and endorsements</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Who is publicly backing the campaign
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <EvidenceList items={candidate.support} />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/[0.025] shadow-sm">
            <CardHeader className="flex-row items-center gap-3">
              <ScanSearch className="size-5 text-primary" aria-hidden="true" />
              <div>
                <CardTitle>Statements versus actions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  An evidence ledger—not a trustworthiness score
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <EvidenceList items={candidate.statementsVsActions} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/90 shadow-sm">
            <CardHeader>
              <CardTitle>Source coverage</CardTitle>
              <p className="text-xs leading-5 text-muted-foreground">
                Coverage measures research completeness, not candidate quality.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <CoverageMeter label="Profile" value={candidate.coverage.profile} />
              <CoverageMeter label="Agenda" value={candidate.coverage.agenda} />
              <CoverageMeter label="Record" value={candidate.coverage.record} />
              <CoverageMeter label="Funding" value={candidate.coverage.funding} />
            </CardContent>
          </Card>

          <Card className="border-border/90 shadow-sm">
            <CardHeader className="flex-row items-center gap-2">
              <BadgeDollarSign
                className="size-5 text-primary"
                aria-hidden="true"
              />
              <CardTitle>Campaign finance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Receipts</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(candidate.finance.raised)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(candidate.finance.spent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cash on hand</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatCurrency(candidate.finance.cashOnHand)}
                  </p>
                </div>
              </div>
              <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                {candidate.finance.coverage}
              </p>
              {financeSource && <SourceLink source={financeSource} />}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
