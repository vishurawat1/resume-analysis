"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Code2,
  Columns2,
  Download,
  Eye,
  FileCode2,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ResumeData } from "@/components/pdf/ResumeDocument";
import { Suggestion } from "@/components/analysis/ImprovementSuggestionCard";
import {
  addKeywordToTexSkills,
  applyBulletUpgradeToTex,
  formatAsResumeItem,
  generateLatexFromResumeData,
  LATEX_TEMPLATES,
  LatexTemplateId,
} from "@/lib/latexTemplates";
import type { LatexCodeEditorHandle } from "@/components/editor/LatexCodeEditor";
import { CompileErrorInfo, PdfPreviewPane } from "@/components/editor/PdfPreviewPane";
import { AiLatexSidebar } from "@/components/editor/AiLatexSidebar";

const LatexCodeEditor = dynamic(
  () => import("@/components/editor/LatexCodeEditor").then((mod) => mod.LatexCodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-muted-foreground text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Loading Overleaf LaTeX Code Editor...</span>
      </div>
    ),
  }
);

const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1-555-234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera",
    github: "github.com/alexrivera",
    portfolio: "alexrivera.dev",
  },
  summary:
    "Results-driven Software Engineer with 5+ years of experience architecting high-scale distributed systems, event-driven pipelines, and resilient cloud applications.",
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      gpa: "3.85 / 4.0",
      date: "Aug 2016 -- May 2020",
      location: "Berkeley, CA",
      bullets: [],
    },
  ],
  experience: [
    {
      company: "Apex Cloud Technologies",
      role: "Lead Full Stack Engineer",
      date: "June 2022 -- Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected distributed event-streaming platform using Next.js, Node.js, and Apache Kafka, processing 1.4M daily requests with 99.99% availability.",
        "Optimized PostgreSQL compound indexing strategies and aggregation queries, slashing tail latency by 48%.",
        "Mentored 8 engineers and established automated CI/CD deployment workflows with Docker and Kubernetes.",
      ],
    },
    {
      company: "Veloce Digital Systems",
      role: "Software Engineer",
      date: "June 2020 -- May 2022",
      location: "Austin, TX",
      bullets: [
        "Engineered customer onboarding platform that increased activation conversion rates by 28% within 90 days.",
        "Implemented Redis caching layer across core microservices, reducing AWS compute expenses by $35,000 annually.",
      ],
    },
  ],
  projects: [
    {
      name: "PulseStream Telemetry Engine",
      description: "Go, React, Apache Kafka, Redis, Docker",
      date: "2024",
      bullets: [
        "Built open-source real-time metrics ingestion engine sustaining 50,000 logs/sec at sub-10ms query latency.",
      ],
    },
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML/CSS"],
    },
    {
      category: "Frameworks",
      items: ["Next.js", "React", "Node.js", "FastAPI", "Tailwind CSS"],
    },
    {
      category: "Cloud & Tools",
      items: ["Docker", "Kubernetes", "AWS", "Redis", "Apache Kafka", "PostgreSQL"],
    },
  ],
  customSections: [],
};

