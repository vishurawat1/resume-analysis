"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Upload,
  ArrowRight,
  BarChart3,
  Wand2,
  FileCode2,
  CheckCircle2,
  Circle,
  MapPin,
  Target,
  GitBranch,
  Settings,
  Loader2,
  Rocket,
  FileEdit,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface ResumeData {
  fileName?: string;
  updatedAt?: string;
  text?: string;
  jobDescription?: string;
  atsScore?: number;
}

interface ProfileDefaults {
  homeLocation: string;
  targetTrack: string;
  githubUsername: string;
  hasSessionResume: boolean;
  hasAtsOrLatex: boolean;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDefaults>({
    homeLocation: "",
    targetTrack: "",
    githubUsername: "",
    hasSessionResume: false,
    hasAtsOrLatex: false,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      await Promise.resolve();
      if (cancelled) return;

      let localHome = localStorage.getItem("userHomeLocation") || "";
      let localTrack = localStorage.getItem("userTargetTrack") || "";
      let localGithub = localStorage.getItem("userGithubUsername") || "";

      const sessionResume = Boolean(sessionStorage.getItem("resumeText"));
      const hasCachedAi = Boolean(sessionStorage.getItem("aiResult"));
      const hasLatex = Boolean(sessionStorage.getItem("resumeLatexSource"));
      let hasScanHistory = false;
      try {
        const rawHistory = localStorage.getItem("recentScansHistory");
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed) && parsed.length > 0) hasScanHistory = true;
        }
      } catch {
        // ignore malformed history
      }

      if (!user) {
        setProfile({
          homeLocation: localHome,
          targetTrack: localTrack,
          githubUsername: localGithub,
          hasSessionResume: sessionResume,
          hasAtsOrLatex: hasCachedAi || hasLatex || hasScanHistory,
        });
        setLoading(false);
        return;
      }

      try {
        const [resumeSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid, "data", "resume")),
          getDoc(doc(db, "users", user.uid, "data", "settings")),
        ]);

        if (cancelled) return;

        let loadedResume: ResumeData | null = null;
        if (resumeSnap.exists()) {
          loadedResume = resumeSnap.data() as ResumeData;
          setResumeData(loadedResume);
        }

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          if (settingsData?.homeLocation && !localHome) {
            localHome = settingsData.homeLocation;
            localStorage.setItem("userHomeLocation", localHome);
          }
          if (settingsData?.targetTrack && !localTrack) {
            localTrack = settingsData.targetTrack;
            localStorage.setItem("userTargetTrack", localTrack);
          }
          if (settingsData?.githubUsername && !localGithub) {
            localGithub = settingsData.githubUsername;
            localStorage.setItem("userGithubUsername", localGithub);
          }
          if (settingsData?.preferredLatexTemplate && !localStorage.getItem("userPreferredLatexTemplate")) {
            localStorage.setItem("userPreferredLatexTemplate", settingsData.preferredLatexTemplate);
          }
        }

        setProfile({
          homeLocation: localHome,
          targetTrack: localTrack,
          githubUsername: localGithub,
          hasSessionResume: sessionResume || Boolean(loadedResume?.text),
          hasAtsOrLatex:
            hasCachedAi ||
            hasLatex ||
            hasScanHistory ||
            typeof loadedResume?.atsScore === "number",
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasResumeUploaded = Boolean(resumeData?.text || profile.hasSessionResume);
  const hasSettingsConfigured = Boolean(profile.homeLocation || profile.targetTrack);
  const hasAtsOrLatex = profile.hasAtsOrLatex;

  const journeySteps = [
    {
      label: "Resume uploaded",
      done: hasResumeUploaded,
      href: "/dashboard/upload",
      cta: hasResumeUploaded ? "Update" : "Upload now",
    },
    {
      label: "Home Location / Track configured",
      done: hasSettingsConfigured,
      href: "/dashboard/settings",
      cta: hasSettingsConfigured ? "Edit" : "Configure",
    },
    {
      label: "ATS Scan / LaTeX PDF built",
      done: hasAtsOrLatex,
      href: hasResumeUploaded ? "/dashboard/analysis" : "/dashboard/editor",
      cta: hasAtsOrLatex ? "Open" : "Launch",
    },
  ];

  const completedCount = journeySteps.filter((step) => step.done).length;
  const progressPercent = Math.round((completedCount / journeySteps.length) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {/* Hero Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/85 to-primary/65 p-7 sm:p-8 text-primary-foreground shadow-lg"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.displayName || "Builder"}
            </h1>
            <p className="text-primary-foreground/85 text-sm sm:text-base">
              Your AI-powered career command center. Scan any job URL, tailor an Overleaf LaTeX resume, rewrite bullets from GitHub, and rehearse tailored interview questions.
            </p>

            {/* Saved Career Identity Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {profile.targetTrack && (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-medium border border-white/20 transition-colors"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{profile.targetTrack}</span>
                </Link>
              )}
              {profile.homeLocation && (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-medium border border-white/20 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.homeLocation}</span>
                </Link>
              )}
              {profile.githubUsername && (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-medium border border-white/20 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>@{profile.githubUsername}</span>
                </Link>
              )}
              {!profile.targetTrack && !profile.homeLocation && !profile.githubUsername && (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-medium border border-white/20 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Set Target Track, Home Location &amp; GitHub Handle</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Scan Resume + JD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold hover:bg-white/25 transition-colors border border-white/25"
            >
              <FileCode2 className="w-4 h-4" />
              <span>LaTeX Studio</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Getting Started / Readiness Journey */}
      <motion.div
        variants={itemVariants}
        className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Readiness Journey</h2>
              <p className="text-xs text-muted-foreground">
                Complete these 3 setup milestones for sharper ATS scoring, commute radar, and LaTeX builds.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
            {completedCount} of {journeySteps.length} complete
          </span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {journeySteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={cn(
                "flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all",
                step.done
                  ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/40"
                  : "bg-background border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground truncate">
                  {step.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold shrink-0",
                  step.done ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                )}
              >
                {step.cta}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* 4 Balanced Responsive Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Link
            href="/dashboard/upload"
            className="group h-full flex flex-col justify-between bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Scan Resume + JD</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload PDF/DOCX, import Job URL, or try sample presets
                </p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Start scan <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            href="/dashboard/editor"
            className="group h-full flex flex-col justify-between bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">LaTeX Studio (Overleaf)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  6 ATS templates, visual form editor &amp; live PDF compiler
                </p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open studio <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            href="/dashboard/enhancer"
            className="group h-full flex flex-col justify-between bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Bullet &amp; GitHub Rewriter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Google XYZ polish &amp; GitHub repo bullet generator
                </p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Enhance bullets <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            href="/dashboard/analysis"
            className="group h-full flex flex-col justify-between bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">ATS Report + Career Kit</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Match radar, cover letter LaTeX &amp; interview prep
                </p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              View report <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Active Resume Card */}
      <motion.div
        variants={itemVariants}
        className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Active Resume</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The resume currently tied to your profile and ready for ATS scans or LaTeX editing.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload New
          </Link>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your workspace...</p>
            </div>
          ) : resumeData ? (
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1 sm:mt-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{resumeData.fileName || "Resume"}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last updated:{" "}
                      {resumeData.updatedAt
                        ? new Date(resumeData.updatedAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                    {typeof resumeData.atsScore === "number" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Last ATS Score: {resumeData.atsScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <Link
                  href="/dashboard/analysis"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  View Analysis
                </Link>
                <Link
                  href="/dashboard/editor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  LaTeX Studio
                </Link>
                <Link
                  href="/dashboard/review"
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Health Audit
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No Resume Found</h3>
              <p className="text-muted-foreground max-w-sm">
                You haven&apos;t uploaded a resume yet. Upload a PDF/DOCX or load our 1-click sample resume to get started.
              </p>
              <Link
                href="/dashboard/upload"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload or Try Sample
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
