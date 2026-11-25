"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  UploadCloud, 
  Code2,
  Briefcase,
  Database
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import SplashCursor from "@/components/SplashCursor";
import { AtsPlatformsMarquee } from "@/components/landing/AtsPlatformsMarquee";
import { HeroScannerGraphic } from "@/components/landing/HeroScannerGraphic";
import { AppExperienceShowcase } from "@/components/landing/AppExperienceShowcase";
import { InteractiveComparison } from "@/components/landing/InteractiveComparison";
import { MotionFeaturesGrid } from "@/components/landing/MotionFeaturesGrid";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { TestimonialsMarquee } from "@/components/landing/TestimonialsMarquee";
import { LandingFaq } from "@/components/landing/LandingFaq";

const PREVIEW_ROLES = [
  {
    id: "swe",
    label: "Software Engineering",
    icon: Code2,
    score: "94/100",
    injected: "+ Microservices, Docker, CI/CD",
    salary: "$140k – $180k",
  },
  {
    id: "ai",
    label: "AI & Data Science",
    icon: Database,
    score: "96/100",
    injected: "+ Vector Search, PyTorch, LLMs",
    salary: "$160k – $210k",
  },
  {
    id: "pm",
    label: "Product & Strategy",
    icon: Briefcase,
    score: "91/100",
    injected: "+ Product Discovery, A/B Testing, OKRs",
    salary: "$135k – $175k",
  },
];

const emptySubscribe = () => () => {};

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [selectedRole, setSelectedRole] = useState(0);

  const splashColor = mounted && resolvedTheme === "light" ? "#10b981" : "#3b82f6";
  const activeRole = PREVIEW_ROLES[selectedRole];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 text-foreground relative bg-grid-subtle">
      {/* ── Top Sticky Minimalist Navigation ── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border/60 bg-background/70 backdrop-blur-xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-black text-sm tracking-tighter">
            AR
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
            AI Resume Analyzer
            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              v2.0
            </span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          <Link href="#app-tour" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Demo
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#comparison" className="hover:text-foreground transition-colors">
            Sample Results
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-neutral-600" />
            )}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Scan Free
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Minimalist Hero Section ── */}
        <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center pt-16 pb-20 overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.04] dark:bg-primary/[0.08] rounded-full blur-[140px] pointer-events-none" />

          {/* Interactive Fluid Background Splash */}
          <SplashCursor 
            DENSITY_DISSIPATION={1.4}
            VELOCITY_DISSIPATION={1.1}
            SPLAT_RADIUS={0.35}
            SPLAT_FORCE={6500}
            CURL={30}
            COLOR={splashColor}
            RAINBOW_MODE={false}
          />

          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center max-w-4xl">
            {/* Top Monochromatic Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground border border-border mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI ATS Simulation • Scam Shield • Commute Radar</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight mb-6 leading-[1.12]">
              See how hiring algorithms score your resume{" "}
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                before recruiters do.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
              75% of qualified applicants are filtered out before a human ever reads them. We reveal missing keywords, verify company legitimacy, audit commute feasibility, and export an ATS-perfect vector PDF in seconds.
            </p>

            {/* Dynamic Interactive Role Switcher Pill Bar */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-muted/60 dark:bg-muted/40 border border-border/80 backdrop-blur-md mb-8">
              {PREVIEW_ROLES.map((role, idx) => {
                const Icon = role.icon;
                const isSelected = selectedRole === idx;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(idx)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Live Metric Pill reflecting chosen role */}
            <motion.div
              key={activeRole.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted-foreground mb-10"
            >
              <span className="px-2.5 py-1 rounded-lg bg-card/70 border border-border flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">●</span>
                <span className="text-foreground font-semibold">{activeRole.score} Match</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-card/70 border border-border">
                {activeRole.injected}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-card/70 border border-border font-bold text-foreground">
                Est. {activeRole.salary}
              </span>
            </motion.div>

            {/* Minimalist CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
              <Link
                href="/dashboard/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-7 py-3.5 text-sm font-bold hover:opacity-90 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Scan Resume</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#app-tour"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Explore Live Product Tour</span>
              </Link>
            </div>

            {/* Minimalist Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/80 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                100% In-Memory Analysis
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Vector PDF Export
              </span>
            </div>
          </div>

          {/* ── Centerpiece Hero ATS Scanner Graphic ── */}
          <div id="scanner-demo" className="container relative z-10 mx-auto px-4 md:px-6 mt-14 max-w-5xl">
            <HeroScannerGraphic />
          </div>
        </section>

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Minimalist ATS Compatibility Ribbon ── */}
        <AtsPlatformsMarquee />

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Dynamic Product Experience Showcase with Live Timer & Hotspots ── */}
        <AppExperienceShowcase />

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── How It Works ── */}
        <WorkflowSteps />

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Interactive Before vs After Comparison ── */}
        <div id="comparison">
          <InteractiveComparison />
        </div>

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Motion Bento Features Grid ── */}
        <MotionFeaturesGrid />

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Testimonials ── */}
        <TestimonialsMarquee />

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Interactive FAQ Section ── */}
        <LandingFaq />

        {/* ── Minimalist Final CTA ── */}
        <section className="py-24 relative overflow-hidden bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
            <div className="rounded-3xl border border-border bg-card/60 dark:bg-card/30 backdrop-blur-xl p-8 md:p-14 text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Instant Free Analysis</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Stop getting ghosted by automated hiring filters.
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Join thousands of candidates who turned automated rejection into direct interview invitations. Scan your resume in seconds.
                </p>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <Link
                    href="/dashboard/upload"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-bold hover:opacity-90 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Scan Your Resume Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Minimalist Footer ── */}
      <footer className="py-10 px-6 border-t border-border/60 bg-background text-muted-foreground text-xs">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-bold text-xs">
              AR
            </div>
            <span className="font-semibold text-foreground">AI Resume Analyzer</span>
            <span>— Beat the ATS filters.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="#app-tour" className="hover:text-foreground transition-colors">
              Live Demo
            </Link>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors font-semibold text-foreground">
              Pricing
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          <p>© {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
