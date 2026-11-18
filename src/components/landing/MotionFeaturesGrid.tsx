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
  Zap,
  MapPin,
  Building2,
  DollarSign,
  Compass,
  ArrowRight
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
    title: "Instant ATS Score & 6-Vector Radar",
    description: "Get a clear 0–100 score breakdown across Experience, Skills, Education, Projects, Formatting, and Keyword Saturation to rank in the top 5% of applicant queues.",
    badge: "Hexagonal Radar",
    accent: "from-blue-500/20 via-indigo-500/10 to-transparent",
    border: "group-hover:border-blue-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-4 rounded-xl bg-background/60 border border-border/80 flex items-center justify-around">
        <div className="text-center">
          <span className="text-3xl font-extrabold text-blue-500">83</span>
          <span className="block text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Match Score</span>
        </div>
        <div className="h-8 w-[1px] bg-border" />
        <div className="text-center">
          <span className="text-3xl font-extrabold text-emerald-500">95</span>
          <span className="block text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Target Potential</span>
        </div>
      </div>
    ),
  },
  {
    icon: Building2,
    title: "Company Legitimacy & Scam Shield",
    description: "Evaluates the hiring organization's corporate footprint, flagging phantom postings, unverified startups, and scam danger signs before you invest effort.",
    badge: "Scam Protection",
    accent: "from-amber-500/20 via-orange-500/10 to-transparent",
    border: "group-hover:border-amber-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-3.5 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">LULU Company</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">45% Legit</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-500 text-[11px]">
          <span>✓</span> <span>Hybrid format clearly stated</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-500 text-[11px]">
          <span>⚠</span> <span>Lacks verifiable corporate footprint</span>
        </div>
      </div>
    ),
  },
  {
    icon: MapPin,
    title: "Commute & Relocation Reality Radar",
    description: "Analyzes candidate location against the job location. Warns if a 2,000 km commute is unrealistic and gives witty assessments for impossible/space locations.",
    badge: "Distance & Relocation",
    accent: "from-cyan-500/20 via-blue-500/10 to-transparent",
    border: "group-hover:border-cyan-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-3.5 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground truncate max-w-[100px]">Bangalore</span>
          <span className="text-primary font-bold">➔ ~2,000 km ➔</span>
          <span className="text-foreground font-medium truncate max-w-[90px]">Dehradun</span>
        </div>
        <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-semibold text-center">
          ⚠ Relocation Required for Hybrid Role
        </div>
      </div>
    ),
  },
  {
    icon: DollarSign,
    title: "Seniority & Market Compensation",
    description: "Compares your actual career tier against role expectations and provides benchmarked market salary ranges so you negotiate from strength.",
    badge: "Salary Intelligence",
    accent: "from-emerald-500/20 via-green-500/10 to-transparent",
    border: "group-hover:border-emerald-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 p-3.5 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Candidate: Junior (0-2y)</span>
          <span className="font-bold text-emerald-500">Perfect Match</span>
        </div>
        <div className="p-2 rounded bg-muted/60 text-foreground font-mono text-[11px] text-center font-bold">
          $1,500 – $2,500 / mo or equivalent INR
        </div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: "1-Click AI Bullet Quantifier & Vector PDF Studio",
    description: "Automatically rewrites weak statements into high-impact, results-driven achievements recruiters notice, and exports a clean, ATS-proof vector PDF.",
    badge: "Impact Engine",
    accent: "from-purple-500/20 via-pink-500/10 to-transparent",
    border: "group-hover:border-purple-500/40",
    cols: "lg:col-span-8",
    graphic: (
      <div className="mt-4 p-3.5 rounded-xl bg-background/60 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> High Impact Rewrite
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">1-Click Accept</span>
        </div>
        <div className="p-2 rounded bg-muted/60 text-muted-foreground line-through text-[11px]">
          Engineered a full-stack web platform using Next.js, React.js, Express.js.
        </div>
        <div className="p-2 rounded bg-primary/10 border border-primary/20 text-foreground font-medium text-[11px]">
          Engineered full-stack MERN platform that boosted user engagement by 25% via optimized workflows.
        </div>
      </div>
    ),
  },
  {
    icon: FileCheck2,
    title: "Parse-Ready Format & Layout Validator",
    description: "Checks font hierarchies, single-column layouts, margins, and character encodings to ensure legacy and modern parsers never garble your experience.",
    badge: "100% Ingest Safe",
    accent: "from-indigo-500/20 via-purple-500/10 to-transparent",
    border: "group-hover:border-indigo-500/40",
    cols: "lg:col-span-4",
    graphic: (
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-background/60 border border-border/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground text-[11px]">Helvetica Vector</span>
        </div>
        <div className="p-2 rounded-lg bg-background/60 border border-border/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground text-[11px]">Zero Parsing Bugs</span>
        </div>
      </div>
    ),
  },
];

export function MotionFeaturesGrid() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-background">
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
            Engineered with multi-vector intelligence to uncover blind spots, verify company legitimacy, test commute feasibility, and export flawless executive resumes.
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
                transition={{ duration: 0.5, delay: idx * 0.08 }}
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
