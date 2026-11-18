"use client";

import { Briefcase, DollarSign, TrendingUp, Award } from "lucide-react";

export interface SeniorityFit {
  candidateLevel: string;
  jobLevel: string;
  fitVerdict: string;
  estimatedSalaryRange: string;
}

export function SeniorityMarketCard({ data }: { data?: SeniorityFit }) {
  if (!data) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Seniority & Market Benchmarks</h3>
              <p className="text-xs text-muted-foreground">Level matching & compensation range</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
            {data.fitVerdict || "Well Aligned"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3 bg-muted/40 rounded-lg border border-border/80">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">Candidate Level</span>
            <span className="font-semibold text-foreground text-sm mt-0.5 block">{data.candidateLevel || "Mid-Level"}</span>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border border-border/80">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">Target Job Level</span>
            <span className="font-semibold text-foreground text-sm mt-0.5 block">{data.jobLevel || "Mid-Senior"}</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-950 dark:text-emerald-300">Estimated Market Range:</span>
        </div>
        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {data.estimatedSalaryRange || "Market Competitive"}
        </span>
      </div>
    </div>
  );
}
