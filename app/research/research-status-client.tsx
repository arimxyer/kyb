"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileCheck2,
  Files,
  GitCompareArrows,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { ResearchStatusData } from "@/lib/voter-types";
import { cn } from "@/lib/utils";

type Filter = "all" | "due" | "primary";

const filterOptions: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "due", label: "Needs refresh" },
  { value: "primary", label: "Primary only" },
];

function roundedCurrentHour() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.getTime();
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(value);
}

function sourceTypeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FreshnessBadge({
  state,
}: {
  state: ResearchStatusData["sources"][number]["freshnessState"];
}) {
  if (state === "overdue") {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  if (state === "due-soon") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/50 bg-amber-50 text-amber-900"
      >
        Due soon
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-emerald-100 text-emerald-900"
    >
      Current
    </Badge>
  );
}

function ResearchStatusLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-6 w-full max-w-3xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-10 h-96 rounded-xl" />
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  emphasis,
}: {
  icon: typeof Files;
  label: string;
  value: number;
  detail: string;
  emphasis?: boolean;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm",
        emphasis && "ring-2 ring-amber-500/40",
      )}
    >
      <CardHeader className="grid grid-cols-[1fr_auto] items-start">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
            emphasis && "bg-amber-100 text-amber-900",
          )}
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function ResearchStatusClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const now = useMemo(() => roundedCurrentHour(), []);
  const status = useQuery(api.review.getResearchStatus, { now });

  const filteredSources = useMemo(() => {
    if (!status) return [];
    if (filter === "due") {
      return status.sources.filter(
        (source) => source.freshnessState !== "current",
      );
    }
    if (filter === "primary") {
      return status.sources.filter((source) => source.isPrimary);
    }
    return status.sources;
  }, [filter, status]);

  if (status === undefined) return <ResearchStatusLoading />;

  return (
    <main>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            <DatabaseZap data-icon="inline-start" aria-hidden="true" />
            Research operations
          </Badge>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Every update passes through evidence review.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Source pages are checked for changes, normalized into draft
                claims, reviewed, and only then published to candidate profiles.
                Nothing in the ingestion pipeline publishes automatically.
              </p>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Status generated {formatTimestamp(status.generatedAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section
          aria-label="Research status summary"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            icon={Files}
            label="Tracked sources"
            value={status.counts.trackedSources}
            detail="Official records, filings, campaign pages, and contextual sources."
          />
          <MetricCard
            icon={FileCheck2}
            label="Published claims"
            value={status.counts.publishedClaims}
            detail="Claims currently visible across candidate and comparison pages."
          />
          <MetricCard
            icon={GitCompareArrows}
            label="Changes queued"
            value={status.counts.queuedChanges}
            detail="Detected source changes waiting for editorial review."
          />
          <MetricCard
            icon={Clock3}
            label="Refresh overdue"
            value={status.counts.overdueSources}
            detail="Sources whose next scheduled check is due."
            emphasis={status.counts.overdueSources > 0}
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: DatabaseZap,
              number: "01",
              title: "Capture",
              detail:
                "Store a bounded snapshot, content fingerprint, retrieval time, and response status.",
            },
            {
              icon: GitCompareArrows,
              number: "02",
              title: "Review",
              detail:
                "Changed sources enter a private queue. Draft claims preserve their source and audit history.",
            },
            {
              icon: ShieldCheck,
              number: "03",
              title: "Publish",
              detail:
                "Only an approved draft can update the evidence shown to voters.",
            },
          ].map(({ icon: Icon, number, title, detail }) => (
            <Card key={number} size="sm">
              <CardContent className="grid grid-cols-[auto_1fr] gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-primary">
                    {number}
                  </p>
                  <h2 className="mt-1 font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Source freshness
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Published source metadata only. Unpublished drafts and excerpts
                remain private.
              </p>
            </div>
            <div
              className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:w-auto"
              aria-label="Filter sources"
            >
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={filter === option.value ? "secondary" : "ghost"}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className="shrink-0"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredSources.length === 0 ? (
            <Card className="mt-5 border-dashed">
              <CardContent className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-7 text-primary" aria-hidden="true" />
                <p className="mt-3 font-semibold">
                  No sources match this filter.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The current research queue is clear.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mt-5 hidden overflow-hidden rounded-xl border border-border md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-muted/70 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Last checked</th>
                      <th className="px-4 py-3 font-medium">Next check</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredSources.map((source) => (
                      <tr key={source.id} className="align-top">
                        <td className="max-w-sm px-4 py-4">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-start gap-1 font-medium underline-offset-4 hover:text-primary hover:underline"
                          >
                            {source.title}
                            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          </a>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {source.publisher}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline">
                              {sourceTypeLabel(source.sourceType)}
                            </Badge>
                            {source.isPrimary ? (
                              <Badge variant="secondary">Primary</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatTimestamp(source.checkedAt)}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatTimestamp(source.nextCheckAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <FreshnessBadge state={source.freshnessState} />
                            {source.ingestionState === "awaiting-baseline" ? (
                              <span className="text-xs text-muted-foreground">
                                Baseline pending
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-3 md:hidden">
                {filteredSources.map((source) => (
                  <Card key={source.id} size="sm">
                    <CardHeader>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">
                          {sourceTypeLabel(source.sourceType)}
                        </Badge>
                        {source.isPrimary ? (
                          <Badge variant="secondary">Primary</Badge>
                        ) : null}
                        <FreshnessBadge state={source.freshnessState} />
                      </div>
                      <CardTitle className="pt-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-1 underline-offset-4 hover:text-primary hover:underline"
                        >
                          {source.title}
                          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      </CardTitle>
                      <CardDescription>{source.publisher}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Last checked</p>
                        <p className="mt-1 font-medium">
                          {formatTimestamp(source.checkedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next check</p>
                        <p className="mt-1 font-medium">
                          {formatTimestamp(source.nextCheckAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
