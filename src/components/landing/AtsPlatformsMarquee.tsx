"use client";

import React from "react";
import { AutoScrollMarquee } from "./AutoScrollMarquee";
import { ShieldCheck, Check } from "lucide-react";

const ATS_PLATFORMS = [
  { name: "Workday", spec: "99.8% Parse Ingest" },
  { name: "Greenhouse", spec: "Semantic Ranking Top 5%" },
  { name: "Lever", spec: "Keyword Saturation Tested" },
  { name: "Ashby", spec: "Single-Column Safe" },
  { name: "BambooHR", spec: "Zero Parsing Glitches" },
  { name: "Oracle Taleo", spec: "Legacy Header Bypassed" },
  { name: "SmartRecruiters", spec: "Skills Matrix Aligned" },
  { name: "iCIMS", spec: "Enterprise Verified" },
];

export function AtsPlatformsMarquee() {
  return (
    <div className="w-full py-8 relative overflow-hidden bg-background border-y border-border/50">
      <div className="container mx-auto px-4 mb-4 text-center">
        <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/80 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Validated against Tier-1 Applicant Tracking Systems</span>
        </p>
      </div>

      <AutoScrollMarquee speed="normal" direction="left" className="py-1">
        {ATS_PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/60 dark:bg-card/40 border border-border/60 hover:border-border select-none cursor-default text-xs transition-colors"
          >
            <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              {platform.name}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              • {platform.spec}
            </span>
          </div>
        ))}
      </AutoScrollMarquee>
    </div>
  );
}
