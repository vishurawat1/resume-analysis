"use client";

import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  Play,
  Pause,
  Info
} from "lucide-react";

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
  title: string;
  detail: string;
  accent: string;
}

interface ShowcaseTab {
  id: string;
  title: string;
  badge: string;
  image: string;
  alt: string;
  headline: string;
  hotspots: Hotspot[];
  features: {
    icon: React.ElementType;
    title: string;
    description: string;
    metric?: string;
  }[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: "ats-intelligence",
    title: "ATS Score & Commute Radar",
    badge: "Score: 83 • ~2,000 km Distance",
    image: "/screenshots/ats-performance-report.png",
    alt: "AI Resume Analyzer ATS Performance Report and Commute Radar",
    headline: "Simulate Workday & Greenhouse parsers with verified employer and commute reality checks.",
    hotspots: [
      {
        id: "score-pin",
        x: 27,
        y: 30,
        label: "ATS 83",
        title: "Overall ATS Score (83/100)",
        detail: "Strict Workday/Lever algorithm simulation. Ranks in the top 15% tier with a potential target of 95.",
        accent: "bg-emerald-500",
      },
      {
        id: "company-pin",
        x: 32,
        y: 72,
        label: "Scam Shield",
        title: "Company Legitimacy (45% Legit)",
        detail: "Flags phantom startup footprint and unverified domains before you invest interview prep.",
        accent: "bg-amber-500",
      },
      {
        id: "commute-pin",
        x: 68,
        y: 72,
        label: "Distance Radar",
        title: "Commute & Relocation (~2,000 km)",
        detail: "Calculates distance from Bangalore to Dehradun. Alerts candidate to negotiate relocation or full remote.",
        accent: "bg-blue-500",
      },
    ],
    features: [
      {
        icon: Gauge,
        title: "ATS Scoring Simulation",
        description: "Evaluates exact keyword saturation, section layout, and font extractability.",
        metric: "83 / 100",
      },
      {
        icon: ShieldCheck,
        title: "Company Scam Shield",
        description: "Scans corporate records, email domains, and job syntax to prevent phantom job traps.",
        metric: "45% Legit",
      },
      {
        icon: MapPin,
        title: "Commute & Relocation",
        description: "Identifies true geographic feasibility and provides witty reality checks for impossible locations.",
        metric: "~2,000 km",
      },
    ],
  },
  {
    id: "role-fit-benchmarks",
    title: "Role Fit & Market Benchmarking",
    badge: "85% Keyword Match • Junior to Entry",
    image: "/screenshots/role-fit-benchmarks.png",
    alt: "AI Role Fit Analysis, Seniority Level, and Market Compensation Benchmarks",
    headline: "Compare candidate seniority, benchmark real market compensation, and uncover recruiter blind spots.",
    hotspots: [
      {
        id: "role-fit-pin",
        x: 35,
        y: 28,
        label: "Role Fit",
        title: "Contextual Role Fit Appraisal",
        detail: "Deep narrative evaluating technical ceiling, MERN stack depth, and team collaboration abilities.",
        accent: "bg-blue-500",
      },
      {
        id: "salary-pin",
        x: 76,
        y: 28,
        label: "Market Rate",
        title: "Market Compensation Range",
        detail: "Stipend benchmark: $1,500 – $2,500/mo. Perfect seniority match (Junior 0-2 yrs vs Entry-Level).",
        accent: "bg-emerald-500",
      },
      {
        id: "weakness-pin",
        x: 30,
        y: 80,
        label: "Gaps Audit",
        title: "Critical Weaknesses Audit",
        detail: "Flags missing 'debugging' keywords and unstated hybrid work preferences before recruiters do.",
        accent: "bg-rose-500",
      },
    ],
    features: [
      {
        icon: Target,
        title: "Contextual Suitability",
        description: "Analyzes actual technical ceiling and collaboration readiness beyond simple word matching.",
        metric: "High Fit",
      },
      {
        icon: DollarSign,
        title: "Salary Benchmarking",
        description: "Real-time compensation guidance tailored to candidate level and target company tier.",
        metric: "$1.5k–$2.5k",
      },
      {
        icon: AlertTriangle,
        title: "Missing Keyword Radar",
        description: "Highlights high-priority recruiter filter keywords absent from the candidate resume.",
        metric: "85% Match",
      },
    ],
  },
  {
    id: "bullet-studio",
    title: "Interactive AI Bullet Optimizer",
    badge: "Metric-Driven Rewrites • Vector PDF",
    image: "/screenshots/interactive-bullet-improvements.png",
    alt: "Interactive AI Improvements Studio with Before and After Resume Bullets",
    headline: "Transform passive job duties into quantifiable achievements with 1-click accept and instant vector PDF export.",
    hotspots: [
      {
        id: "impact-pin",
        x: 18,
        y: 18,
        label: "High Impact",
        title: "Impact Priority Classification",
        detail: "Categorizes rewrites into High vs Medium impact so candidates focus on top recruiter drivers.",
        accent: "bg-blue-500",
      },
      {
        id: "diff-pin",
        x: 48,
        y: 35,
        label: "1-Click Fix",
        title: "Quantified Accomplishments",
        detail: "Injected 25% user-engagement metric and eliminated fluff, optimizing for 6-second recruiter scans.",
        accent: "bg-emerald-500",
      },
      {
        id: "why-pin",
        x: 48,
        y: 48,
        label: "Recruiter Why",
        title: "Algorithmic Reasoning",
        detail: "Explains why the rewrite works: clarifies action-result structure and reinforces ATS keywords.",
        accent: "bg-purple-500",
      },
    ],
    features: [
      {
        icon: Sparkles,
        title: "Quantified Metrics",
        description: "Instantly injects percentages, latency improvements, and concrete outcomes into bullets.",
        metric: "+25% Impact",
      },
      {
        icon: CheckCircle2,
        title: "1-Click Accept",
        description: "Full candidate control. Accept or dismiss individual suggestions to update the draft live.",
        metric: "Real-time",
      },
      {
        icon: Check,
        title: "Vector PDF Export",
        description: "Pure Helvetica vector document with clean typography and clickable contact links.",
        metric: "ATS Proof",
      },
    ],
  },
];

