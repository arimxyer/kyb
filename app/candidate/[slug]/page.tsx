import type { Metadata } from "next";

import { CandidateProfileClient } from "@/app/candidate/[slug]/candidate-profile-client";

type CandidatePageProps = {
  params: Promise<{ slug: string }>;
};

const candidateNames: Record<string, string> = {
  "laura-gillen": "Laura A. Gillen",
  "jeanine-driscoll": "Jeanine C. Driscoll",
  "blay-tarnoff": "Blay Tarnoff",
};

export async function generateMetadata({
  params,
}: CandidatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = candidateNames[slug] ?? "Candidate profile";

  return {
    title: name,
    description: `Review ${name}’s agenda, public record, campaign finance, support, and source coverage.`,
  };
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { slug } = await params;
  return <CandidateProfileClient slug={slug} />;
}
