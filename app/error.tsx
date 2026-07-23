"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        This page couldn’t load
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {error.message ||
          "The prototype encountered an unexpected error. Your location information was not saved."}
      </p>
      <Button className="mt-5" onClick={reset}>
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        Try again
      </Button>
    </main>
  );
}