const AUTOPLAY_DURATION = 6500; // ms per tab

export function AppExperienceShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Dynamic autoplay progress ticker
  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // tick every 50ms
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / AUTOPLAY_DURATION) * 100;
        if (next >= 100) {
          setActiveTab((cur) => (cur + 1) % SHOWCASE_TABS.length);
          setActiveHotspot(null);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activeTab]);

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    setProgress(0);
    setActiveHotspot(null);
  };

  const currentTab = SHOWCASE_TABS[activeTab];

  return (
    <section id="app-tour" className="py-24 relative overflow-hidden bg-background">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-primary/[0.04] dark:bg-primary/[0.07] rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Product Tour</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            Real scans. Zero generic AI fluff.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            See the actual intelligence engine in action. Hover over any glowing pin on the screen to inspect live metrics.
          </p>
        </div>

        {/* Dynamic Tab Selector Bar with Integrated Hairline Progress Bar */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="inline-flex p-1.5 rounded-2xl bg-muted/60 dark:bg-muted/40 border border-border backdrop-blur-md">
            {SHOWCASE_TABS.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(idx)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none flex items-center gap-2 overflow-hidden ${
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <span>{tab.title}</span>

                  {/* Active Hairline Progress Timer Bar */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2.5px] bg-primary"
                      style={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.05 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pause / Play Indicator Pill */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-primary" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono hidden md:inline">{isPaused ? "Paused" : "Auto-playing"}</span>
          </button>
        </div>

        {/* Headline for Active Tab */}
        <div className="text-center mb-6">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto">
            {currentTab.headline}
          </p>
        </div>

        {/* macOS Frame with Interactive Live Screenshot */}
        <div 
          className="relative rounded-2xl md:rounded-3xl border border-border/80 bg-card/60 dark:bg-[#111116]/80 backdrop-blur-xl shadow-2xl p-2.5 sm:p-4 md:p-6 overflow-hidden mb-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top macOS Browser Window Bar */}
          <div className="flex items-center justify-between px-3 py-2 mb-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400/50 dark:bg-neutral-600 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400/50 dark:bg-neutral-600 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400/50 dark:bg-neutral-600 inline-block" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-background/60 border border-border/60 text-[11px] font-mono text-muted-foreground">
              <span className="text-emerald-500 font-bold">●</span>
              <span className="truncate max-w-[200px] sm:max-w-none">vr-resume-analysis.vercel.app/dashboard/analysis</span>
            </div>

            <button
              onClick={() => setEnlargedImage(currentTab.image)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Enlarge</span>
            </button>
          </div>

          {/* Screenshot Display with Dynamic Interactive Hotspot Pins */}
          <div className="relative rounded-xl overflow-hidden border border-border/70 bg-neutral-950">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[16/10] w-full select-none"
              >
                <Image
                  src={currentTab.image}
                  alt={currentTab.alt}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover object-top"
                  priority={activeTab === 0}
                />

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Interactive Hotspot Pins */}
                {currentTab.hotspots.map((pin) => {
                  const isPinActive = activeHotspot?.id === pin.id;
                  return (
                    <div
                      key={pin.id}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                      onMouseEnter={() => {
                        setIsPaused(true);
                        setActiveHotspot(pin);
                      }}
                      onMouseLeave={() => setActiveHotspot(null)}
                      onClick={() => setActiveHotspot(isPinActive ? null : pin)}
                    >
                      {/* Pulse Ring */}
                      <span className={`absolute -inset-1.5 rounded-full ${pin.accent} opacity-40 animate-ping pointer-events-none`} />
                      
                      {/* Pin Trigger Button */}
                      <button
                        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight text-white shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer border border-white/40 ${
                          isPinActive ? "scale-110 ring-2 ring-white" : "hover:scale-105"
                        } ${pin.accent}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>{pin.label}</span>
                      </button>

                      {/* Hotspot Floating Insight Card */}
                      <AnimatePresence>
                        {isPinActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3.5 rounded-xl bg-neutral-900/95 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-xl z-40 text-left pointer-events-none"
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-white">
                              <Info className="w-3.5 h-3.5 text-primary" />
                              <span>{pin.title}</span>
                            </div>
                            <p className="text-[11px] text-neutral-300 leading-relaxed font-normal">
                              {pin.detail}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Minimalist 3-Feature Metrics Row for Active Tab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentTab.features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-md p-4 flex items-center justify-between gap-3 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm">
                      {feat.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {feat.description}
                    </p>
                  </div>
                </div>

                {feat.metric && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border shrink-0">
                    {feat.metric}
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setEnlargedImage(null)}
                className="self-end mb-3 p-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700 transition-colors shadow-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>

              <div className="relative w-full aspect-[16/10] max-h-[82vh] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-black">
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
