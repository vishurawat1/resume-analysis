"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error interrupted this screen. Your saved resumes and cloud workspace remain safe.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/80">
              Ref: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
