"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Download, 
  Sparkles, 
  Wand2, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  ArrowRight, 
  Check, 
  Copy, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Edit3, 
  Columns, 
  FileEdit,
  ExternalLink,
  Target,
  Briefcase,
  Building2,
  MapPin,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { pdf } from "@react-pdf/renderer";
import { ResumeDocument, ResumeData } from "@/components/pdf/ResumeDocument";
import { Suggestion } from "@/components/analysis/ImprovementSuggestionCard";

const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alexrivera",
    github: "https://github.com/alexrivera",
    portfolio: "https://alexrivera.dev",
  },
  summary: "Senior Full-Stack Engineer with 6+ years of experience architecting high-throughput distributed systems, cloud microservices, and modern web applications. Proven track record of improving system uptime to 99.99% and reducing latency by 45%.",
  experience: [
    {
      company: "Apex Cloud Technologies",
      role: "Lead Full Stack Engineer",
      date: "2022 – Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected distributed event-streaming platform using Next.js, Node.js, and Apache Kafka, processing 1.4M daily requests with 99.99% availability.",
        "Optimized MongoDB indexing strategies and aggregation pipelines, slashing database query latency by 48%.",
        "Mentored team of 8 engineers and spearheaded adoption of TypeScript and automated CI/CD deployment pipelines."
      ]
    },
    {
      company: "Veloce Digital Systems",
      role: "Software Engineer",
      date: "2020 – 2022",
      location: "Austin, TX",
      bullets: [
        "Engineered customer onboarding portal that increased user conversion rates by 28% within 90 days of launch.",
        "Implemented Redis caching layer across microservices, reducing AWS infrastructure operating costs by $35,000 annually.",
        "Collaborated with product designers to build responsive design system using Tailwind CSS and React."
      ]
    }
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      date: "2016 – 2020",
      gpa: "3.85 / 4.0",
      bullets: [
        "Dean's Honors List (All Semesters)",
        "Coursework: Distributed Systems, Algorithms, Database Systems"
      ]
    }
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Go", "SQL"]
    },
    {
      category: "Frameworks & Libraries",
      items: ["Next.js", "React.js", "Node.js", "Express.js", "Tailwind CSS"]
    },
    {
      category: "Cloud & DevOps",
      items: ["Docker", "Kubernetes", "AWS (ECS, S3, RDS)", "CI/CD", "Redis", "Kafka"]
    }
  ],
  projects: [
    {
      name: "PulseStream Telemetry Engine",
      description: "Open-source distributed real-time metrics telemetry collector handling 50k logs/sec.",
      link: "https://github.com/alexrivera/pulsestream",
      date: "2023",
      bullets: [
        "Built with Go and React, achieving sub-10ms dashboard refresh latency.",
        "Gained 1,200+ GitHub stars and adopted by 15+ developer teams."
      ]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2023"
    }
  ]
};

const THEMES = [
  { id: "charcoal", name: "Executive Charcoal", accent: "#1e293b", border: "#334155" },
  { id: "emerald", name: "Modern Emerald", accent: "#047857", border: "#059669" },
  { id: "indigo", name: "Tech Indigo", accent: "#3730a3", border: "#4f46e5" },
  { id: "obsidian", name: "Obsidian Black", accent: "#09090b", border: "#27272a" },
];

