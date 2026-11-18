"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  MapPin, 
  Gauge, 
  Target, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2, 
  X, 
  Check, 
  SlidersHorizontal,
  Briefcase,
  AlertTriangle
} from "lucide-react";

interface ShowcaseTab {
  id: string;
  title: string;
  shortTitle: string;
  tag: string;
  image: string;
  alt: string;
  summary: string;
  features: {
    icon: React.ElementType;
    title: string;
    description: string;
    accent: string;
    badge?: string;
  }[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: "ats-intelligence",
    title: "ATS Scoring & Commute Radar",
    shortTitle: "ATS & Commute",
    tag: "Real Scan: 83 Score • ~2,000 km Relocation",
    image: "/screenshots/ats-performance-report.png",
    alt: "AI Resume Analyzer ATS Performance Report and Commute Radar",
    summary: "Comprehensive multi-vector diagnostic simulating Tier-1 ATS parsers (Workday, Greenhouse, Lever) paired with Company Legitimacy and Relocation Radar.",
    features: [
      {
        icon: Gauge,
        title: "Workday-Grade Overall ATS Score",
        description: "Simulates actual enterprise ATS parsers, computing a strict 0–100 match against the target job posting.",
        accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        badge: "83 / 100",
      },
      {
        icon: MapPin,
        title: "Commute & Relocation Radar",
        description: "Compares your residence with target job location (e.g. Bangalore to Dehradun, ~2,000 km). Flags daily commute impossibilities and gives witty reality checks if someone enters 'Space' or fantasy locations!",
        accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        badge: "Smart Distance",
      },
      {
        icon: ShieldCheck,
        title: "Company Legitimacy & Scam Shield",
        description: "Evaluates the hiring company's corporate footprint, flagging phantom postings, unverified startups, and scam danger signs before you invest effort.",
        accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        badge: "Scam Protection",
      },
      {
        icon: SlidersHorizontal,
        title: "6-Vector Radar Diagnostic",
        description: "Visualizes structural health across Experience, Skills, Education, Projects, Formatting, and Keyword Optimization in a single balanced chart.",
        accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        badge: "Hexagonal Radar",
      },
    ],
  },
  {
    id: "role-fit-benchmarks",
    title: "Role Fit & Market Benchmarking",
    shortTitle: "Role Fit & Salary",
    tag: "Real Scan: 85% Keyword Match • Entry to Junior",
    image: "/screenshots/role-fit-benchmarks.png",
    alt: "AI Role Fit Analysis, Seniority Level, and Market Compensation Benchmarks",
    summary: "Deep contextual appraisal of your seniority fit, realistic market compensation ranges, missing critical keywords, and balanced strengths vs weaknesses.",
    features: [
      {
        icon: Target,
        title: "Contextual Role Fit Appraisal",
        description: "Evaluates your technical ceiling and team synergy instead of simple keyword-counting, explaining exactly why you fit or exceed requirements.",
        accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        badge: "Contextual AI",
      },
      {
        icon: DollarSign,
        title: "Seniority & Market Salary Intelligence",
        description: "Compares candidate seniority (e.g. Junior 0-2 yrs) against target job level, and estimates realistic market salary and stipend ranges.",
        accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        badge: "Market Rate",
      },
      {
        icon: AlertTriangle,
        title: "Missing ATS Keyword Detector",
        description: "Detects crucial missing terms (e.g. 'Debugging', 'Hybrid work') that algorithms require to pass your application to the recruiter review stage.",
        accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        badge: "Keyword Audit",
      },
      {
        icon: Briefcase,
        title: "Honest Strengths vs Weaknesses",
        description: "Presents an unvarnished breakdown of your standout achievements alongside points interviewers will likely challenge.",
        accent: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
        badge: "Recruiter Lens",
      },
    ],
  },
  {
    id: "bullet-studio",
    title: "Interactive AI Bullet Optimizer",
    shortTitle: "1-Click AI Bullets",
    tag: "Real Scan: Quantified Metric Enhancements",
    image: "/screenshots/interactive-bullet-improvements.png",
    alt: "Interactive AI Improvements Studio with Before and After Resume Bullets",
    summary: "Review AI-generated bullet rewrites that convert passive job descriptions into metric-packed achievements recruiters notice, then export a clean vector PDF.",
    features: [
      {
        icon: Sparkles,
        title: "Quantified Metric Injection",
        description: "Transforms vague phrases into high-impact accomplishments featuring exact percentages, latency reductions, and user engagement numbers.",
        accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        badge: "Quantified Impact",
      },
      {
        icon: CheckCircle2,
        title: "1-Click Accept or Dismiss",
        description: "Review suggestions with full autonomy. Accepting an improvement automatically updates your resume draft in real time.",
        accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        badge: "Instant Apply",
      },
      {
        icon: Target,
        title: "Transparent 'Why' Explanations",
        description: "Explains the psychological and algorithmic reason for each rewrite—such as eliminating redundancy or foregrounding ROI.",
        accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        badge: "Recruiter Logic",
      },
      {
        icon: Check,
        title: "ATS-Engineered Vector PDF Output",
        description: "Export the finalized resume as a clean, single-page vector PDF built on industry-standard typography with clickable contact links.",
        accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        badge: "Executive PDF",
      },
    ],
  },
];

