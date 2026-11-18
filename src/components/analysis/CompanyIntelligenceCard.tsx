"use client";

import { Building2, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Activity } from "lucide-react";

export interface CompanyIntelligence {
  name: string;
  legitimacyStatus: string;
  legitimacyScore: number;
  industry: string;
  estimatedTier: string;
  overview: string;
  greenFlags: string[];
  redFlags: string[];
  verdict: string;
}

export function CompanyIntelligenceCard({ data }: { data?: CompanyIntelligence }) {
  if (!data) return null;

  const isSuspicious =
    data.legitimacyScore < 50 ||
    data.legitimacyStatus?.toLowerCase().includes("suspicious") ||
    data.legitimacyStatus?.toLowerCase().includes("risk") ||
    (Array.isArray(data.redFlags) && data.redFlags.length > 1);

  const isCaution =
    !isSuspicious &&
    (data.legitimacyScore < 75 || data.legitimacyStatus?.toLowerCase().includes("caution") || (data.redFlags && data.redFlags.length > 0));

  const isVerified = !isSuspicious && !isCaution;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              isSuspicious
                ? "bg-destructive/10 text-destructive"
                : isCaution
                ? "bg-amber-500/10 text-amber-500"
                : "bg-emerald-500/10 text-emerald-500"
            }`}>
              {isSuspicious ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                {data.name || "Target Employer"}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{data.industry || "Technology"}</span>
                <span>•</span>
                <span>{data.estimatedTier || "Corporate"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${
              isSuspicious
                ? "bg-destructive/15 text-destructive border-destructive/30"
                : isCaution
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            }`}>
              <Activity className="w-3.5 h-3.5" />
              <span>{data.legitimacyScore}% Legit</span>
            </div>
          </div>
        </div>

        {/* Company Overview */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.overview}
        </p>

        {/* Signals: Green Flags & Red Flags */}
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/60">
            <span className="font-semibold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Green Flags
            </span>
            {Array.isArray(data.greenFlags) && data.greenFlags.length > 0 ? (
              <ul className="space-y-1.5 text-muted-foreground">
                {data.greenFlags.slice(0, 3).map((gf, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-500 shrink-0">✓</span>
                    <span>{gf}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Standard hiring signals present.</p>
            )}
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/60">
            <span className="font-semibold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <AlertTriangle className={`w-3.5 h-3.5 ${isSuspicious ? "text-destructive" : isCaution ? "text-amber-500" : "text-muted-foreground"}`} /> Red Flags
            </span>
            {Array.isArray(data.redFlags) && data.redFlags.length > 0 ? (
              <ul className="space-y-1.5 text-destructive/90">
                {data.redFlags.slice(0, 3).map((rf, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="shrink-0">⚠️</span>
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Zero scam or suspicious markers detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Legitimacy Verdict */}
      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
        isSuspicious
          ? "bg-destructive/10 border-destructive/20 text-destructive"
          : isCaution
          ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
      }`}>
        <span className="font-semibold uppercase tracking-wider text-[10px] block opacity-80 mb-0.5">Trust & Legitimacy Verdict</span>
        <p className="font-medium text-xs leading-relaxed">{data.verdict}</p>
      </div>
    </div>
  );
}
