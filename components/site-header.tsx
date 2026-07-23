import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Know Your Ballot
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Evidence before opinion
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          <Link
            href="/ballot?zip=11557"
            className={buttonVariants({ variant: "ghost" })}
          >
            My ballot
          </Link>
          <Link
            href="/race/ny-04"
            className={buttonVariants({ variant: "ghost" })}
          >
            Compare candidates
          </Link>
          <a
            href="https://www.nassaucountyny.gov/566/Board-of-Elections"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ShieldCheck data-icon="inline-start" aria-hidden="true" />
            Official election info
          </a>
        </nav>

        <Link
          href="/ballot?zip=11557"
          className={cn(buttonVariants(), "md:hidden")}
        >
          View ballot
        </Link>
      </div>
    </header>
  );
}
