import type { Metadata } from "next";

import { ResearchStatusClient } from "@/app/research/research-status-client";

export const metadata: Metadata = {
  title: "Research status",
  description:
    "See how Know Your Ballot tracks source freshness, change detection, review, and publication.",
};

export default function ResearchStatusPage() {
  return <ResearchStatusClient />;
}

