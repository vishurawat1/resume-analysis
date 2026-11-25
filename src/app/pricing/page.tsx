"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/apiClient";
import {
  BillingInterval,
  CurrencyCode,
  formatPlanPrice,
  PLAN_COMPARISON_ROWS,
  PLAN_ORDER,
  PlanId,
  PLANS,
} from "@/lib/plans";
import { useUsageStatus } from "@/components/billing/UsageAndUpgradeBanner";
import { cn } from "@/lib/utils";
import "./pricing-table.css";

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { usage } = useUsageStatus();

  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);

  const handleSelectPlan = async (planId: PlanId) => {
    setCheckoutMessage(null);

    if (planId === "free") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }

    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setCheckoutPlan(planId);
    try {
      const res = await authFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval, currency }),
      });

      const data = (await res.json()) as {
        configured?: boolean;
        url?: string;
        error?: string;
      };

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutMessage({
        type: data.configured === false ? "info" : "error",
        text:
          data.error ||
          "Checkout could not be started right now. Please try again shortly.",
      });
    } catch {
      setCheckoutMessage({
        type: "error",
        text: "Network error starting checkout session. Please try again.",
      });
    } finally {
      setCheckoutPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={user ? "/dashboard" : "/"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{user ? "Back to Dashboard" : "Home"}</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 font-bold text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-black">
                AR
              </span>
              <span>AI Resume Analyzer Plans</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {usage && (
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">
                Current: {usage.planName} ({usage.creditsRemaining}/{usage.creditsLimit} left)
              </span>
            )}
            <Link
              href={user ? "/dashboard/upload" : "/login"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-bold text-background hover:opacity-90 transition-opacity"
            >
              <span>{user ? "Launch Scanner" : "Sign In"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-14">
        {/* Hero & Controls */}
        <section className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Transparent SaaS Pricing • Exact Cache Repeats Cost 0 Credits</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Invest once. Pass ATS filters and negotiate with confidence.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Start free with {PLANS.free.creditsPerMonth} monthly AI credits and unlimited Overleaf LaTeX builds, or unlock 100+ monthly deep ATS scans, Tailored Cover Letters, Interview Prep, and GitHub XYZ Sync.
          </p>

          {/* Controls: Billing Cycle & Currency */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div
              role="group"
              aria-label="Billing interval"
              className="inline-flex rounded-xl border border-border bg-card p-1"
            >
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  interval === "monthly"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("yearly")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  interval === "yearly"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Annual</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  Save 33%
                </span>
              </button>
            </div>

            <div
              role="group"
              aria-label="Display currency"
              className="inline-flex rounded-xl border border-border bg-card p-1"
            >
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  currency === "USD"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  currency === "INR"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </section>

        {checkoutMessage && (
          <div
            role="status"
            className={cn(
              "mx-auto max-w-3xl rounded-xl border p-4 text-sm flex items-start gap-3",
              checkoutMessage.type === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-primary/30 bg-primary/10 text-foreground"
            )}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="font-semibold">
                {checkoutMessage.type === "info" ? "Billing Gateway Notice" : "Checkout Issue"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{checkoutMessage.text}</p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isCurrent = usage?.plan === plan.id;
            const formatted = formatPlanPrice(plan, interval, currency);
            const perLabel =
              plan.id === "free" ? "forever" : interval === "yearly" ? "/ year" : "/ month";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 shadow-sm transition-all",
                  plan.highlighted
                    ? "border-primary bg-card shadow-lg ring-1 ring-primary/30"
                    : "border-border bg-card"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    {plan.badge && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          plan.highlighted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground min-h-[2.5rem]">
                    {plan.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight">{formatted}</span>
                    <span className="text-xs text-muted-foreground">{perLabel}</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={checkoutPlan !== null || isCurrent}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                      isCurrent
                        ? "bg-muted text-muted-foreground border border-border"
                        : plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                          : "bg-foreground text-background hover:opacity-90"
                    )}
                  >
                    {checkoutPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Starting Checkout...</span>
                      </>
                    ) : isCurrent ? (
                      <span>Current Plan</span>
                    ) : plan.id === "free" ? (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>{user ? "Go to Dashboard" : "Start Free"}</span>
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        <span>Upgrade to {plan.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Responsive Feature Comparison Matrix */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 id="pricing-comparison-caption" className="text-2xl font-bold">
              Full Plan Comparison
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Every plan includes UID-isolated cloud storage and real TeX Live Overleaf PDF builds.
            </p>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="pricing-comparison-caption"
            className="pricing-table-wrapper"
          >
            <table
              className="pricing-table"
              style={
                {
                  "--label-2": '"Starter"',
                  "--label-3": '"Pro Job Seeker"',
                  "--label-4": '"Career Accelerator"',
                } as React.CSSProperties
              }
            >
              <caption>Feature comparison across Starter, Pro Job Seeker, and Career Accelerator</caption>
              <thead>
                <tr>
                  <th scope="col">Capability</th>
                  <th scope="col">Starter (Free)</th>
                  <th scope="col">Pro Job Seeker</th>
                  <th scope="col">Career Accelerator</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td>{row.free}</td>
                    <td className="font-semibold text-primary">{row.pro}</td>
                    <td>{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trust Footer */}
        <section className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Enterprise Privacy &amp; Instant Cancellation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your resumes stay strictly isolated to your Firebase UID. Read our{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors shrink-0"
          >
            Manage Usage in Settings
          </Link>
        </section>
      </main>
    </div>
  );
}
