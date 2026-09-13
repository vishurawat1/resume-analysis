"use client";

import Link from "next/link";
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  UploadCloud, 
  Zap 
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import SplashCursor from "@/components/SplashCursor";
import { AtsPlatformsMarquee } from "@/components/landing/AtsPlatformsMarquee";
import { LiveTelemetryMarquee } from "@/components/landing/LiveTelemetryMarquee";
import { HeroScannerGraphic } from "@/components/landing/HeroScannerGraphic";
import { InteractiveComparison } from "@/components/landing/InteractiveComparison";
import { MotionFeaturesGrid } from "@/components/landing/MotionFeaturesGrid";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { TestimonialsMarquee } from "@/components/landing/TestimonialsMarquee";

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const splashColor = mounted && resolvedTheme === "light" ? "#10b981" : "#3b82f6";

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/25">
      {/* ── Top Sticky Navigation ── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-xl shadow-xs">
            A
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground flex items-center gap-1.5">
            AI Resume Analyzer
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              v2.0
            </span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#scanner-demo" className="hover:text-foreground transition-colors">
            ATS Scanner
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#comparison" className="hover:text-foreground transition-colors">
            Before & After
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            aria-label="Toggle dark mode"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Scan Free
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center pt-16 pb-20 overflow-hidden">
          {/* Interactive Fluid Background Splash */}
          <SplashCursor 
            DENSITY_DISSIPATION={1.2}
            VELOCITY_DISSIPATION={1.0}
            SPLAT_RADIUS={0.4}
            SPLAT_FORCE={8000}
            CURL={35}
            COLOR={splashColor}
            RAINBOW_MODE={false}
          />

          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center max-w-4xl">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6 shadow-xs backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              <span>Next-Gen ATS Parser Simulation • 98.4% Match Accuracy</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-[1.12]">
              See exactly how hiring algorithms{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                score your resume
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              75% of qualified applicants are silently filtered out by Applicant Tracking Systems before a human ever reads them. We reveal missing keywords, fix formatting red flags, and optimize your resume in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/dashboard/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload & Scan Resume</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#scanner-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-8 py-4 text-base font-semibold text-foreground hover:bg-muted transition-all shadow-xs"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>View Live Scanner Demo</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                100% Private & Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Over 45,000 resumes scanned
              </span>
            </div>
          </div>

          {/* ── Centerpiece Auto-Animated Hero ATS Scanner Graphic ── */}
          <div id="scanner-demo" className="container relative z-10 mx-auto px-4 md:px-6 mt-12 max-w-5xl">
            <HeroScannerGraphic />
          </div>
        </section>

        {/* ── Auto-Scrolling ATS Systems Ecosystem Marquee ── */}
        <AtsPlatformsMarquee />

        {/* ── Auto-Scrolling Live Telemetry Ticker Ribbon ── */}
        <LiveTelemetryMarquee />

        {/* ── How It Works Interactive Pipeline ── */}
        <WorkflowSteps />

        {/* ── Interactive Before vs After Comparison ── */}
        <div id="comparison">
          <InteractiveComparison />
        </div>

        {/* ── Motion Bento Features Grid ── */}
        <MotionFeaturesGrid />

        {/* ── Infinite Testimonials & Success Stories Marquee ── */}
        <TestimonialsMarquee />

        {/* ── Final High-Converting Animated CTA Section ── */}
        <section className="py-24 relative overflow-hidden bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-8 md:p-14 text-center shadow-2xl overflow-hidden">
              {/* Radial glow backdrop */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instant Free Analysis
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                  Ready to land your next interview?
                </h2>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Join thousands of applicants who stopped getting ghosted by automated applicant tracking systems. Scan your resume now and get your score in seconds.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/dashboard/upload"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:scale-105"
                  >
                    <UploadCloud className="w-5 h-5" />
                    <span>Scan Your Resume Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-border bg-card/60">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <span className="font-bold text-foreground">AI Resume Analyzer</span>
            <span>— Beat the ATS filters.</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="#scanner-demo" className="hover:text-foreground transition-colors">
              ATS Demo
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">
              Workflow
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
