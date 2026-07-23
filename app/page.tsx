import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CircleDollarSign,
  Files,
  Scale,
  SearchCheck,
} from "lucide-react";

import { LocationLookup } from "@/components/location-lookup";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const principles = [
  {
    icon: Files,
    title: "Every claim keeps its source",
    description:
      "Government records, campaign statements, and partisan sources are labeled differently so context is never flattened.",
  },
  {
    icon: Scale,
    title: "Compare without a horse-race score",
    description:
      "See agendas, experience, funding, and evidence gaps side by side—without a black-box candidate ranking.",
  },
  {
    icon: SearchCheck,
    title: "Missing evidence stays visible",
    description:
      "When a record has not been verified or a primary source is unavailable, the product says so plainly.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-primary)_0,transparent_36%)] opacity-[0.08]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary"
            >
              <BadgeCheck data-icon="inline-start" aria-hidden="true" />
              2026 Nassau County pilot
            </Badge>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Know who you’re voting for.
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">
              Find your ballot, compare the people asking for your vote, and
              trace important claims back to their evidence.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 border-y border-border py-4 text-sm">
              <div>
                <p className="text-2xl font-semibold tracking-tight">3</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  NY-04 candidates
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">11</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  primary sources
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">0</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  opaque scores
                </p>
              </div>
            </div>
          </div>

          <LocationLookup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Designed for informed decisions
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            A research desk that fits in your pocket.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Election research is usually scattered across campaign sites,
            government databases, news coverage, and filings. This prototype
            turns those fragments into one evidence-led voter flow.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/90 shadow-sm">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-2 text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">
              Start with the NY-04 pilot
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              The prototype uses ZIP 11557 to demonstrate the full path from a
              location to a real congressional race and candidate evidence
              profiles.
            </p>
            <Link
              href="/ballot?zip=11557"
              className={buttonVariants({
                size: "lg",
                className: "mt-6",
              })}
            >
              Open the pilot ballot
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>

          <ol className="grid gap-3">
            {[
              ["01", "Locate your ballot", "Address or current location determines your districts."],
              ["02", "Compare the field", "Scan platform, public record, funding, and support."],
              ["03", "Inspect the evidence", "Open every source and see what remains unresolved."],
            ].map(([number, title, description]) => (
              <li
                key={number}
                className="grid grid-cols-[auto_1fr] gap-4 rounded-xl border border-border bg-background p-4"
              >
                <span className="font-mono text-xs font-semibold text-primary">
                  {number}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold">Funding deserves context.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Finance totals show their reporting window and source, so a
              number is never presented as a free-floating verdict.
            </p>
          </div>
        </div>
        <Link
          href="/race/ny-04"
          className={buttonVariants({ variant: "outline" })}
        >
          Compare funding
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
