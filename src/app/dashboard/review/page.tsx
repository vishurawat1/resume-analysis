/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dropzone } from "@/components/ui/Dropzone";
import { Sparkles, AlertCircle, FileText, CheckCircle2, XCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ImprovementSuggestionCard, Suggestion } from "@/components/analysis/ImprovementSuggestionCard";
import { DownloadResumeButton } from "@/components/pdf/DownloadResumeButton";

interface ReviewAddon {
  category: string;
  suggestion: string;
}

interface ReviewResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommended_addons: ReviewAddon[];
  summary: string;
  suggestions?: Suggestion[];
}

export default function ReviewPage() {
  const [resumeText, setResumeText] = useState("");
  const [optimizedResumeText, setOptimizedResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [reviewError, setReviewError] = useState("");

  const handleAcceptSuggestion = (original: string, improved: string) => {
    setOptimizedResumeText(prev => prev.replace(original, improved));
  };

  const handleRejectSuggestion = () => {
    // Hidden locally inside the card
  };

  const analyzeResume = async (text: string) => {
    setIsReviewing(true);
    setReviewError("");
    setReviewResult(null);
    setOptimizedResumeText(text);

    try {
      // Small random query param to bust frontend cache just in case
      const res = await fetch("/api/review-resume?t=" + Date.now(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setReviewResult(data);
    } catch (err: unknown) {
      console.error(err);
      setReviewError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsReviewing(false);
    }
  };

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    const fetchResume = async () => {
      let text = sessionStorage.getItem("resumeText");
      let fName = sessionStorage.getItem("fileName");
      
      if (!text && user) {
        try {
          const docRef = doc(db, "users", user.uid, "data", "resume");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            text = data.text;
            fName = data.fileName;
            if (text) sessionStorage.setItem("resumeText", text);
            if (fName) sessionStorage.setItem("fileName", fName);
          }
        } catch (err) {
          console.error("Failed to fetch resume from Firestore:", err);
        }
      }

      if (text) {
        setResumeText(text);
        setOptimizedResumeText(text);
        if (fName) setFileName(fName);
        analyzeResume(text);
      }
    };
    
    fetchResume();
  }, [user, authLoading]);

  const handleFileSelect = async (selectedFile: File | null) => {
    setParseError("");
    if (!selectedFile) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse document");
      }

      sessionStorage.setItem("resumeText", data.text);
      sessionStorage.setItem("fileName", selectedFile.name);
      
      if (user) {
        try {
          await setDoc(doc(db, "users", user.uid, "data", "resume"), {
            text: data.text,
            fileName: selectedFile.name,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error("Failed to save to Firestore", err);
        }
      }

      setResumeText(data.text);
      setOptimizedResumeText(data.text);
      setFileName(selectedFile.name);
      
      analyzeResume(data.text);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to parse document";
      setParseError(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const clearResume = () => {
    sessionStorage.removeItem("resumeText");
    sessionStorage.removeItem("fileName");
    setResumeText("");
    setOptimizedResumeText("");
    setFileName("");
    setReviewResult(null);
  };

  if (!resumeText && !isParsing) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center">
          <div className="inline-flex p-4 bg-primary/10 text-primary rounded-full mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Standalone Resume Review</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Upload your resume to get a comprehensive AI critique and actionable &quot;Add-ons&quot; to boost your overall appeal.
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Upload Resume</h3>
          <Dropzone onFileSelect={handleFileSelect} isLoading={isParsing} />
          {parseError && (
            <div className="mt-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{parseError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" /> Resume Review
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-muted-foreground">Currently evaluating:</span>
            <span className="font-medium flex items-center gap-1">
              <FileText className="w-4 h-4 text-primary" /> {fileName || "Resume"}
            </span>
            <button onClick={clearResume} className="text-primary hover:underline ml-2 print:hidden">
              (Upload Different Resume)
            </button>
          </div>
        </div>
        
        {reviewResult && (
          <div className="print:hidden">
            <DownloadResumeButton resumeText={optimizedResumeText} fileName={"Optimized_" + fileName} />
          </div>
        )}
      </div>

      {isReviewing && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">AI is deeply analyzing your resume...</p>
        </div>
      )}

      {reviewError && (
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Analysis Failed</h3>
            <p>{reviewError}</p>
            <button onClick={() => analyzeResume(resumeText)} className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium">
              Try Again
            </button>
          </div>
        </div>
      )}

      {reviewResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Top Section: Score & Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                  <circle
                    cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - reviewResult.score / 100)}
                    className={cn("transition-all duration-1000", reviewResult.score >= 80 ? "text-green-500" : reviewResult.score >= 60 ? "text-yellow-500" : "text-red-500")}
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold">{reviewResult.score}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase">/ 100</span>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-lg">Overall ATS Appeal</h3>
            </div>

            <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                Executive Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {reviewResult.summary}
              </p>
            </div>
          </div>

          {/* Recommended Add-ons Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
              <ArrowUpRight className="w-6 h-6" /> Highly Recommended Add-ons
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewResult.recommended_addons.map((addon, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-background rounded-lg p-5 shadow-sm border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-3">
                    {addon.category}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">
                    {addon.suggestion}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-5 h-5" /> Current Strengths
              </h3>
              <ul className="space-y-3">
                {reviewResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-muted-foreground">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600 dark:text-red-500">
                <XCircle className="w-5 h-5" /> Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {reviewResult.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-muted-foreground">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Improvement Engine */}
          {reviewResult.suggestions && reviewResult.suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Interactive AI Improvements</h2>
                <p className="text-muted-foreground">Review the AI-generated suggestions below. Accepting a suggestion will instantly optimize your resume draft for download.</p>
              </div>
              
              <div className="space-y-4">
                {reviewResult.suggestions.map((sug, index) => (
                  <ImprovementSuggestionCard
                    key={index}
                    suggestion={sug}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      )}
    </div>
  );
}
