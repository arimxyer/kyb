import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "Know Your Ballot",
    template: "%s · Know Your Ballot",
  },
  description:
    "A nonpartisan, evidence-first guide to the candidates and choices on your ballot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="pb-20 md:pb-0">
        <ConvexClientProvider>
          <SiteHeader />
          {children}
          <footer className="border-t border-border bg-card">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs leading-5 text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
              <p>
                Know Your Ballot is a nonpartisan prototype. Verify final ballot
                details with your election authority.
              </p>
              <p>No candidate ranking. No opaque trust score.</p>
            </div>
          </footer>
          <MobileNav />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
