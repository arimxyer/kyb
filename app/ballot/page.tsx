import type { Metadata } from "next";

import { BallotClient } from "@/app/ballot/ballot-client";

export const metadata: Metadata = {
  title: "Your 2026 Ballot",
  description:
    "Explore the 2026 NY-04 congressional candidates in the ZIP 11557 pilot.",
};

type BallotPageProps = {
  searchParams: Promise<{ zip?: string }>;
};

export default async function BallotPage({ searchParams }: BallotPageProps) {
  const { zip } = await searchParams;
  return <BallotClient zip={zip} />;
}
