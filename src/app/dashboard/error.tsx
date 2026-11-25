"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold">Workspace Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This dashboard view hit a temporary issue. Retry loading or return to your Dashboard Home.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload View</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
