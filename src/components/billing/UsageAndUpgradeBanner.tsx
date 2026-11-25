"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Sparkles, X, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  authFetch,
  QUOTA_EXCEEDED_EVENT,
  QuotaExceededDetail,
  USAGE_UPDATED_EVENT,
} from "@/lib/apiClient";
import { PlanId, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export interface ClientUsageSummary {
  plan: PlanId;
  planName: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  periodKey: string;
  billingConfigured?: boolean;
}

export function useUsageStatus() {
  const { user, loading: authLoading } = useAuth();
  const [usage, setUsage] = useState<ClientUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/usage");
      if (res.ok) {
        const data = (await res.json()) as ClientUsageSummary;
        setUsage(data);
      }
    } catch {
      // Non-blocking UI badge fetch
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    const loadInitial = async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const res = await authFetch("/api/usage");
        if (!cancelled && res.ok) {
          const data = (await res.json()) as ClientUsageSummary;
          setUsage(data);
        }
      } catch {
        // Non-blocking UI badge fetch
      }
    };

    loadInitial();

    const onUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ creditsRemaining?: number; plan?: string }>;
      if (
        custom.detail &&
        typeof custom.detail.creditsRemaining === "number" &&
        !Number.isNaN(custom.detail.creditsRemaining)
      ) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                creditsRemaining: custom.detail.creditsRemaining!,
                creditsUsed: Math.max(0, prev.creditsLimit - custom.detail.creditsRemaining!),
              }
            : prev
        );
      } else {
        refreshUsage();
      }
    };

    window.addEventListener(USAGE_UPDATED_EVENT, onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(USAGE_UPDATED_EVENT, onUpdated);
    };
  }, [user, authLoading, refreshUsage]);

  return { usage, loading, refreshUsage };
}

export function PlanCreditPill() {
  const { usage } = useUsageStatus();

  if (!usage) {
    return (
      <Link
        href="/pricing"
        className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold hover:bg-primary/15 transition-colors"
      >
        <Crown className="w-3 h-3" />
        <span>Plans</span>
      </Link>
    );
  }

  const isLow = usage.creditsRemaining <= 2;
  const isPro = usage.plan !== "free";

  return (
    <Link
      href="/pricing"
      title={`${usage.planName} (${usage.creditsRemaining} of ${usage.creditsLimit} AI credits remaining this month)`}
      className={cn(
        "hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors",
        isLow
          ? "bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
          : isPro
            ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            : "bg-muted/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {isPro ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
      <span>
        {usage.planName}: {usage.creditsRemaining}/{usage.creditsLimit}
      </span>
    </Link>
  );
}

export function QuotaExceededDialog() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [detail, setDetail] = useState<QuotaExceededDetail | null>(null);

  useEffect(() => {
    const onQuotaExceeded = (event: Event) => {
      const custom = event as CustomEvent<QuotaExceededDetail>;
      setDetail(custom.detail || {});
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    };

    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuotaExceeded);
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuotaExceeded);
  }, []);

  // Safari fallback for declarative closedby="any" backdrop light-dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) {
        dialog.close();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => dialog.removeEventListener("click", handleBackdropClick);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, unknown>)}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,440px)] rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-bold text-foreground">
              Monthly AI Credit Limit Reached
            </h2>
            <p className="text-xs text-muted-foreground">
              Upgrade to keep scanning and optimizing resumes
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close upgrade dialog"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        {detail?.message ||
          `You have used your monthly ${PLANS.free.creditsPerMonth} AI credits on the Starter plan. Overleaf PDF compilation and editing remain unlimited.`}
      </p>

      <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pro Job Seeker — $12/mo (or ₹499/mo)</span>
        </div>
        <p className="text-muted-foreground">
          100 monthly AI credits, full Cover Letter &amp; Interview Prep packs, GitHub Sync, and up to 25 saved JD comparisons.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          Maybe Later
        </button>
        <Link
          href="/pricing"
          onClick={() => dialogRef.current?.close()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
        >
          <span>View Plans &amp; Upgrade</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </dialog>
  );
}