export default function LatexResumeEditorPage() {
  const { user } = useAuth();

  // Editor Core State
  const [texSource, setTexSource] = useState<string>(() =>
    generateLatexFromResumeData(DEFAULT_RESUME_DATA, "jakes")
  );
  const [structuredResume, setStructuredResume] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [templateId, setTemplateId] = useState<LatexTemplateId>("jakes");
  const [compiler, setCompiler] = useState<"pdflatex" | "xelatex" | "lualatex">("pdflatex");
  const [autoCompile, setAutoCompile] = useState(true);
  const [hasManualEdits, setHasManualEdits] = useState(false);

  // Loading & Build Status
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<CompileErrorInfo | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [lastCompiledAt, setLastCompiledAt] = useState<string | null>(null);
  const [compilerBackend, setCompilerBackend] = useState<string | null>(null);
  const [compileDurationMs, setCompileDurationMs] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Panels & Overlays
  const [mobilePane, setMobilePane] = useState<"code" | "pdf" | "original">("code");
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [showOriginalCompare, setShowOriginalCompare] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [uploadedRawText, setUploadedRawText] = useState<string>("");

  // AI & Job Context
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<number>>(new Set());
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isFixingError, setIsFixingError] = useState(false);
  const [isTailoringTex, setIsTailoringTex] = useState(false);
  const [tailorSummary, setTailorSummary] = useState<string[]>([]);

  // Template switch confirm modal (native <dialog>)
  const [pendingTemplate, setPendingTemplate] = useState<LatexTemplateId | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const editorRef = useRef<LatexCodeEditorHandle>(null);

  // Refs for cancellation & cleanup
  const activePdfUrlRef = useRef<string | null>(null);
  const compileAbortRef = useRef<AbortController | null>(null);
  const compileSeqRef = useRef(0);
  const initialCompileTriggeredRef = useRef(false);

  // Accessible IDs
  const mobileCodeTabId = useId();
  const mobilePdfTabId = useId();
  const mobileOrigTabId = useId();
  const templateSelectId = useId();
  const compilerSelectId = useId();
  const dialogTitleId = useId();

  // Revoke previous Blob URL on replace or unmount
  const updatePdfBlobUrl = useCallback((blob: Blob) => {
    const nextUrl = URL.createObjectURL(blob);
    if (activePdfUrlRef.current) {
      URL.revokeObjectURL(activePdfUrlRef.current);
    }
    activePdfUrlRef.current = nextUrl;
    setPdfUrl(nextUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
      }
      compileAbortRef.current?.abort();
    };
  }, []);

  // Compile LaTeX -> Real TeX Live PDF
  const compileLatex = useCallback(
    async (sourceOverride?: string, engineOverride?: "pdflatex" | "xelatex" | "lualatex") => {
      const targetTex = sourceOverride ?? texSource;
      const targetCompiler = engineOverride ?? compiler;
      if (!targetTex.trim()) return;

      compileAbortRef.current?.abort();
      const controller = new AbortController();
      compileAbortRef.current = controller;
      const mySeq = ++compileSeqRef.current;

      setIsCompiling(true);
      const startedAt = performance.now();

      try {
        const res = await fetch("/api/compile-latex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tex: targetTex, compiler: targetCompiler }),
          signal: controller.signal,
        });

        if (mySeq !== compileSeqRef.current) return;

        if (!res.ok) {
          const errPayload = await res.json().catch(() => ({}));
          setCompileError({
            message: errPayload?.error || `Compilation failed (HTTP ${res.status})`,
            line: typeof errPayload?.line === "number" ? errPayload.line : null,
            log: typeof errPayload?.log === "string" ? errPayload.log : "",
          });
          return;
        }

        const pdfBlob = await res.blob();
        if (mySeq !== compileSeqRef.current) return;

        updatePdfBlobUrl(pdfBlob);
        setCompileError(null);
        setCompileDurationMs(Math.round(performance.now() - startedAt));
        setCompilerBackend(res.headers.get("X-Latex-Backend"));
        setLastCompiledAt(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Compile error:", err);
        setCompileError({
          message: "Network error reaching LaTeX compiler. Check your connection and retry.",
          line: null,
          log: "",
        });
      } finally {
        if (mySeq === compileSeqRef.current) {
          setIsCompiling(false);
        }
      }
    },
    [texSource, compiler, updatePdfBlobUrl]
  );

  // Hydrate initial .tex or convert uploaded resume -> Overleaf .tex on mount
  useEffect(() => {
    let cancelled = false;

    const loadInitialProject = async () => {
      try {
        const cachedTex = sessionStorage.getItem("resumeLatexSource");
        const cachedTpl = (sessionStorage.getItem("resumeLatexTemplate") as LatexTemplateId) || "jakes";
        const cachedStructured = sessionStorage.getItem("resumeStructuredData");
        const cachedText = sessionStorage.getItem("resumeText");
        const cachedAiResult = sessionStorage.getItem("aiResult");
        const cachedPdfUrl = sessionStorage.getItem("uploadedPdfDataUrl");

        setJobDescription(sessionStorage.getItem("jobDescription") || "");
        setJobTitle(sessionStorage.getItem("jobTitle") || "");
        setCompany(sessionStorage.getItem("company") || "");
        setLocation(sessionStorage.getItem("location") || "");

        if (cachedPdfUrl) setUploadedPdfUrl(cachedPdfUrl);
        if (cachedText) setUploadedRawText(cachedText);

        if (cachedAiResult) {
          try {
            const parsedAi = JSON.parse(cachedAiResult);
            if (Array.isArray(parsedAi.suggestions)) setAiSuggestions(parsedAi.suggestions);
            if (Array.isArray(parsedAi.keywordAnalysis?.missing)) {
              setMissingKeywords(parsedAi.keywordAnalysis.missing);
            }
          } catch (e) {
            console.warn("Failed parsing cached aiResult", e);
          }
        }

        if (cachedStructured) {
          try {
            setStructuredResume(JSON.parse(cachedStructured));
          } catch {
            // ignore
          }
        }

        // Priority 1: Cached .tex source in session
        if (cachedTex && cachedTex.trim().length > 50) {
          if (cancelled) return;
          setTemplateId(cachedTpl);
          setTexSource(cachedTex);
          setIsLoadingInitial(false);
          if (!initialCompileTriggeredRef.current) {
            initialCompileTriggeredRef.current = true;
            compileLatex(cachedTex);
          }
          return;
        }

        // Priority 2: Convert structured JSON in session -> Overleaf .tex
        if (cachedStructured) {
          try {
            const parsedData = JSON.parse(cachedStructured) as ResumeData;
            const generatedTex = generateLatexFromResumeData(parsedData, cachedTpl);
            if (cancelled) return;
            setStructuredResume(parsedData);
            setTexSource(generatedTex);
            sessionStorage.setItem("resumeLatexSource", generatedTex);
            setIsLoadingInitial(false);
            if (!initialCompileTriggeredRef.current) {
              initialCompileTriggeredRef.current = true;
              compileLatex(generatedTex);
            }
            return;
          } catch {
            // fall through
          }
        }

        // Priority 3: Convert uploaded raw resume text -> JSON -> Overleaf .tex
        if (cachedText) {
          try {
            const res = await fetch("/api/build-resume", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resumeText: cachedText }),
            });
            if (res.ok) {
              const structured = (await res.json()) as ResumeData;
              const generatedTex = generateLatexFromResumeData(structured, "jakes");
              if (cancelled) return;
              setStructuredResume(structured);
              setTexSource(generatedTex);
              sessionStorage.setItem("resumeStructuredData", JSON.stringify(structured));
              sessionStorage.setItem("resumeLatexSource", generatedTex);
              setIsLoadingInitial(false);
              if (!initialCompileTriggeredRef.current) {
                initialCompileTriggeredRef.current = true;
                compileLatex(generatedTex);
              }
              return;
            }
          } catch (err) {
            console.warn("Could not build structured resume from text:", err);
          }
        }

        // Priority 4: Load saved project from Firestore
        if (user) {
          try {
            const snap = await getDoc(doc(db, "users", user.uid, "data", "resume"));
            if (snap.exists()) {
              const data = snap.data();
              if (data.structuredData) setStructuredResume(data.structuredData);
              const resolvedTex =
                typeof data.latexSource === "string" && data.latexSource.trim().length > 50
                  ? data.latexSource
                  : data.structuredData
                    ? generateLatexFromResumeData(data.structuredData, "jakes")
                    : generateLatexFromResumeData(DEFAULT_RESUME_DATA, "jakes");
              if (cancelled) return;
              setTexSource(resolvedTex);
              sessionStorage.setItem("resumeLatexSource", resolvedTex);
              setIsLoadingInitial(false);
              if (!initialCompileTriggeredRef.current) {
                initialCompileTriggeredRef.current = true;
                compileLatex(resolvedTex);
              }
              return;
            }
          } catch (err) {
            console.warn("Firestore resume load note:", err);
          }
        }

        // Priority 5: Starter Jake's Resume Overleaf template
        const starterTex = generateLatexFromResumeData(DEFAULT_RESUME_DATA, "jakes");
        if (cancelled) return;
        setTexSource(starterTex);
        setIsLoadingInitial(false);
        if (!initialCompileTriggeredRef.current) {
          initialCompileTriggeredRef.current = true;
          compileLatex(starterTex);
        }
      } finally {
        if (!cancelled) setIsLoadingInitial(false);
      }
    };

    loadInitialProject();
    return () => {
      cancelled = true;
    };
  }, [user, compileLatex]);

  // Debounced auto-compile on user source edits
  useEffect(() => {
    if (isLoadingInitial || !autoCompile || !hasManualEdits) return;
    const timer = setTimeout(() => {
      compileLatex(texSource, compiler);
    }, 1500);
    return () => clearTimeout(timer);
  }, [texSource, compiler, autoCompile, hasManualEdits, isLoadingInitial, compileLatex]);

  // Save .tex to sessionStorage & Firestore
  const handleSaveProject = async (texOverride?: string) => {
    const content = texOverride ?? texSource;
    sessionStorage.setItem("resumeLatexSource", content);
    sessionStorage.setItem("resumeLatexTemplate", templateId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid, "data", "resume"),
          {
            latexSource: content,
            latexTemplate: templateId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Failed to persist latexSource to Firestore:", err);
      }
    }
  };

  // Switch Overleaf Template safely
  const applyTemplateSwitch = (nextTpl: LatexTemplateId) => {
    const nextTex = generateLatexFromResumeData(structuredResume, nextTpl);
    setTemplateId(nextTpl);
    setTexSource(nextTex);
    setHasManualEdits(false);
    sessionStorage.setItem("resumeLatexSource", nextTex);
    sessionStorage.setItem("resumeLatexTemplate", nextTpl);
    compileLatex(nextTex, compiler);
  };

  const handleTemplateSelectChange = (nextTpl: LatexTemplateId) => {
    if (nextTpl === templateId) return;
    if (hasManualEdits) {
      setPendingTemplate(nextTpl);
      confirmDialogRef.current?.showModal();
    } else {
      applyTemplateSwitch(nextTpl);
    }
  };

  // Upload a PDF/DOCX/TEX file directly inside Overleaf IDE
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support direct .tex file upload!
    if (file.name.toLowerCase().endsWith(".tex")) {
      const texText = await file.text();
      setTexSource(texText);
      setHasManualEdits(true);
      sessionStorage.setItem("resumeLatexSource", texText);
      compileLatex(texText, compiler);
      return;
    }

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) {
          setUploadedPdfUrl(res);
          sessionStorage.setItem("uploadedPdfDataUrl", res);
        }
      };
      reader.readAsDataURL(file);
    }

    try {
      setIsLoadingInitial(true);
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/parse", { method: "POST", body: formData });
      if (!parseRes.ok) throw new Error("Failed parsing resume document");
      const { text } = await parseRes.json();

      setUploadedRawText(text);
      sessionStorage.setItem("resumeText", text);

      const structRes = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      if (structRes.ok) {
        const structured = (await structRes.json()) as ResumeData;
        const generatedTex = generateLatexFromResumeData(structured, templateId);
        setStructuredResume(structured);
        setTexSource(generatedTex);
        setHasManualEdits(false);
        sessionStorage.setItem("resumeStructuredData", JSON.stringify(structured));
        sessionStorage.setItem("resumeLatexSource", generatedTex);
        compileLatex(generatedTex, compiler);
      }
    } catch (err) {
      console.error("Failed importing resume:", err);
      setCompileError({
        message: "Could not parse uploaded resume file. Try another PDF/DOCX or .tex file.",
        line: null,
        log: "",
      });
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Download Compiled PDF
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    const cleanName = (structuredResume.personalInfo?.name || "Resume").replace(/\s+/g, "_");
    a.download = `${cleanName}_LaTeX.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download .tex Source (Overleaf-compatible)
  const handleDownloadTex = () => {
    const blob = new Blob([texSource], { type: "application/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanName = (structuredResume.personalInfo?.name || "main").replace(/\s+/g, "_");
    a.download = `${cleanName}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // AI Syntax Error Auto-Fix
  const handleAiFixError = async () => {
    if (!compileError) return;
    setIsFixingError(true);
    try {
      const res = await fetch("/api/latex-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "fix-error",
          tex: texSource,
          errorLog: compileError.log || compileError.message,
          errorLine: compileError.line,
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.fixedTex === "string" && data.fixedTex.trim().length > 20) {
        setTexSource(data.fixedTex);
        setHasManualEdits(true);
        handleSaveProject(data.fixedTex);
        await compileLatex(data.fixedTex, compiler);
      }
    } catch (err) {
      console.error("AI Fix Error failed:", err);
    } finally {
      setIsFixingError(false);
    }
  };

  // AI Tailor whole .tex to Target JD
  const handleTailorFullTex = async () => {
    if (!jobDescription.trim()) return;
    setIsTailoringTex(true);
    setTailorSummary([]);
    try {
      const res = await fetch("/api/latex-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tailor-jd",
          tex: texSource,
          jobDescription,
          missingKeywords,
          jobTitle,
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.updatedTex === "string" && data.updatedTex.trim().length > 50) {
        setTexSource(data.updatedTex);
        setHasManualEdits(true);
        if (Array.isArray(data.changesSummary)) setTailorSummary(data.changesSummary);
        handleSaveProject(data.updatedTex);
        await compileLatex(data.updatedTex, compiler);
      }
    } catch (err) {
      console.error("AI Tailor Error:", err);
    } finally {
      setIsTailoringTex(false);
    }
  };

  // AI Scanned Suggestion -> 1-Click inject/replace into main.tex
  const handleApplySuggestion = (sug: Suggestion, idx: number) => {
    const { updated } = applyBulletUpgradeToTex(texSource, sug.original, sug.improved);
    setTexSource(updated);
    setHasManualEdits(true);
    setAppliedSuggestionIds((prev) => new Set(prev).add(idx));
    handleSaveProject(updated);
    compileLatex(updated, compiler);
  };

  const handleAddKeywordToSkills = (kw: string) => {
    const { updated, added } = addKeywordToTexSkills(texSource, kw);
    if (added) {
      setTexSource(updated);
      setHasManualEdits(true);
      handleSaveProject(updated);
      compileLatex(updated, compiler);
    }
    setMissingKeywords((prev) => prev.filter((item) => item !== kw));
  };

  const handleInsertBulletSnippet = (plainBullet: string) => {
    const snippet = `\n        ${formatAsResumeItem(plainBullet)}`;
    editorRef.current?.insertAtCursor(snippet);
    setHasManualEdits(true);
  };

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] space-y-4">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Initializing Overleaf LaTeX Workspace &amp; Generating main.tex...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] w-full min-w-0 bg-background text-foreground overflow-hidden">
      {/* ── Overleaf Top IDE Toolbar ── */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 py-2 bg-card border-b border-border shrink-0 z-20">
        {/* Left: File Breadcrumb + Template & Compiler Controls */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-bold text-foreground flex items-center gap-1">
              <FileCode2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>main.tex</span>
            </span>
          </div>

          {/* Template Switcher */}
          <div className="flex items-center gap-1.5 min-w-0">
            <label htmlFor={templateSelectId} className="sr-only">
              Overleaf Resume Template
            </label>
            <select
              id={templateSelectId}
              value={templateId}
              onChange={(e) => handleTemplateSelectChange(e.target.value as LatexTemplateId)}
              className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground cursor-pointer max-w-[190px] truncate"
            >
              {LATEX_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <label htmlFor={compilerSelectId} className="sr-only">
              LaTeX Compiler Engine
            </label>
            <select
              id={compilerSelectId}
              value={compiler}
              onChange={(e) => {
                const nextComp = e.target.value as "pdflatex" | "xelatex" | "lualatex";
                setCompiler(nextComp);
                compileLatex(texSource, nextComp);
              }}
              className="hidden sm:block px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono font-medium text-muted-foreground cursor-pointer"
            >
              <option value="pdflatex">pdfLaTeX</option>
              <option value="xelatex">XeLaTeX</option>
              <option value="lualatex">LuaLaTeX</option>
            </select>
          </div>

          {/* Overleaf Primary Recompile Button */}
          <button
            type="button"
            onClick={() => compileLatex(texSource, compiler)}
            disabled={isCompiling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-70 shadow-2xs"
            title="Recompile main.tex to PDF (Ctrl/Cmd + S)"
          >
            {isCompiling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isCompiling ? "Compiling..." : "Recompile"}</span>
          </button>

          {/* Auto-Compile Toggle */}
          <label className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-pointer select-none px-1.5">
            <input
              type="checkbox"
              checked={autoCompile}
              onChange={(e) => setAutoCompile(e.target.checked)}
              className="rounded border-border accent-emerald-600 cursor-pointer"
            />
            <span>Auto</span>
          </label>
        </div>

        {/* Right: Actions (Import, Original Split, AI Copilot, Save, Export .tex) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors">
            <UploadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">Import PDF / .tex</span>
            <input
              type="file"
              accept=".pdf,.docx,.tex"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowOriginalCompare((v) => !v)}
            aria-pressed={showOriginalCompare}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showOriginalCompare
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAiSidebar((v) => !v)}
            aria-pressed={showAiSidebar}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              showAiSidebar
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted text-foreground border-border"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Copilot</span>
            {missingKeywords.length + (aiSuggestions.length - appliedSuggestionIds.size) > 0 && (
              <span className="px-1.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                {missingKeywords.length + Math.max(0, aiSuggestions.length - appliedSuggestionIds.size)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSaveProject()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTex}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors"
            title="Download .tex source file for Overleaf"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>.tex</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Pane Switcher (< lg screens) ── */}
      <div
        role="tablist"
        aria-label="Mobile LaTeX Workspace Views"
        className="flex lg:hidden border-b border-border bg-muted/40 shrink-0"
      >
        <button
          type="button"
          id={mobileCodeTabId}
          role="tab"
          aria-selected={mobilePane === "code"}
          onClick={() => setMobilePane("code")}
          className={`relative flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            mobilePane === "code"
              ? "text-primary after:content-[''] after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>main.tex Code</span>
        </button>
        <button
          type="button"
          id={mobilePdfTabId}
          role="tab"
          aria-selected={mobilePane === "pdf"}
          onClick={() => setMobilePane("pdf")}
          className={`relative flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
            mobilePane === "pdf"
              ? "text-primary after:content-[''] after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Compiled PDF</span>
        </button>
        {(uploadedPdfUrl || uploadedRawText) && (
          <button
            type="button"
            id={mobileOrigTabId}
            role="tab"
            aria-selected={mobilePane === "original"}
            onClick={() => setMobilePane("original")}
            className={`relative flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
              mobilePane === "original"
                ? "text-primary after:content-[''] after:absolute after:inset-x-3 after:bottom-0 after:border-b-2 after:border-primary"
                : "text-muted-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>
        )}
      </div>

      {/* ── Main Overleaf Split-Screen Workspace ── */}
      <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden relative">
        {/* Optional Pane 0: Original Uploaded Resume Reference */}
        {(showOriginalCompare || mobilePane === "original") && (
          <section
            aria-label="Original Uploaded Resume Reference"
            className={`${
              mobilePane === "original" ? "flex w-full" : "hidden"
            } lg:flex lg:w-[28%] lg:min-w-[260px] flex-col border-r border-border bg-muted/20 min-h-0 shrink-0`}
          >
            <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border text-xs font-bold shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">Original Uploaded Resume</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowOriginalCompare(false);
                  setMobilePane("code");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto latex-scroller p-3 bg-white dark:bg-neutral-950">
              {uploadedPdfUrl ? (
                <iframe
                  src={uploadedPdfUrl}
                  title="Original Uploaded Resume PDF"
                  className="w-full h-full min-h-[500px] block border-0 rounded"
                />
              ) : uploadedRawText ? (
                <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {uploadedRawText}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-xs text-muted-foreground space-y-2">
                  <UploadCloud className="w-7 h-7 opacity-50" />
                  <p>Upload a PDF/DOCX resume via &ldquo;Import PDF / .tex&rdquo; to compare side-by-side.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pane 1 (Left Half): CodeMirror LaTeX Source Editor + Snippet Bar */}
        <section
          aria-label="LaTeX Source Editor"
          className={`${
            mobilePane === "code" ? "flex w-full" : "hidden"
          } lg:flex lg:flex-1 flex-col border-r border-border min-w-0 min-h-0 bg-background`}
        >
          {/* Quick LaTeX Snippet Insertion Bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/40 border-b border-border overflow-x-auto latex-scroller shrink-0">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
                Insert:
              </span>
              <button
                type="button"
                onClick={() =>
                  editorRef.current?.insertAtCursor("\n\\section{Section Title}\n  \\resumeSubHeadingListStart\n\n  \\resumeSubHeadingListEnd\n")
                }
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                + \section
              </button>
              <button
                type="button"
                onClick={() =>
                  editorRef.current?.insertAtCursor(
                    "\n    \\resumeSubheading\n      {Role / Title}{Month Year -- Present}\n      {Company Name}{City, State}\n      \\resumeItemListStart\n        \\resumeItem{Accomplished [X] as measured by [Y] by doing [Z].}\n      \\resumeItemListEnd\n"
                  )
                }
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                + Job Entry
              </button>
              <button
                type="button"
                onClick={() =>
                  editorRef.current?.insertAtCursor(
                    "\n        \\resumeItem{Engineered high-throughput feature cutting latency by 35\\%.}"
                  )
                }
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                + \resumeItem
              </button>
              <button
                type="button"
                onClick={() =>
                  editorRef.current?.insertAtCursor(
                    "\n    \\resumeProjectHeading\n      {\\textbf{Project Name} $|$ \\emph{Tech Stack}}{2025}\n      \\resumeItemListStart\n        \\resumeItem{Built scalable system handling 10k+ requests/min.}\n      \\resumeItemListEnd\n"
                  )
                }
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                + Project
              </button>
              <button
                type="button"
                onClick={() => editorRef.current?.insertAtCursor("\\textbf{Bold Text}")}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                \textbf
              </button>
              <button
                type="button"
                onClick={() =>
                  editorRef.current?.insertAtCursor("\\href{https://example.com}{\\underline{Link Text}}")
                }
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border font-mono text-[10px] font-semibold shrink-0 cursor-pointer transition-colors"
              >
                \href
              </button>
            </div>

            <button
              type="button"
              onClick={() => applyTemplateSwitch(templateId)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer transition-colors"
              title="Regenerate clean LaTeX from structured data"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset TeX</span>
            </button>
          </div>

          {/* CodeMirror 6 Syntax-Highlighted Editor */}
          <LatexCodeEditor
            ref={editorRef}
            value={texSource}
            onChange={(val) => {
              setTexSource(val);
              setHasManualEdits(true);
            }}
            onCompileShortcut={() => compileLatex(texSource, compiler)}
          />
        </section>

        {/* Pane 2 (Right Half): Real TeX Live Compiled PDF Output */}
        <section
          aria-label="Compiled PDF Output Preview"
          className={`${
            mobilePane === "pdf" ? "flex w-full" : "hidden"
          } lg:flex lg:flex-1 flex-col min-w-0 min-h-0`}
        >
          <PdfPreviewPane
            pdfUrl={pdfUrl}
            isCompiling={isCompiling}
            compileError={compileError}
            lastCompiledAt={lastCompiledAt}
            compilerBackend={compilerBackend}
            compileDurationMs={compileDurationMs}
            onRecompile={() => compileLatex(texSource, compiler)}
            onDownloadPdf={handleDownloadPdf}
            onJumpToLine={(lineNum) => {
              setMobilePane("code");
              setTimeout(() => editorRef.current?.goToLine(lineNum), 50);
            }}
            onAiFixError={handleAiFixError}
            isFixingError={isFixingError}
          />
        </section>

        {/* Optional Pane 3: AI Copilot Right Sidebar */}
        {showAiSidebar && (
          <AiLatexSidebar
            onClose={() => setShowAiSidebar(false)}
            aiSuggestions={aiSuggestions}
            appliedSuggestionIds={appliedSuggestionIds}
            onApplySuggestion={handleApplySuggestion}
            jobTitle={jobTitle}
            company={company}
            location={location}
            jobDescription={jobDescription}
            onJobDescriptionChange={(jd) => {
              setJobDescription(jd);
              sessionStorage.setItem("jobDescription", jd);
            }}
            missingKeywords={missingKeywords}
            onAddKeywordToSkills={handleAddKeywordToSkills}
            onInsertBulletSnippet={handleInsertBulletSnippet}
            onTailorFullTex={handleTailorFullTex}
            isTailoringTex={isTailoringTex}
            tailorSummary={tailorSummary}
          />
        )}
      </div>

      {/* ── Accessible Native <dialog> Confirmation Before Overwriting Custom .tex Edits ── */}
      <dialog
        ref={confirmDialogRef}
        aria-labelledby={dialogTitleId}
        className="rounded-2xl border border-border bg-card text-foreground p-6 max-w-md w-[90%] shadow-2xl backdrop:bg-black/60 m-auto"
      >
        <h3 id={dialogTitleId} className="text-base font-bold text-foreground">
          Switch LaTeX Template?
        </h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          You have custom edits in <code className="font-mono bg-muted px-1 rounded">main.tex</code>. Switching templates will generate fresh LaTeX source from your structured resume data cleanly.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => {
              setPendingTemplate(null);
              confirmDialogRef.current?.close();
            }}
            className="px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold cursor-pointer"
          >
            Keep Current .tex
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingTemplate) applyTemplateSwitch(pendingTemplate);
              setPendingTemplate(null);
              confirmDialogRef.current?.close();
            }}
            className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold cursor-pointer"
          >
            Switch Template
          </button>
        </div>
      </dialog>
    </div>
  );
}
