"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AtsScoreRadial } from "@/components/analytics/AtsScoreRadial";
import { ResumeRadarChart } from "@/components/analytics/ResumeRadarChart";
import { SectionAnalysisCard } from "@/components/analytics/SectionAnalysisCard";
import { ResumeWeaknessCard } from "@/components/analysis/ResumeWeaknessCard";
import { ImprovementSuggestionCard, Suggestion } from "@/components/analysis/ImprovementSuggestionCard";
import { LocationIntelligenceCard, LocationIntelligence } from "@/components/analysis/LocationIntelligenceCard";
import { CompanyIntelligenceCard, CompanyIntelligence } from "@/components/analysis/CompanyIntelligenceCard";
import { SeniorityMarketCard, SeniorityFit } from "@/components/analysis/SeniorityMarketCard";
import { CareerKitSection } from "@/components/analysis/CareerKitSection";
import { DownloadResumeButton } from "@/components/pdf/DownloadResumeButton";
import { SaveAnalysisButton } from "@/components/analysis/SaveAnalysisButton";
import {
  ChevronRight,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  FileEdit,
  ArrowRight,
  RotateCcw,
  History,
  PlusCircle,
  Briefcase,
  X,
  CheckCircle2,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn, replaceResumeSubstring } from "@/lib/utils";
import { getUserLocalItem, getUserPref, setUserLocalItem, setUserPref } from "@/lib/userStorage";
import { authFetch } from "@/lib/apiClient";

interface DeepAIResult {
  overallScore: number;
  roleFitAnalysis: string;
  sectionScores: Record<string, number>;
  weaknesses: string[];
  strengths: string[];
  suggestions: Suggestion[];
  keywordAnalysis: {
    missing: string[];
    density: number;
  };
  improvementImpact: number;
  locationIntelligence?: LocationIntelligence;
  companyIntelligence?: CompanyIntelligence;
  seniorityFit?: SeniorityFit;
}

interface ScanSnapshot {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
  result: DeepAIResult;
  scannedAt: string;
  fileName?: string;
}

const RECENT_SCANS_KEY = "recentScansHistory";
const MAX_RECENT_SCANS = 5;

function loadRecentScans(uid?: string | null): ScanSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getUserLocalItem(RECENT_SCANS_KEY, uid);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ScanSnapshot =>
          Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.jobDescription === "string" &&
              item.result &&
              typeof item.result.overallScore === "number"
          )
      )
      .slice(0, MAX_RECENT_SCANS);
  } catch {
    return [];
  }
}

function getScanFingerprint(jobTitle: string, company: string, jobDescription: string): string {
  return `${jobTitle.trim().toLowerCase()}::${company.trim().toLowerCase()}::${jobDescription
    .trim()
    .slice(0, 350)
    .toLowerCase()}`;
}

function upsertRecentScan(input: {
  uid?: string | null;
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
  result: DeepAIResult;
  fileName?: string;
}): { scans: ScanSnapshot[]; activeId: string } {
  const existing = loadRecentScans(input.uid);
  const fp = getScanFingerprint(input.jobTitle, input.company, input.jobDescription);
  const now = new Date().toISOString();

  const matchIdx = existing.findIndex(
    (s) => getScanFingerprint(s.jobTitle, s.company, s.jobDescription) === fp
  );

  let activeId: string;
  let next: ScanSnapshot[];

  if (matchIdx !== -1) {
    activeId = existing[matchIdx].id;
    const updated: ScanSnapshot = {
      ...existing[matchIdx],
      jobTitle: input.jobTitle,
      company: input.company,
      location: input.location,
      jobDescription: input.jobDescription,
      result: input.result,
      fileName: input.fileName || existing[matchIdx].fileName,
      scannedAt: now,
    };
    next = [updated, ...existing.filter((_, i) => i !== matchIdx)].slice(0, MAX_RECENT_SCANS);
  } else {
    activeId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const created: ScanSnapshot = {
      id: activeId,
      jobTitle: input.jobTitle,
      company: input.company,
      location: input.location,
      jobDescription: input.jobDescription,
      result: input.result,
      fileName: input.fileName,
      scannedAt: now,
    };
    next = [created, ...existing].slice(0, MAX_RECENT_SCANS);
  }

  setUserLocalItem(RECENT_SCANS_KEY, JSON.stringify(next), input.uid);

  return { scans: next, activeId };
}

