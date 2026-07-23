"use client";

import { useState, type FormEvent } from "react";
import { Bot, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const suggestions = [
  "Who has held public office?",
  "How much has each campaign raised?",
  "Are statements matched to actions?",
];

function answerQuestion(question: string) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes("money") ||
    normalized.includes("fund") ||
    normalized.includes("raised")
  ) {
    return {
      title: "Campaign-finance snapshot",
      body: "FEC coverage through June 30, 2026 shows $5.10M in receipts for Laura Gillen and $264.8K for Jeanine Driscoll. No comparable FEC snapshot was captured for Blay Tarnoff in this pilot. Different coverage start dates matter, so the amounts should not be treated as a perfectly equal comparison.",
      sources: ["FEC · Gillen", "FEC · Driscoll"],
    };
  }

  if (
    normalized.includes("office") ||
    normalized.includes("experience") ||
    normalized.includes("record")
  ) {
    return {
      title: "Public-service record",
      body: "Laura Gillen is a first-term U.S. representative and was elected Hempstead Town Supervisor in 2017. Jeanine Driscoll’s campaign identifies her as Hempstead Town Receiver of Taxes. The Libertarian Party of New York lists Blay Tarnoff as chair of its Nassau County Committee.",
      sources: ["U.S. House", "Driscoll campaign", "LPNY"],
    };
  }

  if (
    normalized.includes("trust") ||
    normalized.includes("statement") ||
    normalized.includes("action") ||
    normalized.includes("consistent")
  ) {
    return {
      title: "No opaque trust score",
      body: "This prototype does not label candidates trustworthy or untrustworthy. It separates candidate statements, verified public records, partisan sources, and unresolved evidence gaps. The statements-versus-actions review is visibly incomplete where the underlying work has not been done.",
      sources: ["Know Your Ballot methodology"],
    };
  }

  return {
    title: "Try a source-backed question",
    body: "This prototype uses a small rule-based evidence preview while the Convex Agent and retrieval layer remain disconnected. Try one of the suggested questions to see the intended citation-first response pattern.",
    sources: ["Prototype dataset"],
  };
}

export function EvidenceExplorer() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ReturnType<
    typeof answerQuestion
  > | null>(null);

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer(answerQuestion(question));
  }

  function chooseSuggestion(suggestion: string) {
    setQuestion(suggestion);
    setAnswer(answerQuestion(suggestion));
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/[0.035] shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <Badge variant="outline" className="bg-background">
            <Sparkles data-icon="inline-start" aria-hidden="true" />
            Evidence assistant preview
          </Badge>
        </div>
        <div>
          <CardTitle className="text-xl">Ask the record, not the rhetoric</CardTitle>
          <CardDescription className="mt-1 leading-6">
            Preview the citation-first interaction. This is rule-based until a
            Convex Agent and retrieval index are connected.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={submitQuestion}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about funding, experience, or evidence gaps"
            aria-label="Ask a question about the candidates"
            className="h-10 bg-background"
          />
          <Button type="submit" className="h-10 sm:w-auto">
            <Search data-icon="inline-start" aria-hidden="true" />
            Search evidence
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal bg-background py-1.5 text-left"
              onClick={() => chooseSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {answer && (
          <div
            className="rounded-lg border border-border bg-background p-4"
            aria-live="polite"
          >
            <p className="font-semibold">{answer.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {answer.body}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {answer.sources.map((source) => (
                <Badge key={source} variant="secondary">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
