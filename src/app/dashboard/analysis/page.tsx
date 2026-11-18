/* eslint-disable react-hooks/set-state-in-effect */
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
import { DownloadResumeButton } from "@/components/pdf/DownloadResumeButton";
import { SaveAnalysisButton } from "@/components/analysis/SaveAnalysisButton";
import { ChevronRight, FileText, Loader2, AlertCircle, Sparkles, Target, TrendingUp, FileEdit, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { replaceResumeSubstring } from "@/lib/utils";

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

export default function AnalysisPage() {
  const [fileName, setFileName] = useState("resume.pdf");
  const [error, setError] = useState("");
  
  const [aiResult, setAiResult] = useState<DeepAIResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  const [rawResumeText, setRawResumeText] = useState("");
  const [optimizedResumeText, setOptimizedResumeText] = useState("");
  
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
      let candidateLocation =
        sessionStorage.getItem("userHomeLocation") ||
        (typeof window !== "undefined" ? localStorage.getItem("userHomeLocation") : null) ||
        "";

      // Fallback to Firestore if we have a logged-in user and session is empty
      if (user) {
        try {
          if (!resumeText || !jobDescription) {
            const docRef = doc(db, "users", user.uid, "data", "resume");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              resumeText = data.text;
              jobDescription = data.jobDescription;
              fName = data.fileName;
              jobTitle = data.jobTitle || "";
              company = data.company || "";
              location = data.location || "";
              
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
              sessionStorage.setItem("userHomeLocation", candidateLocation);
            }
          }
        } catch (err) {
          console.error("Failed to fetch resume/settings from Firestore:", err);
        }
      }

      if (fName) setTimeout(() => setFileName(fName), 0);

      if (!resumeText || !jobDescription) {
        setTimeout(() => setError("No resume or job description data found. Please go back and upload your resume."), 0);
        return;
      }

      setRawResumeText(resumeText);
      setOptimizedResumeText(resumeText); // Initialize the optimized version

      // 1. Check if this exact resume and JD was already analyzed in this session
      const cachedAiResultStr = sessionStorage.getItem("aiResult");
      const cachedResume = sessionStorage.getItem("analyzedResumeText");
      const cachedJd = sessionStorage.getItem("analyzedJobDesc");

      if (cachedAiResultStr && cachedResume === resumeText && cachedJd === jobDescription) {
        try {
          const parsed = JSON.parse(cachedAiResultStr);
          if (parsed && typeof parsed.overallScore === "number") {
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
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, jobTitle, company, location, candidateLocation }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setAiError(data.error);
          } else {
            setAiResult(data);
            sessionStorage.setItem("aiResult", JSON.stringify(data));
            sessionStorage.setItem("analyzedResumeText", resumeText);
            sessionStorage.setItem("analyzedJobDesc", jobDescription);
          }
        })
        .catch((err) => {
          console.error("Fetch Error:", err);
          setAiError("A network error occurred while analyzing the resume.");
        })
        .finally(() => setIsAiLoading(false));
    };

    fetchAnalysisData();
  }, [user, authLoading]);

  const handleReanalyze = () => {
    sessionStorage.removeItem("aiResult");
    sessionStorage.removeItem("analyzedResumeText");
    sessionStorage.removeItem("analyzedJobDesc");
    setAiResult(null);
    setAiError("");
    setIsAiLoading(true);

    const resumeText = sessionStorage.getItem("resumeText");
    const jobDescription = sessionStorage.getItem("jobDescription");
    const jobTitle = sessionStorage.getItem("jobTitle") || "";
    const company = sessionStorage.getItem("company") || "";
    const location = sessionStorage.getItem("location") || "";
    const candidateLocation = sessionStorage.getItem("userHomeLocation") || "";

    if (!resumeText || !jobDescription) {
      setError("No resume or job description found to re-analyze.");
      setIsAiLoading(false);
      return;
    }

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription, jobTitle, company, location, candidateLocation }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setAiError(data.error);
        } else {
          setAiResult(data);
          sessionStorage.setItem("aiResult", JSON.stringify(data));
          sessionStorage.setItem("analyzedResumeText", resumeText);
          sessionStorage.setItem("analyzedJobDesc", jobDescription);
        }
      })
      .catch((err) => {
        console.error("Re-analyze Fetch Error:", err);
        setAiError("A network error occurred while re-analyzing.");
      })
      .finally(() => setIsAiLoading(false));
  };

  const handleAcceptSuggestion = (original: string, improved: string) => {
    // Resiliently replace the original string with the improved version in our working draft
    setOptimizedResumeText(prev => replaceResumeSubstring(prev, original, improved));
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
        <Link href="/dashboard/upload" className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Deep AI Analysis</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Performance Report</h1>
          <div className="flex items-center gap-2 mt-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleReanalyze}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Force fresh AI re-analysis against the job description"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-primary ${isAiLoading ? "animate-spin" : ""}`} />
            <span>Re-analyze</span>
          </button>
          <Link
            href="/dashboard/editor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Open in Resume Studio</span>
          </Link>
          <DownloadResumeButton resumeText={optimizedResumeText} fileName={"Optimized_" + fileName} />
          {aiResult && <SaveAnalysisButton resumeText={optimizedResumeText} atsScore={aiResult.overallScore} />}
        </div>
      </div>

      {isAiLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
            <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Running Deep ATS Analysis algorithms...</p>
        </div>
      )}

      {aiError && !isAiLoading && (
        <motion.div variants={itemVariants} className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 shadow-sm flex items-start gap-4 text-destructive">
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
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-2 self-start w-full">Overall ATS Score</h2>
              <div className="flex-1 flex items-center justify-center w-full py-4">
                <AtsScoreRadial score={aiResult.overallScore} />
              </div>
              <div className="w-full mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3">
                <div className="p-2 bg-primary/20 text-primary rounded-full">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Potential Target</p>
                  <p className="font-bold text-foreground">{aiResult.overallScore + aiResult.improvementImpact}/100</p>
                </div>
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Section Strengths</h2>
              </div>
              <ResumeRadarChart sectionScores={aiResult.sectionScores} />
            </motion.div>

            {/* Section Breakdown */}
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
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
            <motion.div variants={itemVariants} className={`${aiResult.seniorityFit ? "lg:col-span-2" : "lg:col-span-2"} bg-card border border-border rounded-xl p-6 shadow-sm space-y-4`}>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-foreground">Role Fit Analysis</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {aiResult.roleFitAnalysis}
              </p>
            </motion.div>

            {aiResult.seniorityFit ? (
              <motion.div variants={itemVariants}>
                <SeniorityMarketCard data={aiResult.seniorityFit} />
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Keyword Gap</h2>
                <div className="flex flex-wrap gap-2">
                  {aiResult.keywordAnalysis.missing.length > 0 ? (
                    aiResult.keywordAnalysis.missing.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20">
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
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Keyword Optimization & Coverage</h2>
                  <p className="text-xs text-muted-foreground">Critical target skills and ATS keyword saturation</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Keyword Match:</span>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/20">
                    {aiResult.keywordAnalysis.density}%
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiResult.keywordAnalysis.missing.length > 0 ? (
                  aiResult.keywordAnalysis.missing.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20">
                      + Missing: {kw}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Excellent! No critical tech stack keywords are missing from your resume.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Weaknesses and Strengths */}
          <motion.div variants={itemVariants}>
            <ResumeWeaknessCard weaknesses={aiResult.weaknesses} strengths={aiResult.strengths} />
          </motion.div>

          {/* Interactive Improvement Engine */}
          <motion.div variants={itemVariants} className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Interactive AI Improvements</h2>
                <p className="text-muted-foreground text-sm">Review the AI-generated suggestions below or embed them live on a visual document canvas.</p>
              </div>
              <Link
                href="/dashboard/editor"
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold hover:bg-primary/90 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>Live Canvas Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {aiResult.suggestions.length > 0 ? (
                aiResult.suggestions.map((sug, index) => (
                  <ImprovementSuggestionCard
                    key={index}
                    suggestion={sug}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                  />
                ))
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  Your resume is highly optimized! No major structural improvements suggested.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
