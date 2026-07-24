import type { Metadata } from "next";

import { RaceComparisonClient } from "@/app/race/ny-04/race-comparison-client";

export const metadata: Metadata = {
  title: "Compare NY-04 Candidates",
  description:
    "Compare the 2026 NY-04 candidates by agenda, experience, funding, and evidence coverage.",
};

export default function RaceComparisonPage() {
  return <RaceComparisonClient />;
}
