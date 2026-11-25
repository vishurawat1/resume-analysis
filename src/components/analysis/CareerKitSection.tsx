"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  FileEdit,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { escapeLatex } from "@/lib/latexTemplates";

export interface CoverLetterPayload {
  subject: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
  fullText: string;
  latexSource: string;
}

export interface InterviewPrepItem {
  question: string;
  category: "Technical" | "Behavioral" | "System Design" | "Gap Probe" | string;
  targetingGap: string;
  whyAsked: string;
  talkingPoints: string[];
  sampleOpener: string;
}

interface CareerKitResponse {
  coverLetter?: Partial<CoverLetterPayload>;
  interviewPrep?: InterviewPrepItem[];
  error?: string;
}

export interface CareerKitSectionProps {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  weaknesses?: string[];
  missingKeywords?: string[];
  scanId?: string;
}

interface CachedCareerKit {
  coverLetter: CoverLetterPayload | null;
  interviewPrep: InterviewPrepItem[];
  editedCoverLetterText: string;
  editedLatexSource: string;
}

const CACHE_PREFIX = "careerKitCache:";

function getCacheKey(
  scanId: string | undefined,
  jobTitle: string | undefined,
  company: string | undefined,
  jobDescription: string
): string {
  if (scanId) return `${CACHE_PREFIX}${scanId}`;
  const raw = `${jobTitle || ""}|${company || ""}|${jobDescription.slice(0, 240)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

function buildFallbackCoverLetterLatex(
  fullText: string,
  subject?: string,
  company?: string,
  jobTitle?: string
): string {
  const blocks = fullText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const escapedBody = blocks.map((b) => `${escapeLatex(b)}\n\n`).join("");
  const escapedSubject = subject
    ? escapeLatex(subject)
    : escapeLatex(`Application for ${jobTitle || "Target Role"}${company ? ` at ${company}` : ""}`);

  return [
    `\\documentclass[11pt,letterpaper]{article}`,
    `\\usepackage[margin=1in]{geometry}`,
    `\\usepackage[hidelinks]{hyperref}`,
    `\\usepackage{enumitem}`,
    `\\setlength{\\parindent}{0pt}`,
    `\\setlength{\\parskip}{0.8em}`,
    `\\pagestyle{empty}`,
    ``,
    `\\begin{document}`,
    `\\noindent\\textbf{\\large ${escapedSubject}}\\par\\vspace{0.35em}`,
    `\\noindent\\rule{\\linewidth}{0.4pt}\\par\\vspace{0.8em}`,
    ``,
    escapedBody || escapeLatex("Dear Hiring Team,\n\nPlease find my enclosed resume for your consideration.\n\nSincerely,\nCandidate"),
    `\\end{document}`,
    ``,
  ].join("\n");
}

function normalizeCoverLetter(
  raw: Partial<CoverLetterPayload> | undefined,
  company?: string,
  jobTitle?: string
): CoverLetterPayload | null {
  if (!raw) return null;
  const paragraphs = Array.isArray(raw.paragraphs) ? raw.paragraphs.map(String).filter(Boolean) : [];
  const salutation = typeof raw.salutation === "string" && raw.salutation.trim() ? raw.salutation.trim() : "Dear Hiring Manager,";
  const signOff = typeof raw.signOff === "string" && raw.signOff.trim() ? raw.signOff.trim() : "Sincerely,\nCandidate";
  const subject =
    typeof raw.subject === "string" && raw.subject.trim()
      ? raw.subject.trim()
      : `Application for ${jobTitle || "Role"}${company ? ` — ${company}` : ""}`;

  const fallbackText = [salutation, ...paragraphs, signOff].filter(Boolean).join("\n\n");
  const fullText = typeof raw.fullText === "string" && raw.fullText.trim() ? raw.fullText.trim() : fallbackText;
  const latexSource =
    typeof raw.latexSource === "string" && raw.latexSource.trim().includes("\\begin{document}")
      ? raw.latexSource
      : buildFallbackCoverLetterLatex(fullText, subject, company, jobTitle);

  return {
    subject,
    salutation,
    paragraphs,
    signOff,
    fullText,
    latexSource,
  };
}

function syncPlainTextIntoLatex(existingLatex: string, plainText: string, subject?: string, company?: string, jobTitle?: string): string {
  const beginMarker = "\\begin{document}";
  const endMarker = "\\end{document}";
  const beginIdx = existingLatex.indexOf(beginMarker);
  const endIdx = existingLatex.lastIndexOf(endMarker);

  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const preamble = existingLatex.slice(0, beginIdx + beginMarker.length);
    const body = paragraphs.map((p) => `${escapeLatex(p)}\n`).join("\n");
    const subjectLine = subject ? `\\noindent\\textbf{${escapeLatex(subject)}}\\par\\vspace{0.75em}\n\n` : "";
    return `${preamble}\n\n${subjectLine}${body}\n${endMarker}\n`;
  }

  return buildFallbackCoverLetterLatex(plainText, subject, company, jobTitle);
}

function loadCachedKit(cacheKey: string): CachedCareerKit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCareerKit;
    if (!parsed || (!parsed.coverLetter && !Array.isArray(parsed.interviewPrep))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedKit(cacheKey: string, payload: CachedCareerKit) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

const CATEGORY_STYLES: Record<string, string> = {
  "Gap Probe": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  Technical: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  Behavioral: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  "System Design": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
};

const emptySubscribe = () => () => {};

function getTargetTrackSnapshot(): string {
  try {
    return localStorage.getItem("userTargetTrack") || "";
  } catch {
    return "";
  }
}

export function CareerKitSection({
  resumeText,
  jobDescription,
  jobTitle,
  company,
  weaknesses = [],
  missingKeywords = [],
  scanId,
}: CareerKitSectionProps) {
  const router = useRouter();
  const cacheKey = getCacheKey(scanId, jobTitle, company, jobDescription);
  const targetTrack = useSyncExternalStore(emptySubscribe, getTargetTrackSnapshot, () => "");

  const [initialCache] = useState<CachedCareerKit | null>(() => loadCachedKit(cacheKey));

  const [activeTab, setActiveTab] = useState<"cover-letter" | "interview-prep">("cover-letter");
  const [coverLetter, setCoverLetter] = useState<CoverLetterPayload | null>(initialCache?.coverLetter ?? null);
  const [editedText, setEditedText] = useState<string>(initialCache?.editedCoverLetterText ?? "");
  const [editedLatex, setEditedLatex] = useState<string>(initialCache?.editedLatexSource ?? "");
  const [coverViewMode, setCoverViewMode] = useState<"plain" | "latex">("plain");

  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepItem[]>(initialCache?.interviewPrep ?? []);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(() => new Set([0]));
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<"both" | "cover-letter" | "interview-prep" | null>(null);
  const [error, setError] = useState("");

  const [copiedState, setCopiedState] = useState<"plain" | "latex" | number | null>(null);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const coverTabId = useId();
  const prepTabId = useId();
  const coverPanelId = useId();
  const prepPanelId = useId();
  const coverTextareaId = useId();
  const latexTextareaId = useId();
  const baseAccordionId = useId();

  const persistKitState = (
    nextCover: CoverLetterPayload | null,
    nextPrep: InterviewPrepItem[],
    nextText: string,
    nextLatex: string
  ) => {
    saveCachedKit(cacheKey, {
      coverLetter: nextCover,
      interviewPrep: nextPrep,
      editedCoverLetterText: nextText,
      editedLatexSource: nextLatex,
    });
  };

  const handleGenerate = async (mode: "both" | "cover-letter" | "interview-prep" = "both") => {
    if (!resumeText.trim() || !jobDescription.trim()) return;

    setIsGenerating(true);
    setGeneratingMode(mode);
    setError("");
    setPdfError("");

    try {
      const track = typeof window !== "undefined" ? localStorage.getItem("userTargetTrack") || undefined : undefined;
      const res = await fetch("/api/career-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          resumeText,
          jobDescription,
          jobTitle: jobTitle || undefined,
          company: company || undefined,
          weaknesses,
          missingKeywords,
          track,
        }),
      });

      const data = (await res.json()) as CareerKitResponse;
      if (!res.ok) {
        throw new Error(data?.error || `Failed to generate career kit (HTTP ${res.status})`);
      }

      let nextCover = coverLetter;
      let nextText = editedText;
      let nextLatex = editedLatex;
      let nextPrep = interviewPrep;

      if (mode === "both" || mode === "cover-letter") {
        const normalized = normalizeCoverLetter(data.coverLetter, company, jobTitle);
        if (normalized) {
          nextCover = normalized;
          nextText = normalized.fullText;
          nextLatex = normalized.latexSource;
          setCoverLetter(normalized);
          setEditedText(normalized.fullText);
          setEditedLatex(normalized.latexSource);
        }
      }

      if (mode === "both" || mode === "interview-prep") {
        if (Array.isArray(data.interviewPrep) && data.interviewPrep.length > 0) {
          nextPrep = data.interviewPrep;
          setInterviewPrep(data.interviewPrep);
          setExpandedIndices(new Set([0]));
          setSelectedCategory("All");
        }
      }

      persistKitState(nextCover, nextPrep, nextText, nextLatex);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not generate Career Kit. Please try again.");
    } finally {
      setIsGenerating(false);
      setGeneratingMode(null);
    }
  };

  const handleCopy = async (text: string, marker: "plain" | "latex" | number) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(marker);
      setTimeout(() => setCopiedState(null), 2000);
    } catch {
      setError("Clipboard permission denied. Please copy manually.");
    }
  };

  const handleSyncPlainTextToLatex = () => {
    if (!coverLetter) return;
    const synced = syncPlainTextIntoLatex(
      editedLatex || coverLetter.latexSource,
      editedText,
      coverLetter.subject,
      company,
      jobTitle
    );
    setEditedLatex(synced);
    persistKitState(coverLetter, interviewPrep, editedText, synced);
  };

  const getActiveLatexSource = () => {
    if (editedLatex.trim()) return editedLatex;
    if (coverLetter?.latexSource) return coverLetter.latexSource;
    return buildFallbackCoverLetterLatex(editedText, coverLetter?.subject, company, jobTitle);
  };

  const handleDownloadOverleafPdf = async () => {
    const tex = getActiveLatexSource();
    if (!tex.trim()) return;

    setIsCompilingPdf(true);
    setPdfError("");

    try {
      const res = await fetch("/api/compile-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tex, compiler: "pdflatex" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `LaTeX compilation failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = `${company || "Cover"}_${jobTitle || "Letter"}`
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "");
      a.download = `${slug || "Cover_Letter"}_Overleaf.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : "Failed to compile Overleaf PDF.");
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleOpenInLatexStudio = () => {
    const tex = getActiveLatexSource();
    sessionStorage.setItem("pendingLatexSource", tex);
    sessionStorage.setItem("pendingLatexMode", "cover-letter");
    if (jobDescription) sessionStorage.setItem("jobDescription", jobDescription);
    if (jobTitle) sessionStorage.setItem("jobTitle", jobTitle);
    if (company) sessionStorage.setItem("company", company);
    router.push("/dashboard/editor");
  };

  const toggleAccordion = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const categories = ["All", ...Array.from(new Set(interviewPrep.map((q) => q.category).filter(Boolean)))];
  const filteredQuestions = interviewPrep
    .map((item, origIdx) => ({ item, origIdx }))
    .filter(({ item }) => selectedCategory === "All" || item.category === selectedCategory);
  const allFilteredExpanded =
    filteredQuestions.length > 0 && filteredQuestions.every(({ origIdx }) => expandedIndices.has(origIdx));

  const hasCoverLetter = Boolean(coverLetter && editedText.trim());
  const hasInterviewPrep = interviewPrep.length > 0;
  const isPlainTextModified = Boolean(coverLetter && editedText.trim() !== coverLetter.fullText.trim());
  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;

  return (
    <section
      id="career-kit"
      aria-labelledby="career-kit-heading"
      className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Tailored Career Kit
            </span>
            {targetTrack && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <Briefcase className="w-3 h-3" />
                {targetTrack}
              </span>
            )}
          </div>
          <h2 id="career-kit-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Cover Letter &amp; Weak-Spot Interview Prep
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Grounded directly in your ATS radar ({weaknesses.length} detected gaps,{" "}
            {missingKeywords.length} missing keywords)
            {jobTitle || company
              ? ` for ${jobTitle || "this role"}${company ? ` at ${company}` : ""}.`
              : "."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleGenerate("both")}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isGenerating && generatingMode === "both" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Career Kit...</span>
              </>
            ) : hasCoverLetter || hasInterviewPrep ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Full Kit</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Cover Letter &amp; Prep</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Career Kit Sections"
          className="inline-flex p-1 rounded-xl bg-muted border border-border self-start"
        >
          <button
            type="button"
            id={coverTabId}
            role="tab"
            aria-selected={activeTab === "cover-letter"}
            aria-controls={coverPanelId}
            onClick={() => setActiveTab("cover-letter")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "cover-letter"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Cover Letter</span>
            {hasCoverLetter && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Ready
              </span>
            )}
          </button>

          <button
            type="button"
            id={prepTabId}
            role="tab"
            aria-selected={activeTab === "interview-prep"}
            aria-controls={prepPanelId}
            onClick={() => setActiveTab("interview-prep")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "interview-prep"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-primary" />
            <span>Top 5 Interview Prep</span>
            {hasInterviewPrep && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary">
                {interviewPrep.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "cover-letter" && hasCoverLetter && (
          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 rounded-lg bg-muted border border-border text-[11px]">
              <button
                type="button"
                onClick={() => setCoverViewMode("plain")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                  coverViewMode === "plain"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Editable Text
              </button>
              <button
                type="button"
                onClick={() => setCoverViewMode("latex")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                  coverViewMode === "latex"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="w-3 h-3" />
                <span>Overleaf .tex</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Career Kit generation failed</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate("both")}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold shrink-0 cursor-pointer hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab Panel 1: Tailored Cover Letter */}
      <div
        id={coverPanelId}
        role="tabpanel"
        aria-labelledby={coverTabId}
        hidden={activeTab !== "cover-letter"}
        className="space-y-4"
      >
        {!hasCoverLetter ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-foreground">
                Ready to draft your tailored Overleaf Cover Letter
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates a role-specific cover letter bridging your strongest achievements to{" "}
                {company || "the employer"}&apos;s exact requirements, ready to compile as an Overleaf PDF.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleGenerate("both")}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate Full Career Kit</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate("cover-letter")}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isGenerating && generatingMode === "cover-letter" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Cover Letter Only</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject & Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Subject:
                </span>
                <span className="font-semibold text-foreground truncate">{coverLetter?.subject}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{wordCount} words</span>
                {isPlainTextModified && (
                  <button
                    type="button"
                    onClick={handleSyncPlainTextToLatex}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync edits to .tex</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerate("cover-letter")}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium cursor-pointer disabled:opacity-50"
                >
                  {isGenerating && generatingMode === "cover-letter" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* Editable Cover Letter Text or Overleaf LaTeX Source */}
            {coverViewMode === "plain" ? (
              <div>
                <label htmlFor={coverTextareaId} className="sr-only">
                  Editable Tailored Cover Letter
                </label>
                <textarea
                  id={coverTextareaId}
                  value={editedText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditedText(val);
                    persistKitState(coverLetter, interviewPrep, val, editedLatex);
                  }}
                  rows={13}
                  className="w-full p-4 rounded-xl bg-background border border-border text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y font-sans"
                  placeholder="Your tailored cover letter will appear here..."
                />
              </div>
            ) : (
              <div>
                <label htmlFor={latexTextareaId} className="sr-only">
                  Editable Overleaf Cover Letter LaTeX Source
                </label>
                <textarea
                  id={latexTextareaId}
                  value={editedLatex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditedLatex(val);
                    persistKitState(coverLetter, interviewPrep, editedText, val);
                  }}
                  rows={13}
                  spellCheck={false}
                  className="w-full p-4 rounded-xl bg-background border border-border text-xs font-mono text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                />
              </div>
            )}

            {pdfError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            {/* Cover Letter Export Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(editedText, "plain")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  {copiedState === "plain" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied Text</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Plain Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(getActiveLatexSource(), "latex")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  {copiedState === "latex" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied .tex</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Overleaf LaTeX</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadOverleafPdf}
                  disabled={isCompilingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isCompilingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling Overleaf PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Overleaf PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenInLatexStudio}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Open Cover Letter in LaTeX Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Panel 2: Top 5 Interview Prep */}
      <div
        id={prepPanelId}
        role="tabpanel"
        aria-labelledby={prepTabId}
        hidden={activeTab !== "interview-prep"}
        className="space-y-4"
      >
        {!hasInterviewPrep ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-foreground">
                Rehearse the exact weak spots from your ATS radar
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get 5 targeted questions (Gap Probes, Technical, Behavioral, and System Design) with talking points and sample openers grounded in your resume.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleGenerate("both")}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate Full Career Kit</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate("interview-prep")}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isGenerating && generatingMode === "interview-prep" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageSquareText className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Interview Prep Only</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter & Expand Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter questions by category">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedIndices(
                      allFilteredExpanded
                        ? new Set()
                        : new Set(filteredQuestions.map(({ origIdx }) => origIdx))
                    );
                  }}
                  className="text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  {allFilteredExpanded ? "Collapse All" : "Expand All"}
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={() => handleGenerate("interview-prep")}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isGenerating && generatingMode === "interview-prep" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>Refresh Questions</span>
                </button>
              </div>
            </div>

            {/* 5 Interactive Accordion Cards */}
            <div className="space-y-3">
              {filteredQuestions.map(({ item, origIdx }) => {
                const isExpanded = expandedIndices.has(origIdx);
                const buttonId = `${baseAccordionId}-btn-${origIdx}`;
                const panelId = `${baseAccordionId}-panel-${origIdx}`;
                const badgeStyle =
                  CATEGORY_STYLES[item.category] ||
                  "bg-muted text-foreground border-border";

                return (
                  <div
                    key={`${origIdx}-${item.question.slice(0, 24)}`}
                    className={cn(
                      "rounded-xl border transition-colors bg-background",
                      isExpanded ? "border-primary/40 shadow-xs" : "border-border hover:border-border/80"
                    )}
                  >
                    <h3 className="m-0">
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => toggleAccordion(origIdx)}
                        className="w-full text-left p-4 flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-foreground text-[11px] font-bold">
                              {origIdx + 1}
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                                badgeStyle
                              )}
                            >
                              {item.category || "Gap Probe"}
                            </span>
                            {item.targetingGap && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                <Target className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[260px] sm:max-w-none">
                                  Targets: {item.targetingGap}
                                </span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                            {item.question}
                          </p>
                        </div>

                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
                            isExpanded && "rotate-180 text-primary"
                          )}
                        />
                      </button>
                    </h3>

                    {isExpanded && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="px-4 pb-4 pt-1 border-t border-border/60 space-y-4 text-sm"
                      >
                        {item.whyAsked && (
                          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-start gap-2.5">
                            <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                Why Interviewers Ask This
                              </span>
                              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                                {item.whyAsked}
                              </p>
                            </div>
                          </div>
                        )}

                        {Array.isArray(item.talkingPoints) && item.talkingPoints.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Grounded Talking Points (From Your Background)
                            </span>
                            <ul className="space-y-1.5">
                              {item.talkingPoints.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  <span className="leading-relaxed">{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.sampleOpener && (
                          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                High-Impact Sample Opener
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.sampleOpener, origIdx)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer"
                              >
                                {copiedState === origIdx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                    <span>Copy Opener</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-xs sm:text-sm italic text-foreground leading-relaxed">
                              &ldquo;{item.sampleOpener}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
