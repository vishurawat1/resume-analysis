"use client";

import React from "react";
import { AutoScrollMarquee } from "./AutoScrollMarquee";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";

const ATS_PLATFORMS = [
  {
    name: "Workday",
    badge: "99.8% Ingest Rate",
    iconColor: "text-blue-500",
    bgAccent: "from-blue-500/10 to-indigo-500/10",
    borderAccent: "border-blue-500/20",
    highlight: "Multi-column Safe",
  },
  {
    name: "Greenhouse",
    badge: "Top Recruiter Choice",
    iconColor: "text-emerald-500",
    bgAccent: "from-emerald-500/10 to-teal-500/10",
    borderAccent: "border-emerald-500/20",
    highlight: "Keyword Density Tuned",
  },
  {
    name: "Lever",
    badge: "Semantic Match 98%",
    iconColor: "text-amber-500",
    bgAccent: "from-amber-500/10 to-orange-500/10",
    borderAccent: "border-amber-500/20",
    highlight: "Role Specific Fit",
  },
  {
    name: "Ashby",
    badge: "Next-Gen ATS Ready",
    iconColor: "text-purple-500",
    bgAccent: "from-purple-500/10 to-violet-500/10",
    borderAccent: "border-purple-500/20",
    highlight: "Fast-Track Candidate",
  },
  {
    name: "BambooHR",
    badge: "Full Extraction",
    iconColor: "text-green-600",
    bgAccent: "from-green-500/10 to-emerald-500/10",
    borderAccent: "border-green-500/20",
    highlight: "0 Parsing Collisions",
  },
  {
    name: "Oracle Taleo",
    badge: "Legacy Filter Bypassed",
    iconColor: "text-rose-500",
    bgAccent: "from-rose-500/10 to-red-500/10",
    borderAccent: "border-rose-500/20",
    highlight: "Strict Headers Passed",
  },
  {
    name: "SmartRecruiters",
    badge: "Top Tier Scoring",
    iconColor: "text-cyan-500",
    bgAccent: "from-cyan-500/10 to-blue-500/10",
    borderAccent: "border-cyan-500/20",
    highlight: "Skills Matrix Aligned",
  },
  {
    name: "iCIMS Cloud",
    badge: "Enterprise Tested",
    iconColor: "text-indigo-500",
    bgAccent: "from-indigo-500/10 to-sky-500/10",
    borderAccent: "border-indigo-500/20",
    highlight: "Certified Compatible",
  },
];

export function AtsPlatformsMarquee() {
  return (
    <div className="w-full py-10 relative overflow-hidden bg-background/50 backdrop-blur-sm border-y border-border/60">
      <div className="container mx-auto px-4 mb-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Cross-Platform Compatibility
        </div>
        <p className="text-xs md:text-sm text-muted-foreground font-medium">
          Engineered and battle-tested against the algorithms powering leading ATS & recruiter screening suites
        </p>
      </div>

      <AutoScrollMarquee speed="normal" direction="left" className="py-2">
        {ATS_PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className={`group relative flex items-center gap-3.5 px-5 py-3 rounded-xl bg-card border ${platform.borderAccent} hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 select-none cursor-default`}
          >
            <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.bgAccent} ${platform.iconColor}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground tracking-tight">
                  {platform.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                  {platform.highlight}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-normal">
                {platform.badge}
              </p>
            </div>
          </div>
        ))}
      </AutoScrollMarquee>
    </div>
  );
}
