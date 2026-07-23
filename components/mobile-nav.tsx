import Link from "next/link";
import { House, ListChecks, Scale } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/ballot?zip=11557", label: "Ballot", icon: ListChecks },
  { href: "/race/ny-04", label: "Compare", icon: Scale },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
