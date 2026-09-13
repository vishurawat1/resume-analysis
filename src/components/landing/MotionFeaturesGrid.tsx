"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Scan, 
  Sparkles, 
  FileCheck2, 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Zap
} from "lucide-react";

const FEATURES = [
  {
    icon: Scan,
    title: "Deep Semantic Keyword Matching",
    description: "Our AI scans both your resume and target job posting, comparing semantic context rather than just raw string matching so you match recruiter filters effortlessly.",
    badge: "ATS Core Engine",
    accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
    border: "group-hover:border-emerald-500/40",
    cols: "lg:col-span-8",
    graphic: (
      <div className="mt-4 p-4 rounded-xl bg-background/60 border border-border/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">Extracted Skill Density</span>
          <span className="font-bold text-emerald-500">96% Optimized</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["System Design", "Microservices", "PostgreSQL", "Next.js", "Docker", "Event-Driven Architecture"].map((skill) => (
            <span key={skill} className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              ✓ {skill}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Instant ATS Score & Diagnostics",
    description: "Get a clear 0–100 score breakdown with actionable feedback to rank in the top 5% of applicant queues.",
    badge: "Real-time Metrics",
    accent: "from-blue-500/20 via-indigo-500/10 to-transparent",
    border: "group-hover:border-blue-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-4 rounded-xl bg-background/60 border border-border/80 flex items-center justify-around">
        <div className="text-center">
          <span className="text-3xl font-extrabold text-blue-500">94</span>
          <span className="block text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Match Score</span>
        </div>
        <div className="h-8 w-[1px] bg-border" />
        <div className="text-center">
          <span className="text-3xl font-extrabold text-emerald-500">0</span>
          <span className="block text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Parse Errors</span>
        </div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: "AI Bullet Point Quantifier",
    description: "Automatically rewrites weak statements into high-impact, results-driven achievements recruiters notice in the first 6-second scan.",
    badge: "Impact Engine",
    accent: "from-purple-500/20 via-pink-500/10 to-transparent",
    border: "group-hover:border-purple-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-3.5 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-[11px]">
          <Zap className="w-3.5 h-3.5" /> Before & After Fix
        </div>
        <div className="p-2 rounded bg-muted/60 text-muted-foreground line-through text-[11px]">
          Worked on database optimization.
        </div>
        <div className="p-2 rounded bg-primary/10 border border-primary/20 text-foreground font-medium text-[11px]">
          Optimized SQL indexes, slashing query latency by 58%.
        </div>
      </div>
    ),
  },
  {
    icon: FileCheck2,
    title: "Parse-Ready Format Validator",
    description: "Checks font hierarchies, column layouts, margins, and character encodings to ensure legacy and modern parsers never garble your experience.",
    badge: "100% Ingest Safe",
    accent: "from-amber-500/20 via-orange-500/10 to-transparent",
    border: "group-hover:border-amber-500/40",
    cols: "lg:col-span-8",
    graphic: (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-background/60 border border-border/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground">Standard Fonts</span>
        </div>
        <div className="p-2.5 rounded-lg bg-background/60 border border-border/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground">Clean Columns</span>
        </div>
        <div className="p-2.5 rounded-lg bg-background/60 border border-border/80 flex items-center gap-2 col-span-2 sm:col-span-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground">Extractable PDF</span>
        </div>
      </div>
    ),
  },
];

export function MotionFeaturesGrid() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3">
            <Cpu className="w-3.5 h-3.5" />
            Cutting-Edge Capabilities
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Everything you need to beat automated hiring filters
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Engineered with deep intelligence to uncover blind spots, optimize phrasing, and get your resume directly onto the hiring manager&apos;s desk.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className={`group relative rounded-2xl border border-border bg-card p-6 md:p-8 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${feature.cols} ${feature.border}`}
              >
                {/* Subtle Hover Gradient Glow */}
                <div
                  className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${feature.accent} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {feature.graphic}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
