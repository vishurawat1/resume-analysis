"use client";

import React, { useState } from "react";
import { 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileX,
  FileCheck
} from "lucide-react";

export function InteractiveComparison() {
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");

  return (
    <section className="py-24 relative overflow-hidden bg-muted/20 border-t border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Direct Impact Comparison
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            The difference between getting ignored and getting interviewed
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            ATS software doesn&apos;t read resumes like humans do. Here is how our AI refactors generic bullet points into algorithm-approved, interview-winning accomplishments.
          </p>

          {/* Toggle pill buttons for mobile / quick switch */}
          <div className="inline-flex p-1 rounded-xl bg-card border border-border shadow-xs mt-6">
            <button
              onClick={() => setActiveTab("before")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "before"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileX className="w-4 h-4" />
              Before (Score: 42%)
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "after"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              After (Score: 96%)
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* BEFORE CARD */}
          <div className={`rounded-2xl border transition-all duration-300 p-6 md:p-8 flex flex-col justify-between ${
            activeTab === "before" 
              ? "bg-card border-red-500/40 ring-2 ring-red-500/20 shadow-xl" 
              : "bg-card/50 border-border opacity-70 lg:opacity-100 hover:opacity-100"
          }`}>
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Standard / Generic Resume</h3>
                    <p className="text-xs text-muted-foreground">Rejected by ATS in under 3 seconds</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-red-500">42</span>
                  <span className="text-xs text-muted-foreground block font-bold uppercase">Score</span>
                </div>
              </div>

              {/* Sample Bullet Points Before */}
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Sample Experience Entry:
                  </span>
                  <div className="p-4 rounded-xl bg-muted/40 border border-red-500/20 space-y-2">
                    <p className="text-sm text-foreground/90 font-mono text-xs leading-relaxed">
                      &quot;Responsible for working with the engineering team to build web applications and maintain code. Fixed bugs and attended sprint planning meetings.&quot;
                    </p>
                  </div>
                </div>

                {/* ATS Parser Red Flags */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ATS Diagnostic Errors:
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-1.5 pl-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Passive language (&quot;Responsible for&quot;) signals low autonomy</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Zero quantifiable metrics or measurable business outcomes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Missing 8 core skills specified in job listing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Outcome: Filtered out automatically
              </span>
              <span className="text-xs font-mono text-muted-foreground">Workday / Taleo</span>
            </div>
          </div>

          {/* AFTER CARD */}
          <div className={`rounded-2xl border transition-all duration-300 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden ${
            activeTab === "after" 
              ? "bg-card border-primary ring-2 ring-primary/20 shadow-2xl" 
              : "bg-card/50 border-border opacity-70 lg:opacity-100 hover:opacity-100"
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      AI-Optimized Resume
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        Top 5%
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">Ranked #1 for recruiter interview queue</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">96</span>
                  <span className="text-xs text-muted-foreground block font-bold uppercase">Score</span>
                </div>
              </div>

              {/* Sample Bullet Points After */}
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    AI-Enhanced Experience Entry:
                  </span>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <p className="text-sm text-foreground font-mono text-xs leading-relaxed">
                      &quot;Architected and scaled full-stack web platforms using{" "}
                      <strong className="text-primary font-bold">TypeScript, React, & Node.js</strong>
                      , accelerating system throughput by{" "}
                      <strong className="text-primary font-bold">42%</strong> and cutting API response latency from 450ms to 95ms across 1.4M daily active users.&quot;
                    </p>
                  </div>
                </div>

                {/* ATS Parser Wins */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    ATS Optimization Signals:
                  </span>
                  <ul className="text-xs text-foreground/80 space-y-1.5 pl-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Executive action verbs (&quot;Architected and scaled&quot;)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Concrete numeric metrics (42% throughput, 450ms to 95ms, 1.4M users)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>High-density exact keyword matching against target job description</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Outcome: Fast-tracked to Recruiter Phone Screen
              </span>
              <span className="text-xs font-mono text-muted-foreground">Greenhouse & Lever</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
