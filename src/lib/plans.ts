export type PlanId = "free" | "pro" | "elite";
export type BillingInterval = "monthly" | "yearly";
export type CurrencyCode = "USD" | "INR";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: string;
  creditsPerMonth: number;
  maxSavedScans: number;
  priceMonthly: Record<CurrencyCode, number>;
  priceYearly: Record<CurrencyCode, number>;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Starter",
    tagline: "Test your resume against ATS filters before you apply.",
    creditsPerMonth: 10,
    maxSavedScans: 3,
    priceMonthly: { USD: 0, INR: 0 },
    priceYearly: { USD: 0, INR: 0 },
    features: [
      "10 AI credits / month (ATS scans, audits & rewrites)",
      "Overleaf TeX Live PDF compilation & preview",
      "Engineering & Executive LaTeX resume templates",
      "Company legitimacy & commute feasibility radar",
      "Up to 3 recent job comparison snapshots",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Job Seeker",
    tagline: "Built for active applicants applying to competitive roles daily.",
    badge: "Most Popular",
    highlighted: true,
    creditsPerMonth: 100,
    maxSavedScans: 25,
    priceMonthly: { USD: 12, INR: 499 },
    priceYearly: { USD: 96, INR: 3999 },
    features: [
      "100 AI credits / month with Waterfall AI fallback",
      "All 6 ATS-verified Overleaf LaTeX templates",
      "Full 1-click .tex tailoring + guided visual form",
      "Tailored Cover Letters (PDF) & Top 5 Interview Prep",
      "GitHub Repo XYZ Sync & Live Job URL Auto-Fill",
      "Up to 25 multi-JD comparison snapshots",
    ],
  },
  elite: {
    id: "elite",
    name: "Career Accelerator",
    tagline: "High-volume intelligence for power applicants and career coaches.",
    badge: "Max Scale",
    creditsPerMonth: 500,
    maxSavedScans: 100,
    priceMonthly: { USD: 29, INR: 1199 },
    priceYearly: { USD: 228, INR: 9999 },
    features: [
      "500 AI credits / month high-volume allowance",
      "Everything in Pro Job Seeker included",
      "Priority AI waterfall & binary LaTeX caching",
      "Unlimited cover letter & multi-role iteration workflows",
      "Up to 100 stored role comparison snapshots",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "elite"];

export interface ComparisonRow {
  feature: string;
  free: string;
  pro: string;
  elite: string;
}

export const PLAN_COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Monthly AI Credits",
    free: "10 / mo",
    pro: "100 / mo",
    elite: "500 / mo",
  },
  {
    feature: "ATS Match + Scam & Commute Radar",
    free: "Included",
    pro: "Included",
    elite: "Included",
  },
  {
    feature: "Overleaf LaTeX Templates",
    free: "All 6 templates",
    pro: "All 6 templates",
    elite: "All 6 + Priority",
  },
  {
    feature: "Job URL Auto-Fill & GitHub Sync",
    free: "Within monthly credits",
    pro: "100 credits / mo",
    elite: "500 credits / mo",
  },
  {
    feature: "Tailored Cover Letter + Top 5 Interview Q&A",
    free: "Within monthly credits",
    pro: "Full access",
    elite: "Full access",
  },
  {
    feature: "Saved Multi-JD Comparisons",
    free: "Up to 3 scans",
    pro: "Up to 25 scans",
    elite: "Up to 100 scans",
  },
  {
    feature: "Exact AI Cache Repeats",
    free: "Free (0 credits)",
    pro: "Free (0 credits)",
    elite: "Free (0 credits)",
  },
];

export function isValidPlanId(val: unknown): val is PlanId {
  return val === "free" || val === "pro" || val === "elite";
}

export function getPlanConfig(planId?: unknown): PlanDefinition {
  return isValidPlanId(planId) ? PLANS[planId] : PLANS.free;
}

export function getCurrentPeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatPlanPrice(
  plan: PlanDefinition,
  interval: BillingInterval,
  currency: CurrencyCode
): string {
  const amount = interval === "yearly" ? plan.priceYearly[currency] : plan.priceMonthly[currency];
  if (amount === 0) return currency === "INR" ? "₹0" : "$0";
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `$${amount}`;
}
