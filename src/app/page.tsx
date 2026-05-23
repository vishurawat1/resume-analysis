"use client";

import Link from "next/link";
import { AlertCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import SplashCursor from "@/components/SplashCursor";

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const splashColor = mounted && resolvedTheme === "light" ? "#10b981" : "#3b82f6";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xl">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight">
            AI Resume Analyzer
          </span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#demo" className="hover:text-foreground transition-colors">How it works</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-24 md:py-32 overflow-hidden">
          <SplashCursor 
            DENSITY_DISSIPATION={1.2}
            VELOCITY_DISSIPATION={1.0}
            SPLAT_RADIUS={0.4}
            SPLAT_FORCE={8000}
            CURL={35}
            COLOR={splashColor}
            RAINBOW_MODE={false}
          />
          <div className="container relative z-10 mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              See exactly how hiring software reads your resume.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-[1.6]">
              Companies use Applicant Tracking Systems (ATS) to filter resumes. We scan your resume against the job description and tell you what keywords you&apos;re missing before you apply.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard/upload"
                className="w-full sm:w-auto rounded-md bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Scan your resume
              </Link>
            </div>
          </div>
        </section>

        {/* Concrete Proof Section */}
        <section id="demo" className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Here is what the analysis actually looks like</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-[1.6]">
                Instead of guessing why you didn&apos;t get a callback, you get a straightforward list of missing skills and formatting errors.
              </p>
            </div>

            <div className="bg-background rounded-xl border border-border shadow-sm p-8 max-w-3xl mx-auto flex flex-col md:flex-row gap-12 items-center">
              
              {/* Fake Score Radial */}
              <div className="flex flex-col items-center justify-center text-center shrink-0">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                    <circle
                      cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent"
                      strokeDasharray={2 * Math.PI * 72}
                      strokeDashoffset={2 * Math.PI * 72 * (1 - 45 / 100)}
                      className="text-red-500"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold">45</span>
                    <span className="text-sm text-muted-foreground font-medium uppercase mt-1">Weak Match</span>
                  </div>
                </div>
              </div>

              {/* Fake Missing Keywords */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold text-lg text-foreground">Missing Critical Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "Docker", "AWS"].map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm font-medium border border-red-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-[1.6] mt-4">
                  The job description mentions these technologies 14 times, but they appear 0 times on your resume. Adding these will significantly boost your ATS ranking.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border">
        <p>© 2026 AI Resume Analyzer.</p>
      </footer>
    </div>
  );
}

