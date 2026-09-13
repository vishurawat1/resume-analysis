"use client";

import React from "react";
import { AutoScrollMarquee } from "./AutoScrollMarquee";
import { CheckCircle, TrendingUp, Cpu, Sparkles, FileCheck, Target, Zap } from "lucide-react";

const TELEMETRY_ITEMS = [
  {
    icon: Target,
    label: "Target Role",
    value: "Staff Software Engineer — 96% Match",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Sparkles,
    label: "Keyword Injected",
    value: "+ Distributed Systems Architecture",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: TrendingUp,
    label: "Metric Boost",
    value: "Replaced passive phrasing with '340% throughput increase'",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: FileCheck,
    label: "OCR & Formatting",
    value: "Clean text extraction • 0 table collisions",
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Cpu,
    label: "Algorithm Ranking",
    value: "Top 5% Candidate Tier on Workday & Greenhouse",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Zap,
    label: "ATS Impact Score",
    value: "Jumped from 52 ➔ 94 in 1 click",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: CheckCircle,
    label: "Executive Summary",
    value: "Strong punchy hook aligned with VP of Engineering expectations",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

export function LiveTelemetryMarquee() {
  return (
    <div className="w-full py-4 overflow-hidden bg-muted/40 border-b border-border/60">
      <AutoScrollMarquee speed="fast" direction="right">
        {TELEMETRY_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border text-xs font-medium backdrop-blur-sm ${item.bg} hover:scale-105 transition-transform duration-200 cursor-default select-none shadow-xs`}
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                {item.label}:
              </span>
              <span className="text-foreground font-semibold">
                {item.value}
              </span>
            </div>
          );
        })}
      </AutoScrollMarquee>
    </div>
  );
}