export function AppExperienceShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const currentTab = SHOWCASE_TABS[activeTab];

  return (
    <section id="app-tour" className="py-24 relative overflow-hidden bg-background border-t border-border">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Product Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight mb-5 leading-tight">
            See the exact AI intelligence{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-blue-500 bg-clip-text text-transparent">
              before you upload
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Unlike generic AI tools that just regurgitate synonyms, our platform gives you deep ATS scoring, company legitimacy checks, commute reality radar, and 1-click bullet point enhancements.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {SHOWCASE_TABS.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`relative px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-[1.02]"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border hover:border-border/80"
                }`}
              >
                <span>{tab.title}</span>
                <span className={`hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Summary Tag */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {currentTab.tag}
          </span>
        </div>

        {/* Main Showcase Device Mockup */}
        <div className="relative rounded-2xl md:rounded-3xl border border-border bg-card/90 shadow-2xl backdrop-blur-md overflow-hidden p-2 sm:p-4 md:p-6 mb-12">
          
          {/* macOS Browser Window Header */}
          <div className="flex items-center justify-between px-3 py-2.5 mb-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            {/* URL Bar */}
            <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-background/80 border border-border/80 text-[11px] font-mono text-muted-foreground max-w-sm sm:max-w-md w-full justify-center">
              <span className="text-emerald-500 text-[10px] font-bold">🔒 https://</span>
              <span className="text-foreground font-medium truncate">vr-resume-analysis.vercel.app/dashboard/analysis</span>
            </div>

            {/* Enlarge Button */}
            <button
              onClick={() => setEnlargedImage(currentTab.image)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Click to inspect full resolution"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Enlarge</span>
            </button>
          </div>

          {/* Screenshot Display with Animated Transition */}
          <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden"
                onClick={() => setEnlargedImage(currentTab.image)}
              >
                <Image
                  src={currentTab.image}
                  alt={currentTab.alt}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                  priority={activeTab === 0}
                />

                {/* Subtle Hover Overlay Hint */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 rounded-xl bg-background/90 text-foreground text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 border border-border">
                    <Maximize2 className="w-4 h-4 text-primary" />
                    Click to Inspect Full High-Res Screen
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Feature Cards Grid for Active Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentTab.features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${feat.accent} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {feat.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2 group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Callout Bar */}
        <div className="mt-12 p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm sm:text-base">
                Ready to see your own resume breakdown?
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Get your full ATS score, commute analysis, and scam check in under 60 seconds.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/upload"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            <span>Scan Your Resume Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Lightbox Modal for Full Resolution Screenshot */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-center"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEnlargedImage(null);
                }}
                className="self-end mb-3 p-2 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 transition-colors shadow-lg flex items-center gap-1.5 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Close Preview</span>
              </button>

              {/* Large Image Container */}
              <div 
                className="relative w-full aspect-[16/10] max-h-[82vh] rounded-2xl overflow-hidden border border-border shadow-2xl bg-black"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={enlargedImage}
                  alt="High Resolution Screenshot Preview"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
