"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  RotateCcw,
  Cpu
} from "lucide-react";

export function HeroScannerGraphic() {
  const [scanStep, setScanStep] = useState(0);

  // Auto cycling scanner states
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Compute score directly from scanStep to avoid cascading renders
  const atsScore = scanStep === 0 ? 48 : scanStep === 1 ? 68 : scanStep === 2 ? 84 : 96;

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-6 select-none">
      {/* Background ambient glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-blue-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-70 animate-pulse-glow" />

      {/* Main glass container */}
      <div className="relative rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl p-4 md:p-6 overflow-hidden">
        
        {/* Top Header of Simulated ATS Terminal */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2.5 py-0.5 rounded-md bg-muted/60">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>ATS Neural Scanner v3.2</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real-time Ingest Active
            </span>
            <button
              onClick={() => {
                setScanStep(0);
              }}
              title="Reset Scan Simulation"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rescan</span>
            </button>
          </div>
        </div>

        {/* Inner Grid: Left side Simulated Resume Document with Laser, Right side Live Telemetry & Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Simulated Resume Document View (7 Cols) */}
          <div className="lg:col-span-7 relative bg-background rounded-xl border border-border/70 p-5 shadow-inner overflow-hidden min-h-[360px] flex flex-col justify-between">
            
            {/* Animated Laser Scanning Line */}
            <div className="animate-scanline z-20 pointer-events-none">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_16px_3px_rgba(16,185,129,0.7)]" />
              <div className="h-16 w-full bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
            </div>

            {/* Simulated Resume Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    Alex Rivera
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Applicant
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground">Senior Full Stack Engineer • San Francisco, CA</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                  AR
                </div>
              </div>

              {/* Summary with dynamic keyword highlights */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Professional Summary
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  High-impact engineer with 7+ years architecting{" "}
                  <span className={`px-1.5 py-0.5 rounded transition-all duration-500 font-medium ${
                    scanStep >= 1 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30" : "bg-muted text-muted-foreground"
                  }`}>
                    Distributed Systems
                  </span>{" "}
                  and high-throughput microservices. Spearheaded migration to{" "}
                  <span className={`px-1.5 py-0.5 rounded transition-all duration-500 font-medium ${
                    scanStep >= 2 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30" : "bg-muted text-muted-foreground"
                  }`}>
                    Kubernetes & AWS
                  </span>
                  , slashing latency by 42%.
                </p>
              </div>

              {/* Experience Line Items with Score Badges */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Targeted Experience
                </span>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Principal Cloud Architect</span>
                    <span className="text-[11px] text-muted-foreground">2022 – Present</span>
                  </div>
                  <ul className="list-disc list-inside text-foreground/75 space-y-1 pl-1 text-[11px] leading-relaxed">
                    <li>
                      Engineered real-time data streaming pipeline using{" "}
                      <span className={`px-1 rounded ${scanStep >= 3 ? "bg-primary/20 text-primary font-bold" : "bg-muted"}`}>
                        Kafka & Go
                      </span>
                      , handling 1.2M events/sec.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span>Reduced infrastructure overhead by $210,000 annually.</span>
                      <span className="inline-flex items-center text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        ✓ Metric Quantified
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Keyword Extraction Tags */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  ATS Extracted Entities
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {scanStep === 0 ? "Analyzing..." : scanStep === 1 ? "4 Matched" : scanStep === 2 ? "9 Matched" : "14 Matched (100%)"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "TypeScript", matched: scanStep >= 1 },
                  { name: "Distributed Systems", matched: scanStep >= 1 },
                  { name: "Kubernetes", matched: scanStep >= 2 },
                  { name: "AWS Cloud", matched: scanStep >= 2 },
                  { name: "Microservices", matched: scanStep >= 2 },
                  { name: "Kafka", matched: scanStep >= 3 },
                  { name: "GraphQL", matched: scanStep >= 3 },
                  { name: "CI/CD", matched: scanStep >= 3 },
                ].map((tag) => (
                  <span
                    key={tag.name}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all duration-500 border ${
                      tag.matched
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 scale-100"
                        : "bg-muted/50 text-muted-foreground/60 border-border/40 scale-95"
                    }`}
                  >
                    {tag.matched ? "✓ " : ""}
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live ATS Telemetry & Match Engine (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            
            {/* Top Score Radial Card */}
            <div className="p-4 rounded-xl bg-background/80 border border-border/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Overall ATS Compatibility
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  atsScore >= 80 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                    : atsScore >= 60 
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" 
                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                }`}>
                  {atsScore >= 80 ? "Top 5% Candidate" : atsScore >= 60 ? "Average Match" : "Filtered Out"}
                </span>
              </div>

              <div className="flex items-center gap-5 my-2">
                {/* Score Dial */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted/30"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 40 * (1 - atsScore / 100),
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={atsScore >= 80 ? "text-emerald-500" : atsScore >= 60 ? "text-amber-500" : "text-red-500"}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tracking-tight text-foreground tabular-nums">
                      {atsScore}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">/100</span>
                  </div>
                </div>

                {/* Score Breakdown Summary */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground font-medium">
                    <span>Keyword Density</span>
                    <span className="text-foreground font-bold">{Math.min(96, atsScore + 2)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-700 rounded-full"
                      style={{ width: `${Math.min(96, atsScore + 2)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground font-medium pt-1">
                    <span>Impact & Metrics</span>
                    <span className="text-foreground font-bold">{Math.min(92, atsScore - 4)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-700 rounded-full"
                      style={{ width: `${Math.min(92, atsScore - 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Feature Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-foreground block">
                    +3.8x Recruiter Callback Chance
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Matches 98% of target phrases from the job spec
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-foreground block">
                    100% Parser Compliant
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Zero parsing collisions on Workday, Greenhouse, & Taleo
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Graphic Accents */}
      <div className="absolute -top-4 -left-4 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg animate-float-slow text-xs font-semibold text-foreground">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>Greenhouse & Workday Ready</span>
      </div>

      <div className="absolute -bottom-4 -right-4 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg animate-float-delayed text-xs font-semibold text-foreground">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>96/100 Top Tier Match</span>
      </div>
    </div>
  );
}
