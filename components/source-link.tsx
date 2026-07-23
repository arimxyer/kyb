import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Source } from "@/lib/voter-data";

type SourceLinkProps = {
  source: Source;
  compact?: boolean;
};

export function SourceLink({ source, compact = false }: SourceLinkProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {!compact && (
        <Badge variant="outline" className="shrink-0 capitalize">
          {source.sourceType}
        </Badge>
      )}
      <span className="truncate">{source.publisher}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
    </a>
  );
}
