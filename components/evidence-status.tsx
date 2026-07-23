import {
  AlertCircle,
  BadgeCheck,
  CircleDashed,
  Megaphone,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EvidenceStatus } from "@/lib/voter-data";

const statusContent: Record<
  EvidenceStatus,
  { label: string; icon: typeof BadgeCheck; className: string }
> = {
  verified: {
    label: "Verified record",
    icon: BadgeCheck,
    className:
      "border-teal-700/20 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100",
  },
  "candidate-statement": {
    label: "Candidate statement",
    icon: Megaphone,
    className:
      "border-amber-700/20 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  },
  "partisan-source": {
    label: "Partisan source",
    icon: Users,
    className:
      "border-violet-700/20 bg-violet-50 text-violet-950 dark:bg-violet-950 dark:text-violet-100",
  },
  "needs-review": {
    label: "Needs review",
    icon: CircleDashed,
    className:
      "border-slate-700/20 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100",
  },
  "not-found": {
    label: "Evidence not found",
    icon: AlertCircle,
    className:
      "border-rose-700/20 bg-rose-50 text-rose-950 dark:bg-rose-950 dark:text-rose-100",
  },
};

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const content = statusContent[status];
  const Icon = content.icon;

  return (
    <Badge variant="outline" className={content.className}>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {content.label}
    </Badge>
  );
}