export default function ResumeEditorPage() {
  const { user } = useAuth();

  // Core Resume State
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View & Customization Controls
  const [viewMode, setViewMode] = useState<"canvas" | "split" | "form">("canvas");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [zoomScale, setZoomScale] = useState(100); // 80, 90, 100, 110

  // Drawers & Side Panels
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showJdDrawer, setShowJdDrawer] = useState(false);

  // AI & JD Context
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<number>>(new Set());
  const [flashHighlight, setFlashHighlight] = useState<string | null>(null);

  // JD Data
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);

  // On-Demand AI Rewriter State inside Drawer
  const [customDraft, setCustomDraft] = useState("");
  const [customTone, setCustomTone] = useState("Metrics and Data Focused");
  const [isRewritingCustom, setIsRewritingCustom] = useState(false);
  const [customRewrites, setCustomRewrites] = useState<Array<{ text: string; reasoning: string }>>([]);

  // Load from session or Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try reading structured data from sessionStorage
        const cachedStructured = sessionStorage.getItem("resumeStructuredData");
        const cachedText = sessionStorage.getItem("resumeText");
        const cachedAiResult = sessionStorage.getItem("aiResult");
        
        const cachedJd = sessionStorage.getItem("jobDescription") || "";
        const cachedJobTitle = sessionStorage.getItem("jobTitle") || "";
        const cachedCompany = sessionStorage.getItem("company") || "";
        const cachedLocation = sessionStorage.getItem("location") || "";

        setJobDescription(cachedJd);
        setJobTitle(cachedJobTitle);
        setCompany(cachedCompany);
        setLocation(cachedLocation);

        if (cachedAiResult) {
          try {
            const parsedAi = JSON.parse(cachedAiResult);
            if (parsedAi.suggestions) setAiSuggestions(parsedAi.suggestions);
            if (parsedAi.keywordAnalysis?.missing) setMissingKeywords(parsedAi.keywordAnalysis.missing);
          } catch (e) {
            console.error("Failed to parse cached AI result", e);
          }
        }

        if (cachedStructured) {
          try {
            setResumeData(JSON.parse(cachedStructured));
            setIsLoadingInitial(false);
            return;
          } catch (e) {
            console.error("Failed to parse cached structured resume", e);
          }
        }

        // 2. If no structured data but we have raw text, convert via /api/build-resume
        if (cachedText) {
          try {
            const res = await fetch("/api/build-resume", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resumeText: cachedText }),
            });
            if (res.ok) {
              const structured = await res.json();
              setResumeData(structured);
              sessionStorage.setItem("resumeStructuredData", JSON.stringify(structured));
              setIsLoadingInitial(false);
              return;
            }
          } catch (err) {
            console.error("Failed to structure raw text", err);
          }
        }

        // 3. Fallback: Check Firestore
        if (user) {
          const docRef = doc(db, "users", user.uid, "data", "resume");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.structuredData) {
              setResumeData(data.structuredData);
              setIsLoadingInitial(false);
              return;
            }
          }
        }

        // 4. Default fallback: Alex Rivera sample
        setResumeData(DEFAULT_RESUME_DATA);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    loadData();
  }, [user]);

  // Save changes to sessionStorage & Firestore
  const handleSaveDraft = async () => {
    sessionStorage.setItem("resumeStructuredData", JSON.stringify(resumeData));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    if (user) {
      try {
        const docRef = doc(db, "users", user.uid, "data", "resume");
        await setDoc(docRef, { structuredData: resumeData }, { merge: true });
      } catch (err) {
        console.error("Failed to save to Firestore", err);
      }
    }
  };

  // Direct Vector PDF Download
  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    try {
      const docElement = <ResumeDocument data={resumeData} />;
      const blob = await pdf(docElement).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = resumeData.personalInfo?.name?.replace(/\s+/g, "_") || "Resume";
      a.download = `${cleanName}_Executive.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Apply an AI Suggestion directly into the Resume experience
  const handleApplySuggestion = (sug: Suggestion, index: number) => {
    const original = sug.original.trim().toLowerCase();
    const improved = sug.improved.trim();

    let replaced = false;

    // Search experience bullets
    const newExp = (resumeData.experience || []).map((exp) => {
      const newBullets = (exp.bullets || []).map((b) => {
        // If exact match or includes significant portion
        if (b.toLowerCase().includes(original) || original.includes(b.toLowerCase())) {
          replaced = true;
          return improved;
        }
        return b;
      });
      return { ...exp, bullets: newBullets };
    });

    // If not matched directly in existing bullets, prepend to first experience item
    if (!replaced && newExp.length > 0) {
      newExp[0].bullets = [improved, ...(newExp[0].bullets || [])];
    }

    setResumeData((prev) => ({ ...prev, experience: newExp }));
    setAppliedSuggestionIds((prev) => new Set(prev).add(index));

    // Flash highlight on canvas
    setFlashHighlight(improved);
    setTimeout(() => setFlashHighlight(null), 3000);

    handleSaveDraft();
  };

  // Add missing keyword to skills
  const handleAddKeywordToSkills = (keyword: string) => {
    setResumeData((prev) => {
      const currentSkills = prev.skills || [];
      if (currentSkills.length === 0) {
        return {
          ...prev,
          skills: [{ category: "Key Competencies", items: [keyword] }]
        };
      }
      // Add to first category if not already present
      const firstCat = { ...currentSkills[0] };
      const items = firstCat.items || [];
      if (!items.includes(keyword)) {
        firstCat.items = [...items, keyword];
      }
      return {
        ...prev,
        skills: [firstCat, ...currentSkills.slice(1)]
      };
    });

    setMissingKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  // On-demand AI Bullet Rewriter call
  const handleRunCustomRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDraft.trim()) return;

    setIsRewritingCustom(true);
    setCustomRewrites([]);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: customDraft,
          role: jobTitle || "Software Engineer",
          tone: customTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.options) {
          setCustomRewrites(data.options);
        }
      }
    } catch (err) {
      console.error("AI rewrite error", err);
    } finally {
      setIsRewritingCustom(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading In-App Resume Studio...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col -m-4 md:-m-6 bg-muted/20">
      
      {/* ── Top Editor Header & Toolbar ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-2.5 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
        
        {/* Left: Breadcrumbs & Title */}
        <div className="flex items-center gap-2 text-xs">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <Link href="/dashboard/analysis" className="text-muted-foreground hover:text-foreground transition-colors">
            Analysis
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <FileEdit className="w-3.5 h-3.5 text-primary" />
            Resume Studio
          </span>
        </div>

        {/* Center: View Switcher & Zoom */}
        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="inline-flex p-1 rounded-xl bg-muted/70 border border-border text-xs">
            <button
              onClick={() => setViewMode("canvas")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === "canvas" ? "bg-card text-foreground shadow-xs border border-border/80" : "text-muted-foreground hover:text-foreground"
              }`}
              title="A4 Document Sheet view"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Canvas</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === "split" ? "bg-card text-foreground shadow-xs border border-border/80" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Split View: Form + Preview"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode("form")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === "form" ? "bg-card text-foreground shadow-xs border border-border/80" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Structured Form Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Form</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-muted/50 border border-border text-xs">
            <button
              onClick={() => setZoomScale(Math.max(80, zoomScale - 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-semibold text-foreground px-1">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale(Math.min(120, zoomScale + 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions (AI Assistant, Save, Export PDF) */}
        <div className="flex items-center gap-2">
          
          {/* Target JD Matcher Toggle */}
          <button
            onClick={() => {
              setShowJdDrawer(!showJdDrawer);
              setShowAiDrawer(false);
            }}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showJdDrawer 
                ? "bg-primary/15 text-primary border-primary shadow-xs" 
                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Target JD Match</span>
            {missingKeywords.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {missingKeywords.length}
              </span>
            )}
          </button>

          {/* AI Improvements Drawer Toggle */}
          <button
            onClick={() => {
              setShowAiDrawer(!showAiDrawer);
              setShowJdDrawer(false);
            }}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showAiDrawer 
                ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                : "bg-card hover:bg-muted text-foreground border-border"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Rewriter</span>
            {aiSuggestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                {aiSuggestions.length - appliedSuggestionIds.size}
              </span>
            )}
          </button>

          {/* Save Draft Button */}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Direct Vector PDF Export */}
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPdfGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Center Canvas / Form Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          
          {/* VIEW: CANVAS / WYSIWYG A4 SHEET */}
          {(viewMode === "canvas" || viewMode === "split") && (
            <div 
              style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: "top center" }}
              className="transition-transform duration-200"
            >
              <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 p-12 space-y-6 font-sans relative">
                
                {/* Visual A4 Top Border Accent */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg"
                  style={{ backgroundColor: selectedTheme.accent }}
                />

                {/* ── 1. Personal Header ── */}
                <div className="text-center space-y-2 pb-4 border-b border-slate-200">
                  <input
                    type="text"
                    value={resumeData.personalInfo?.name || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, name: e.target.value }
                    }))}
                    placeholder="Your Full Name"
                    className="w-full text-center text-2xl font-bold tracking-tight text-slate-900 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none rounded px-2 py-1"
                  />

                  {/* Contact Links Bar */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                    <input
                      type="text"
                      value={resumeData.personalInfo?.email || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      placeholder="Email Address"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5"
                    />
                    <span>•</span>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.phone || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      placeholder="Phone Number"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5"
                    />
                    <span>•</span>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.location || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      placeholder="City, State / Country"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5"
                    />
                  </div>

                  {/* Links Row */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-blue-600 font-medium pt-0.5">
                    <input
                      type="text"
                      value={resumeData.personalInfo?.linkedin || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                      }))}
                      placeholder="LinkedIn URL"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5 text-blue-600"
                    />
                    <span>•</span>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.github || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, github: e.target.value }
                      }))}
                      placeholder="GitHub URL"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5 text-blue-600"
                    />
                    <span>•</span>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.portfolio || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, portfolio: e.target.value }
                      }))}
                      placeholder="Portfolio URL"
                      className="text-center hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5 text-blue-600"
                    />
                  </div>
                </div>

                {/* ── 2. Professional Summary ── */}
                <div className="space-y-1.5 group">
                  <div className="flex items-center justify-between">
                    <h2 
                      className="text-xs font-bold uppercase tracking-wider text-slate-800"
                      style={{ color: selectedTheme.accent }}
                    >
                      Professional Summary
                    </h2>
                    <button
                      onClick={() => {
                        setCustomDraft(resumeData.summary || "");
                        setShowAiDrawer(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-emerald-600 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Polish Summary with AI</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={resumeData.summary || ""}
                    onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Enter a compelling 2-3 sentence overview of your career achievements..."
                    className="w-full text-xs text-slate-700 leading-relaxed hover:bg-slate-50 focus:bg-slate-50 focus:outline-none rounded p-2 resize-none"
                  />
                </div>

                {/* ── 3. Experience ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <h2 
                      className="text-xs font-bold uppercase tracking-wider text-slate-800"
                      style={{ color: selectedTheme.accent }}
                    >
                      Professional Experience
                    </h2>
                    <button
                      onClick={() => {
                        setResumeData(prev => ({
                          ...prev,
                          experience: [
                            ...(prev.experience || []),
                            {
                              company: "New Company",
                              role: "Job Title",
                              date: "2023 – Present",
                              location: "City, State",
                              bullets: ["Engineered core feature improving performance by 25%."]
                            }
                          ]
                        }));
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Position</span>
                    </button>
                  </div>

                  {/* Experience List */}
                  {(resumeData.experience || []).map((exp, expIdx) => (
                    <div key={expIdx} className="space-y-2 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-all group/exp">
                      
                      {/* Company & Role Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={exp.role || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].role = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Role / Title"
                            className="font-bold text-xs text-slate-900 hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5"
                          />
                          <span className="text-slate-400">at</span>
                          <input
                            type="text"
                            value={exp.company || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].company = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Company Name"
                            className="font-bold text-xs text-slate-900 hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exp.date || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].date = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Dates"
                            className="text-right text-[11px] font-medium text-slate-500 hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5 w-28"
                          />
                          <button
                            onClick={() => {
                              const newExp = (resumeData.experience || []).filter((_, i) => i !== expIdx);
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            className="opacity-0 group-hover/exp:opacity-100 transition-opacity p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete this position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bullets List */}
                      <div className="space-y-1.5 pl-2">
                        {(exp.bullets || []).map((bullet, bulletIdx) => {
                          const isHighlighted = flashHighlight === bullet;
                          return (
                            <div 
                              key={bulletIdx} 
                              className={`flex items-start gap-2 group/bullet p-1 rounded transition-colors ${
                                isHighlighted ? "bg-emerald-100 ring-2 ring-emerald-400" : "hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-slate-400 mt-1 select-none font-bold text-xs">•</span>
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => {
                                  const newExp = [...(resumeData.experience || [])];
                                  newExp[expIdx].bullets![bulletIdx] = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: newExp }));
                                }}
                                className="w-full text-xs text-slate-700 leading-relaxed bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 rounded p-1 resize-none"
                              />

                              {/* Bullet actions: AI Polish & Delete */}
                              <div className="opacity-0 group-hover/bullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-0.5">
                                <button
                                  onClick={() => {
                                    setCustomDraft(bullet);
                                    setShowAiDrawer(true);
                                  }}
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="AI Enhance this bullet"
                                >
                                  <Wand2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newExp = [...(resumeData.experience || [])];
                                    newExp[expIdx].bullets = newExp[expIdx].bullets!.filter((_, i) => i !== bulletIdx);
                                    setResumeData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Delete bullet"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Bullet Button */}
                        <button
                          onClick={() => {
                            const newExp = [...(resumeData.experience || [])];
                            newExp[expIdx].bullets = [...(newExp[expIdx].bullets || []), "Engineered solution that improved key performance metric."];
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 pt-1 cursor-pointer pl-4"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add Bullet Point</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* ── 4. Skills Matrix ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <h2 
                      className="text-xs font-bold uppercase tracking-wider text-slate-800"
                      style={{ color: selectedTheme.accent }}
                    >
                      Technical Skills
                    </h2>
                    <button
                      onClick={() => {
                        setResumeData(prev => ({
                          ...prev,
                          skills: [
                            ...(prev.skills || []),
                            { category: "Specialized Tools", items: ["Git", "Postman"] }
                          ]
                        }));
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(resumeData.skills || []).map((skillCat, catIdx) => (
                      <div key={catIdx} className="flex items-start gap-3 text-xs">
                        <input
                          type="text"
                          value={skillCat.category || ""}
                          onChange={(e) => {
                            const newSkills = [...(resumeData.skills || [])];
                            newSkills[catIdx].category = e.target.value;
                            setResumeData(prev => ({ ...prev, skills: newSkills }));
                          }}
                          className="font-bold text-slate-800 w-36 hover:bg-slate-50 focus:bg-slate-50 rounded px-1.5 py-0.5 shrink-0"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {(skillCat.items || []).map((skill, sIdx) => (
                            <span 
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium group/tag"
                            >
                              <span>{skill}</span>
                              <button
                                onClick={() => {
                                  const newSkills = [...(resumeData.skills || [])];
                                  newSkills[catIdx].items = newSkills[catIdx].items!.filter((_, i) => i !== sIdx);
                                  setResumeData(prev => ({ ...prev, skills: newSkills }));
                                }}
                                className="opacity-0 group-hover/tag:opacity-100 hover:text-rose-500 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}

                          {/* Quick Add Skill Chip */}
                          <input
                            type="text"
                            placeholder="+ Add skill..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                const newSkills = [...(resumeData.skills || [])];
                                newSkills[catIdx].items = [...(newSkills[catIdx].items || []), e.currentTarget.value.trim()];
                                setResumeData(prev => ({ ...prev, skills: newSkills }));
                                e.currentTarget.value = "";
                              }
                            }}
                            className="text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100 rounded px-2 py-0.5 w-24 focus:outline-none focus:ring-1 focus:ring-slate-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 5. Education ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <h2 
                      className="text-xs font-bold uppercase tracking-wider text-slate-800"
                      style={{ color: selectedTheme.accent }}
                    >
                      Education
                    </h2>
                    <button
                      onClick={() => {
                        setResumeData(prev => ({
                          ...prev,
                          education: [
                            ...(prev.education || []),
                            {
                              institution: "University Name",
                              degree: "B.S. in Computer Science",
                              date: "2018 – 2022",
                              gpa: "3.8 GPA"
                            }
                          ]
                        }));
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Degree</span>
                    </button>
                  </div>

                  {(resumeData.education || []).map((edu, eduIdx) => (
                    <div key={eduIdx} className="flex items-center justify-between text-xs group/edu">
                      <div>
                        <input
                          type="text"
                          value={edu.degree || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].degree = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Degree Name"
                          className="font-bold text-slate-900 hover:bg-slate-50 rounded px-1.5 py-0.5"
                        />
                        <span className="text-slate-400">, </span>
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].institution = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Institution"
                          className="text-slate-700 hover:bg-slate-50 rounded px-1.5 py-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={edu.date || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].date = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Dates"
                          className="text-right text-[11px] text-slate-500 hover:bg-slate-50 rounded px-1.5 py-0.5 w-24"
                        />
                        <button
                          onClick={() => {
                            const newEdu = (resumeData.education || []).filter((_, i) => i !== eduIdx);
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          className="opacity-0 group-hover/edu:opacity-100 text-rose-500 hover:bg-rose-50 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── 6. Projects ── */}
                {(resumeData.projects && resumeData.projects.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <h2 
                        className="text-xs font-bold uppercase tracking-wider text-slate-800"
                        style={{ color: selectedTheme.accent }}
                      >
                        Projects
                      </h2>
                    </div>

                    {resumeData.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={proj.name || ""}
                            onChange={(e) => {
                              const newProj = [...(resumeData.projects || [])];
                              newProj[pIdx].name = e.target.value;
                              setResumeData(prev => ({ ...prev, projects: newProj }));
                            }}
                            className="font-bold text-slate-900 hover:bg-slate-50 rounded px-1.5 py-0.5"
                          />
                          <input
                            type="text"
                            value={proj.date || ""}
                            onChange={(e) => {
                              const newProj = [...(resumeData.projects || [])];
                              newProj[pIdx].date = e.target.value;
                              setResumeData(prev => ({ ...prev, projects: newProj }));
                            }}
                            className="text-right text-[11px] text-slate-500 hover:bg-slate-50 rounded px-1.5 py-0.5 w-20"
                          />
                        </div>
                        <input
                          type="text"
                          value={proj.description || ""}
                          onChange={(e) => {
                            const newProj = [...(resumeData.projects || [])];
                            newProj[pIdx].description = e.target.value;
                            setResumeData(prev => ({ ...prev, projects: newProj }));
                          }}
                          className="w-full text-slate-600 text-[11px] hover:bg-slate-50 rounded px-1.5 py-0.5"
                        />
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VIEW: FORM EDITOR */}
          {viewMode === "form" && (
            <div className="max-w-3xl w-full space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.name || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Email</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo?.email || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Phone</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.phone || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo?.location || ""}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Form Professional Summary */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
                <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Professional Summary
                </h2>
                <textarea
                  rows={4}
                  value={resumeData.summary || ""}
                  onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

        </div>

        {/* ── Right Drawer: AI Improvements Assistant ── */}
        {showAiDrawer && (
          <aside className="w-80 md:w-96 border-l border-border bg-card/95 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 shadow-2xl z-40 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">AI Improvement Studio</h3>
                    <p className="text-[11px] text-muted-foreground">Directly embed enhancements</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scanned AI Suggestions from Resume vs JD */}
              {aiSuggestions.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Scanned Recommendations</span>
                    <span className="text-muted-foreground font-mono">
                      {appliedSuggestionIds.size}/{aiSuggestions.length} Applied
                    </span>
                  </div>

                  <div className="space-y-3">
                    {aiSuggestions.map((sug, idx) => {
                      const isApplied = appliedSuggestionIds.has(idx);
                      return (
                        <div 
                          key={idx}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                            isApplied 
                              ? "bg-emerald-500/5 border-emerald-500/30 opacity-70" 
                              : "bg-background border-border shadow-xs hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              AI Enhancement
                            </span>
                            <span className={`text-[10px] font-bold ${
                              sug.impact === "High" ? "text-blue-500" : "text-amber-500"
                            }`}>
                              {sug.impact} Impact
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground line-through">
                              {sug.original}
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {sug.improved}
                            </p>
                          </div>

                          {sug.reason && (
                            <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1">
                              Why: {sug.reason}
                            </p>
                          )}

                          <button
                            onClick={() => handleApplySuggestion(sug, idx)}
                            disabled={isApplied}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isApplied
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Applied to Canvas</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Apply to Resume</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground mb-6">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary" />
                  No pre-scanned suggestions. Use the custom rewriter below to generate metric-backed bullets!
                </div>
              )}

              {/* On-Demand Custom Rewriter */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  <span>On-Demand Bullet Rewriter</span>
                </div>

                <form onSubmit={handleRunCustomRewrite} className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    placeholder="Paste any bullet or sentence to enhance..."
                    className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground resize-none"
                  />

                  <select
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    className="w-full p-2 rounded-lg bg-background border border-border text-xs text-foreground font-medium"
                  >
                    <option value="Metrics and Data Focused">Metrics & Data Focused</option>
                    <option value="Professional and Impact-Driven">Professional & Impact</option>
                    <option value="Leadership and Initiative">Leadership & Initiative</option>
                    <option value="Technical Depth and Problem Solving">Technical Depth</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isRewritingCustom || !customDraft.trim()}
                    className="w-full py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isRewritingCustom ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Enhancements...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Generate AI Variations</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Generated Custom Rewrites */}
                {customRewrites.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {customRewrites.map((opt, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-background border border-border text-xs space-y-1.5">
                        <p className="text-foreground font-medium">{opt.text}</p>
                        <p className="text-[10px] text-muted-foreground italic">{opt.reasoning}</p>
                        <button
                          onClick={() => {
                            // Insert into first experience
                            const newExp = [...(resumeData.experience || [])];
                            if (newExp.length > 0) {
                              newExp[0].bullets = [opt.text, ...(newExp[0].bullets || [])];
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                              setFlashHighlight(opt.text);
                              setTimeout(() => setFlashHighlight(null), 3000);
                            }
                          }}
                          className="w-full py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          + Insert into Experience
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </aside>
        )}

        {/* ── Right Drawer: Target Job Description & Match Radar ── */}
        {showJdDrawer && (
          <aside className="w-80 md:w-96 border-l border-border bg-card/95 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 shadow-2xl z-40 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Target JD Match Radar</h3>
                    <p className="text-[11px] text-muted-foreground">Keyword alignment</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJdDrawer(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Job Metadata */}
              {(jobTitle || company || location) && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 mb-5 text-xs">
                  {jobTitle && (
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      <span>{jobTitle}</span>
                    </div>
                  )}
                  {company && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{company}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Keywords Checklist */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Missing Target Keywords</span>
                  <span className="text-muted-foreground font-mono">
                    {missingKeywords.length} Remaining
                  </span>
                </div>

                {missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingKeywords.map((kw, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddKeywordToSkills(kw)}
                        className="group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-pointer"
                        title="Click to insert directly into Skills"
                      >
                        <span>{kw}</span>
                        <Plus className="w-3 h-3 group-hover:scale-125 transition-transform" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All critical target keywords matched!</span>
                  </div>
                )}
              </div>

              {/* Target Job Description Preview */}
              {jobDescription && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground block">
                    Target Job Description Text
                  </span>
                  <div className="p-3 rounded-xl bg-background border border-border max-h-60 overflow-y-auto text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {jobDescription}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

      </div>

    </div>
  );
}