function formatScanLabel(scan: ScanSnapshot): string {
  const title = scan.jobTitle?.trim();
  const comp = scan.company?.trim();
  if (title && comp) return `${title} @ ${comp}`;
  if (title) return title;
  if (comp) return `${comp} Role`;
  const firstLine = scan.jobDescription.trim().split(/\r?\n/)[0]?.slice(0, 28);
  return firstLine ? `${firstLine}${scan.jobDescription.length > 28 ? "..." : ""}` : "Target Role";
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 60000) return "Just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AnalysisPage() {
  const router = useRouter();

  const [fileName, setFileName] = useState("resume.pdf");
  const [error, setError] = useState("");

  const [aiResult, setAiResult] = useState<DeepAIResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [rawResumeText, setRawResumeText] = useState("");
  const [optimizedResumeText, setOptimizedResumeText] = useState("");
  const [acceptedCount, setAcceptedCount] = useState(0);

  const [activeJobTitle, setActiveJobTitle] = useState("");
  const [activeCompany, setActiveCompany] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [activeJobDescription, setActiveJobDescription] = useState("");

  const [recentScans, setRecentScans] = useState<ScanSnapshot[]>([]);
  const [activeScanId, setActiveScanId] = useState<string>("");

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const fetchAnalysisData = async () => {
      let resumeText = sessionStorage.getItem("resumeText");
      let jobDescription = sessionStorage.getItem("jobDescription");
      let fName = sessionStorage.getItem("fileName");
      let jobTitle = sessionStorage.getItem("jobTitle") || "";
      let company = sessionStorage.getItem("company") || "";
      let location = sessionStorage.getItem("location") || "";
      let candidateLocation = getUserPref("userHomeLocation", user?.uid);

      // Fallback to Firestore if we have a logged-in user and session is empty
      if (user) {
        try {
          if (!resumeText || !jobDescription) {
            const docRef = doc(db, "users", user.uid, "data", "resume");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              resumeText = resumeText || data.text;
              jobDescription = jobDescription || data.jobDescription;
              fName = fName || data.fileName;
              jobTitle = jobTitle || data.jobTitle || "";
              company = company || data.company || "";
              location = location || data.location || "";

              // Re-hydrate session storage
              if (resumeText) sessionStorage.setItem("resumeText", resumeText);
              if (jobDescription) sessionStorage.setItem("jobDescription", jobDescription);
              if (fName) sessionStorage.setItem("fileName", fName);
              if (jobTitle) sessionStorage.setItem("jobTitle", jobTitle);
              if (company) sessionStorage.setItem("company", company);
              if (location) sessionStorage.setItem("location", location);
            }
          }

          if (!candidateLocation) {
            const settingsRef = doc(db, "users", user.uid, "data", "settings");
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists() && settingsSnap.data()?.homeLocation) {
              candidateLocation = settingsSnap.data().homeLocation;
              setUserPref("userHomeLocation", candidateLocation, user.uid);
            }
          }
        } catch (err) {
          console.error("Failed to fetch resume/settings from Firestore:", err);
        }
      }

      const existingHistory = loadRecentScans(user?.uid);
      setRecentScans(existingHistory);

      // If resume exists but JD was cleared, restore latest snapshot cleanly
      if (resumeText && !jobDescription && existingHistory.length > 0) {
        const latest = existingHistory[0];
        jobDescription = latest.jobDescription;
        jobTitle = latest.jobTitle;
        company = latest.company;
        location = latest.location;
        sessionStorage.setItem("jobDescription", jobDescription);
        sessionStorage.setItem("jobTitle", jobTitle);
        sessionStorage.setItem("company", company);
        sessionStorage.setItem("location", location);
        sessionStorage.setItem("aiResult", JSON.stringify(latest.result));
        sessionStorage.setItem("analyzedResumeText", resumeText);
        sessionStorage.setItem("analyzedJobDesc", jobDescription);
      }

      const resolvedFileName = fName || "resume.pdf";
      setFileName(resolvedFileName);

      if (!resumeText || !jobDescription) {
        setError("No resume or job description data found. Please go back and upload your resume.");
        return;
      }

      setRawResumeText(resumeText);
      setOptimizedResumeText(resumeText);
      setActiveJobTitle(jobTitle);
      setActiveCompany(company);
      setActiveLocation(location);
      setActiveJobDescription(jobDescription);

      // 1. Check if this exact resume and JD was already analyzed in this session
      const cachedAiResultStr = sessionStorage.getItem("aiResult");
      const cachedResume = sessionStorage.getItem("analyzedResumeText");
      const cachedJd = sessionStorage.getItem("analyzedJobDesc");

      if (cachedAiResultStr && cachedResume === resumeText && cachedJd === jobDescription) {
        try {
          const parsed = JSON.parse(cachedAiResultStr) as DeepAIResult;
          if (parsed && typeof parsed.overallScore === "number") {
            const { scans, activeId } = upsertRecentScan({
              uid: user?.uid,
              jobTitle,
              company,
              location,
              jobDescription,
              result: parsed,
              fileName: resolvedFileName,
            });
            setRecentScans(scans);
            setActiveScanId(activeId);
            setAiResult(parsed);
            setIsAiLoading(false);
            return; // Instant cache load
          }
        } catch {
          // Fall through to network fetch
        }
      }

      // 2. Call Deep AI Analysis
      setIsAiLoading(true);
      try {
        const res = await authFetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            jobDescription,
            jobTitle,
            company,
            location,
            candidateLocation,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setAiError(data.error);
        } else {
          const { scans, activeId } = upsertRecentScan({
            uid: user?.uid,
            jobTitle,
            company,
            location,
            jobDescription,
            result: data as DeepAIResult,
            fileName: resolvedFileName,
          });
          setRecentScans(scans);
          setActiveScanId(activeId);
          setAiResult(data);
          sessionStorage.setItem("aiResult", JSON.stringify(data));
          sessionStorage.setItem("analyzedResumeText", resumeText);
          sessionStorage.setItem("analyzedJobDesc", jobDescription);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setAiError("A network error occurred while analyzing the resume.");
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAnalysisData();
  }, [user, authLoading]);

  const handleReanalyze = async () => {
    const resumeText = rawResumeText || sessionStorage.getItem("resumeText") || "";
    const jobDescription = activeJobDescription || sessionStorage.getItem("jobDescription") || "";
    const jobTitle = activeJobTitle || sessionStorage.getItem("jobTitle") || "";
    const company = activeCompany || sessionStorage.getItem("company") || "";
    const location = activeLocation || sessionStorage.getItem("location") || "";
    const candidateLocation = getUserPref("userHomeLocation", user?.uid);

    if (!resumeText || !jobDescription) {
      setError("No resume or job description found to re-analyze.");
      setIsAiLoading(false);
      return;
    }

    sessionStorage.removeItem("aiResult");
    sessionStorage.removeItem("analyzedResumeText");
    sessionStorage.removeItem("analyzedJobDesc");
    setAiResult(null);
    setAiError("");
    setIsAiLoading(true);

    try {
      const res = await authFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle,
          company,
          location,
          candidateLocation,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAiError(data.error);
      } else {
        const { scans, activeId } = upsertRecentScan({
          uid: user?.uid,
          jobTitle,
          company,
          location,
          jobDescription,
          result: data as DeepAIResult,
          fileName,
        });
        setRecentScans(scans);
        setActiveScanId(activeId);
        setAiResult(data);
        sessionStorage.setItem("aiResult", JSON.stringify(data));
        sessionStorage.setItem("analyzedResumeText", resumeText);
        sessionStorage.setItem("analyzedJobDesc", jobDescription);
      }
    } catch (err) {
      console.error("Re-analyze Fetch Error:", err);
      setAiError("A network error occurred while re-analyzing.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectScan = (scan: ScanSnapshot) => {
    setActiveScanId(scan.id);
    setAiResult(scan.result);
    setAiError("");
    setIsAiLoading(false);
    setActiveJobTitle(scan.jobTitle);
    setActiveCompany(scan.company);
    setActiveLocation(scan.location);
    setActiveJobDescription(scan.jobDescription);
    setOptimizedResumeText(rawResumeText);
    setAcceptedCount(0);

    sessionStorage.setItem("aiResult", JSON.stringify(scan.result));
    sessionStorage.setItem("jobTitle", scan.jobTitle);
    sessionStorage.setItem("company", scan.company);
    sessionStorage.setItem("location", scan.location);
    sessionStorage.setItem("jobDescription", scan.jobDescription);
    sessionStorage.setItem("analyzedJobDesc", scan.jobDescription);
    if (rawResumeText) {
      sessionStorage.setItem("analyzedResumeText", rawResumeText);
    }
  };

  const handleRemoveScan = (scanId: string) => {
    const next = recentScans.filter((s) => s.id !== scanId);
    setRecentScans(next);
    setUserLocalItem(RECENT_SCANS_KEY, JSON.stringify(next), user?.uid);
  };

  const handleOpenInLatexStudio = (options?: {
    pendingBullet?: string;
    useOptimizedDraft?: boolean;
  }) => {
    const baseText =
      options?.useOptimizedDraft || acceptedCount > 0
        ? optimizedResumeText
        : rawResumeText || optimizedResumeText;

    if (baseText) {
      sessionStorage.setItem("resumeText", baseText);
    }
    if (fileName) {
      sessionStorage.setItem("fileName", fileName);
    }
    if (aiResult) {
      sessionStorage.setItem("aiResult", JSON.stringify(aiResult));
    }
    sessionStorage.setItem("jobTitle", activeJobTitle);
    sessionStorage.setItem("company", activeCompany);
    sessionStorage.setItem("location", activeLocation);
    sessionStorage.setItem("jobDescription", activeJobDescription);
    sessionStorage.setItem("pendingLatexMode", "resume");

    if (options?.pendingBullet) {
      sessionStorage.setItem("pendingLatexBullet", options.pendingBullet);
    } else if (options?.useOptimizedDraft && acceptedCount > 0) {
      // Force LaTeX Studio to rebuild main.tex from the newly accepted bullet upgrades
      sessionStorage.removeItem("resumeLatexSource");
      sessionStorage.removeItem("resumeStructuredData");
      sessionStorage.removeItem("pendingLatexSource");
    }

    router.push("/dashboard/editor");
  };

  const handleAcceptSuggestion = (original: string, improved: string) => {
    setOptimizedResumeText((prev) => replaceResumeSubstring(prev, original, improved));
    setAcceptedCount((c) => c + 1);
  };

  const handleRejectSuggestion = () => {
    // Do nothing to the draft, the card will hide itself
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-muted-foreground">{error}</p>
        <Link
          href="/dashboard/upload"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          Upload Resume
        </Link>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const bestScan = recentScans.reduce<ScanSnapshot | null>((best, curr) => {
    if (!best || curr.result.overallScore > best.result.overallScore) return curr;
    return best;
  }, null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Deep AI Analysis</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Performance Report</h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              {fileName}
            </span>
            {(activeJobTitle || activeCompany) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Briefcase className="w-3 h-3" />
                {[activeJobTitle, activeCompany].filter(Boolean).join(" • ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Force fresh AI re-analysis against the job description"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-primary ${isAiLoading ? "animate-spin" : ""}`} />
            <span>Re-analyze</span>
          </button>

          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-primary" />
            <span>Analyze Another JD</span>
          </Link>

          <button
            type="button"
            onClick={() => handleOpenInLatexStudio({ useOptimizedDraft: acceptedCount > 0 })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Open in LaTeX Studio</span>
          </button>

          <DownloadResumeButton resumeText={optimizedResumeText} fileName={"Optimized_" + fileName} />
          {aiResult && (
            <SaveAnalysisButton resumeText={optimizedResumeText} atsScore={aiResult.overallScore} />
          )}
        </div>
      </div>

      {/* Recent Scans / Role Switcher & Re-Analyze Bar */}
      {recentScans.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <History className="w-3.5 h-3.5 text-primary" />
                Recent Scans &amp; Role Comparison ({recentScans.length}/{MAX_RECENT_SCANS})
              </span>
              {recentScans.length > 1 && bestScan && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Best match: {formatScanLabel(bestScan)} ({bestScan.result.overallScore})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              {aiResult && (
                <a
                  href="#career-kit"
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  <span>Jump to Career Kit</span>
                </a>
              )}
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Compare New JD</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {recentScans.map((scan) => {
              const isActive = scan.id === activeScanId;
              const currentScore = aiResult?.overallScore;
              const delta =
                typeof currentScore === "number" && !isActive
                  ? scan.result.overallScore - currentScore
                  : null;

              return (
                <div
                  key={scan.id}
                  className={cn(
                    "inline-flex items-center rounded-xl border transition-all text-xs",
                    isActive
                      ? "bg-primary/10 border-primary/50 text-foreground shadow-2xs"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectScan(scan)}
                    aria-pressed={isActive}
                    className="inline-flex items-center gap-2 px-3 py-1.5 cursor-pointer text-left"
                  >
                    <span className="font-semibold text-foreground max-w-[190px] truncate">
                      {formatScanLabel(scan)}
                    </span>

                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold",
                        scan.result.overallScore >= 80
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : scan.result.overallScore >= 60
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {scan.result.overallScore}
                    </span>

                    {isActive ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Active
                      </span>
                    ) : delta !== null ? (
                      <span
                        title={`${Math.abs(delta)} points ${
                          delta > 0 ? "higher" : delta < 0 ? "lower" : "same"
                        } than active scan`}
                        className={cn(
                          "font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          delta > 0
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : delta < 0
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}
                      </span>
                    ) : null}

                    <span className="hidden md:inline text-[10px] text-muted-foreground">
                      {formatRelativeTime(scan.scannedAt)}
                    </span>
                  </button>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScan(scan.id)}
                      aria-label={`Remove ${formatScanLabel(scan)} from scan history`}
                      className="pr-2 pl-1 py-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAiLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
            <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">
            Running Deep ATS Analysis algorithms...
          </p>
        </div>
      )}

      {aiError && !isAiLoading && (
        <motion.div
          variants={itemVariants}
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 shadow-sm flex items-start gap-4 text-destructive"
        >
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">AI Analysis Failed</h3>
            <p className="text-sm mt-1 leading-relaxed opacity-90">{aiError}</p>
          </div>
        </motion.div>
      )}

      {aiResult && !isAiLoading && (
        <>
          {/* Top Level Scores */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Overall Score */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center"
            >
              <h2 className="text-lg font-semibold mb-2 self-start w-full">Overall ATS Score</h2>
              <div className="flex-1 flex items-center justify-center w-full py-4">
                <AtsScoreRadial score={aiResult.overallScore} />
              </div>
              <div className="w-full mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3">
                <div className="p-2 bg-primary/20 text-primary rounded-full">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Potential Target
                  </p>
                  <p className="font-bold text-foreground">
                    {Math.min(100, aiResult.overallScore + aiResult.improvementImpact)}/100
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Section Strengths</h2>
              </div>
              <ResumeRadarChart sectionScores={aiResult.sectionScores} />
            </motion.div>

            {/* Section Breakdown */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col"
            >
              <h2 className="text-lg font-semibold mb-6">Detailed Breakdown</h2>
              <div className="flex-1 flex items-center">
                <SectionAnalysisCard sectionScores={aiResult.sectionScores} />
              </div>
            </motion.div>
          </div>

          {/* Company Legitimacy & Location Radar */}
          {(aiResult.companyIntelligence || aiResult.locationIntelligence) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {aiResult.companyIntelligence && (
                <motion.div variants={itemVariants}>
                  <CompanyIntelligenceCard data={aiResult.companyIntelligence} />
                </motion.div>
              )}
              {aiResult.locationIntelligence && (
                <motion.div variants={itemVariants}>
                  <LocationIntelligenceCard data={aiResult.locationIntelligence} />
                </motion.div>
              )}
            </div>
          )}

          {/* Role Fit, Seniority & Keywords */}
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-foreground">Role Fit Analysis</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{aiResult.roleFitAnalysis}</p>
            </motion.div>

            {aiResult.seniorityFit ? (
              <motion.div variants={itemVariants}>
                <SeniorityMarketCard data={aiResult.seniorityFit} />
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4"
              >
                <h2 className="text-lg font-semibold text-foreground">Keyword Gap</h2>
                <div className="flex flex-wrap gap-2">
                  {aiResult.keywordAnalysis.missing.length > 0 ? (
                    aiResult.keywordAnalysis.missing.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No critical keywords missing.</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Keyword Density</span>
                  <span className="font-semibold">{aiResult.keywordAnalysis.density}%</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Keyword Gap standalone if SeniorityCard is shown */}
          {aiResult.seniorityFit && (
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Keyword Optimization &amp; Coverage
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Critical target skills and ATS keyword saturation
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Keyword Match:</span>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/20">
                      {aiResult.keywordAnalysis.density}%
                    </span>
                  </div>
                  {aiResult.keywordAnalysis.missing.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenInLatexStudio()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-primary" />
                      <span>Fix in LaTeX Studio</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiResult.keywordAnalysis.missing.length > 0 ? (
                  aiResult.keywordAnalysis.missing.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20"
                    >
                      + Missing: {kw}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Excellent! No critical tech stack keywords are missing from your resume.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Weaknesses and Strengths */}
          <motion.div variants={itemVariants} className="space-y-3">
            <ResumeWeaknessCard
              weaknesses={aiResult.weaknesses}
              strengths={aiResult.strengths}
            />
          </motion.div>

          {/* Interactive Improvement Engine */}
          <motion.div variants={itemVariants} className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Interactive AI Improvements
                  </h2>
                  {acceptedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {acceptedCount} applied to draft
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  Review the AI-generated suggestions below or deep-link any upgrade straight into LaTeX Studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenInLatexStudio({ useOptimizedDraft: acceptedCount > 0 })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold hover:bg-primary/90 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>
                  {acceptedCount > 0
                    ? "Build Upgraded Resume in LaTeX Studio"
                    : "Open LaTeX Studio (Overleaf)"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {aiResult.suggestions.length > 0 ? (
                aiResult.suggestions.map((sug, index) => (
                  <div key={index} className="space-y-2">
                    <ImprovementSuggestionCard
                      suggestion={sug}
                      onAccept={handleAcceptSuggestion}
                      onReject={handleRejectSuggestion}
                    />
                    <div className="flex justify-end px-1">
                      <button
                        type="button"
                        onClick={() => handleOpenInLatexStudio({ pendingBullet: sug.improved })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Fix in LaTeX Studio (Insert Improved Bullet)</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  Your resume is highly optimized! No major structural improvements suggested.
                </div>
              )}
            </div>
          </motion.div>

          {/* Tailored Career Kit (Cover Letter + Top 5 Interview Prep) */}
          <motion.div variants={itemVariants} className="pt-2">
            <CareerKitSection
              key={activeScanId || "active-scan"}
              resumeText={rawResumeText || optimizedResumeText}
              jobDescription={activeJobDescription}
              jobTitle={activeJobTitle}
              company={activeCompany}
              weaknesses={aiResult.weaknesses}
              missingKeywords={aiResult.keywordAnalysis.missing}
              scanId={activeScanId || undefined}
            />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
