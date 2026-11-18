"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Download, 
  Sparkles, 
  Wand2, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Edit3, 
  Columns, 
  FileEdit,
  Target,
  Briefcase,
  Building2,
  MapPin,
  X,
  Loader2,
  FileCheck2,
  Gauge
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
    phone: "(555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera",
    github: "github.com/alexrivera",
    portfolio: "alexrivera.dev",
  },
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science; GPA: 3.85 / 4.0",
      date: "Aug 2016 – May 2020",
      location: "Berkeley, CA",
      bullets: [
        "Relevant Coursework: Distributed Systems, Operating Systems, Database Systems, Computer Networks"
      ]
    }
  ],
  experience: [
    {
      company: "Apex Cloud Technologies",
      role: "Lead Full Stack Engineer",
      date: "June 2022 – Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected distributed event-streaming platform using Next.js, Node.js, and Apache Kafka, processing 1.4M daily requests with 99.99% availability.",
        "Optimized MongoDB compound indexing strategies and aggregation pipelines, slashing database query latency by 48%.",
        "Mentored team of 8 engineers and spearheaded adoption of TypeScript and automated CI/CD deployment pipelines."
      ]
    },
    {
      company: "Veloce Digital Systems",
      role: "Software Engineer",
      date: "June 2020 – May 2022",
      location: "Austin, TX",
      bullets: [
        "Engineered customer onboarding portal that increased user conversion rates by 28% within 90 days of launch.",
        "Implemented Redis caching layer across microservices, reducing AWS infrastructure operating costs by $35,000 annually.",
        "Collaborated with product designers to build responsive design system using Tailwind CSS and React."
      ]
    }
  ],
  projects: [
    {
      name: "PulseStream Telemetry Engine | Go, React, Kafka, Redis",
      date: "2023",
      bullets: [
        "Built open-source real-time metrics telemetry engine capable of handling 50,000 logs/sec with sub-10ms UI latency.",
        "Gained 1,200+ GitHub stars and adopted by 15+ engineering teams for internal microservice monitoring."
      ]
    }
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML/CSS"]
    },
    {
      category: "Frameworks & Libraries",
      items: ["Next.js", "React.js", "Node.js", "Express.js", "Tailwind CSS", "Redux"]
    },
    {
      category: "Cloud & Developer Tools",
      items: ["Docker", "Kubernetes", "AWS (ECS, S3, RDS)", "Git", "CI/CD", "Redis", "Kafka"]
    }
  ]
};

const TEMPLATES = [
  { id: "jakes", name: "Jake's ATS Classic (Overleaf)", font: "font-sans", border: "border-neutral-900" },
  { id: "harvard", name: "Harvard Academic", font: "font-serif", border: "border-neutral-900" },
  { id: "modern", name: "Modern Compact", font: "font-sans", border: "border-blue-700" },
];

export default function ResumeEditorPage() {
  const { user } = useAuth();

  // Core Resume State
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Template & Customization
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [zoomScale, setZoomScale] = useState(100);

  // Drawers
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

  // Custom AI Rewriter State
  const [customDraft, setCustomDraft] = useState("");
  const [customTone, setCustomTone] = useState("Metrics and Data Focused");
  const [isRewritingCustom, setIsRewritingCustom] = useState(false);
  const [customRewrites, setCustomRewrites] = useState<Array<{ text: string; reasoning: string }>>([]);

  // Load from session or Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
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

        setResumeData(DEFAULT_RESUME_DATA);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    loadData();
  }, [user]);

  // Save changes
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
      a.download = `${cleanName}_Executive_ATS.pdf`;
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

  // Apply an AI Suggestion
  const handleApplySuggestion = (sug: Suggestion, index: number) => {
    const original = sug.original.trim().toLowerCase();
    const improved = sug.improved.trim();

    let replaced = false;

    const newExp = (resumeData.experience || []).map((exp) => {
      const newBullets = (exp.bullets || []).map((b) => {
        if (b.toLowerCase().includes(original) || original.includes(b.toLowerCase())) {
          replaced = true;
          return improved;
        }
        return b;
      });
      return { ...exp, bullets: newBullets };
    });

    if (!replaced && newExp.length > 0) {
      newExp[0].bullets = [improved, ...(newExp[0].bullets || [])];
    }

    setResumeData((prev) => ({ ...prev, experience: newExp }));
    setAppliedSuggestionIds((prev) => new Set(prev).add(index));

    setFlashHighlight(improved);
    setTimeout(() => setFlashHighlight(null), 3000);

    handleSaveDraft();
  };

  // Add keyword to skills
  const handleAddKeywordToSkills = (keyword: string) => {
    setResumeData((prev) => {
      const currentSkills = prev.skills || [];
      if (currentSkills.length === 0) {
        return {
          ...prev,
          skills: [{ category: "Key Competencies", items: [keyword] }]
        };
      }
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

  // Custom AI Rewriter call
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

  // Estimate page fit density
  const totalExperienceBullets = (resumeData.experience || []).reduce((acc, e) => acc + (e.bullets?.length || 0), 0);
  const totalProjectBullets = (resumeData.projects || []).reduce((acc, p) => acc + (p.bullets?.length || 0), 0);
  const isOnePageFit = (totalExperienceBullets + totalProjectBullets) <= 12;

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Formatting into standard ATS resume template...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col -m-4 md:-m-6 bg-neutral-100 dark:bg-neutral-950">
      
      {/* ── Top Toolbar ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-2 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
        
        {/* Left: Breadcrumbs & Page Length Gauge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/dashboard/analysis" className="hover:text-foreground transition-colors">
              Analysis
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-bold text-foreground">ATS Editor</span>
          </div>

          {/* 1-Page ATS Safe Indicator */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isOnePageFit
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}>
            <Gauge className="w-3 h-3" />
            {isOnePageFit ? "1-Page Standard Fit" : "Approaching 2 Pages"}
          </span>
        </div>

        {/* Center: Template & Zoom Selector */}
        <div className="flex items-center gap-2">
          
          {/* Template Format Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-muted-foreground font-semibold hidden md:inline">Template:</span>
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = TEMPLATES.find(t => t.id === e.target.value);
                if (found) setSelectedTemplate(found);
              }}
              className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-card border border-border text-xs">
            <button
              onClick={() => setZoomScale(Math.max(80, zoomScale - 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] font-bold text-foreground px-1">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale(Math.min(120, zoomScale + 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
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
            <span className="hidden sm:inline">Target JD Match</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
        
        {/* Canvas Scrollable Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          
          <div 
            style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: "top center" }}
            className="transition-transform duration-200"
          >
            {/* ── STRICT ATS PRINTED RESUME SHEET (Jake's / Harvard Standard) ── */}
            <div className={`w-[816px] min-h-[1056px] bg-white text-neutral-900 shadow-2xl p-[36px] md:p-[42px] leading-[1.3] text-[9.5pt] ${selectedTemplate.font} select-text relative`}>
              
              {/* ── 1. HEADER (Centered, Compact) ── */}
              <div className="text-center mb-3">
                <input
                  type="text"
                  value={resumeData.personalInfo?.name || ""}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  placeholder="FIRST LAST"
                  className="w-full text-center text-[20pt] font-bold tracking-tight text-neutral-900 uppercase hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 transition-colors"
                />

                {/* Single-line Contact Bar */}
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-[9pt] text-neutral-700 font-normal mt-0.5">
                  <input
                    type="text"
                    value={resumeData.personalInfo?.phone || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: e.target.value }
                    }))}
                    placeholder="(123) 456-7890"
                    className="text-center hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-28 text-neutral-800"
                  />
                  <span>|</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo?.email || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, email: e.target.value }
                    }))}
                    placeholder="email@example.com"
                    className="text-center hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 text-blue-700"
                  />
                  <span>|</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo?.location || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, location: e.target.value }
                    }))}
                    placeholder="City, State"
                    className="text-center hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32 text-neutral-800"
                  />
                  <span>|</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo?.linkedin || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                    }))}
                    placeholder="linkedin.com/in/handle"
                    className="text-center hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 text-blue-700"
                  />
                  <span>|</span>
                  <input
                    type="text"
                    value={resumeData.personalInfo?.github || ""}
                    onChange={(e) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, github: e.target.value }
                    }))}
                    placeholder="github.com/handle"
                    className="text-center hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 text-blue-700"
                  />
                </div>
              </div>

              {/* ── 2. EDUCATION SECTION (ATS Standard Placement) ── */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between pb-0.5 mb-1.5 border-b border-neutral-900">
                  <h2 className="text-[10pt] font-bold uppercase tracking-wider text-neutral-900">
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
                            degree: "B.S. in Computer Science; GPA: 3.8",
                            date: "Aug 2018 – May 2022",
                            location: "City, State",
                            bullets: []
                          }
                        ]
                      }));
                    }}
                    className="text-[9px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add School</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(resumeData.education || []).map((edu, eduIdx) => (
                    <div key={eduIdx} className="group/edu relative">
                      <div className="flex justify-between items-baseline font-bold text-[9.5pt]">
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].institution = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Institution Name"
                          className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 flex-1"
                        />
                        <input
                          type="text"
                          value={edu.location || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].location = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="City, State"
                          className="font-normal text-[9pt] text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-28 shrink-0"
                        />
                      </div>

                      <div className="flex justify-between items-baseline text-[9pt] text-neutral-800 italic">
                        <input
                          type="text"
                          value={edu.degree || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].degree = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Degree and Major; GPA"
                          className="italic text-[9pt] text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 flex-1"
                        />
                        <input
                          type="text"
                          value={edu.date || ""}
                          onChange={(e) => {
                            const newEdu = [...(resumeData.education || [])];
                            newEdu[eduIdx].date = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                          placeholder="Dates"
                          className="not-italic text-[9pt] text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32 shrink-0"
                        />
                      </div>

                      {/* Delete education button */}
                      <button
                        onClick={() => {
                          const newEdu = (resumeData.education || []).filter((_, i) => i !== eduIdx);
                          setResumeData(prev => ({ ...prev, education: newEdu }));
                        }}
                        className="absolute -right-5 top-0 opacity-0 group-hover/edu:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer"
                        title="Delete school"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 3. EXPERIENCE SECTION ── */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between pb-0.5 mb-1.5 border-b border-neutral-900">
                  <h2 className="text-[10pt] font-bold uppercase tracking-wider text-neutral-900">
                    Experience
                  </h2>
                  <button
                    onClick={() => {
                      setResumeData(prev => ({
                        ...prev,
                        experience: [
                          ...(prev.experience || []),
                          {
                            company: "Company Name",
                            role: "Title / Role",
                            date: "Month Year – Present",
                            location: "City, State",
                            bullets: [
                              "Engineered scalable solution that improved system throughput by 25%."
                            ]
                          }
                        ]
                      }));
                    }}
                    className="text-[9px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(resumeData.experience || []).map((exp, expIdx) => (
                    <div key={expIdx} className="group/exp relative">
                      
                      {/* Top Line: Role & Company | Date & Location */}
                      <div className="flex justify-between items-baseline font-bold text-[9.5pt]">
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={exp.role || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].role = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Job Title"
                            className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1"
                          />
                          <span className="font-normal text-neutral-500">|</span>
                          <input
                            type="text"
                            value={exp.company || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].company = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Company Name"
                            className="font-semibold text-[9.5pt] text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-[9pt]">
                          <input
                            type="text"
                            value={exp.date || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].date = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Dates"
                            className="font-normal text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32"
                          />
                          <input
                            type="text"
                            value={exp.location || ""}
                            onChange={(e) => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].location = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            placeholder="Location"
                            className="font-normal text-right text-neutral-600 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-28"
                          />
                        </div>
                      </div>

                      {/* Bullets (Clean, Tight ATS Indent) */}
                      <ul className="list-none space-y-1 mt-1 pl-3">
                        {(exp.bullets || []).map((bullet, bulletIdx) => {
                          const isHighlighted = flashHighlight === bullet;
                          return (
                            <li 
                              key={bulletIdx}
                              className={`flex items-start gap-1.5 group/bullet text-[9pt] leading-[1.3] text-neutral-800 transition-colors ${
                                isHighlighted ? "bg-emerald-100 ring-2 ring-emerald-400 rounded" : ""
                              }`}
                            >
                              <span className="select-none font-bold text-neutral-900 mt-0.5">•</span>
                              <textarea
                                rows={1}
                                value={bullet}
                                onInput={(e) => {
                                  // auto grow height
                                  const target = e.currentTarget;
                                  target.style.height = "auto";
                                  target.style.height = `${target.scrollHeight}px`;
                                }}
                                onChange={(e) => {
                                  const newExp = [...(resumeData.experience || [])];
                                  newExp[expIdx].bullets![bulletIdx] = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: newExp }));
                                }}
                                className="w-full bg-transparent hover:bg-neutral-50/60 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.3]"
                              />

                              {/* Ghost Actions on Hover */}
                              <div className="opacity-0 group-hover/bullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
                                <button
                                  onClick={() => {
                                    setCustomDraft(bullet);
                                    setShowAiDrawer(true);
                                  }}
                                  className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                  title="AI Polish bullet"
                                >
                                  <Wand2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newExp = [...(resumeData.experience || [])];
                                    newExp[expIdx].bullets = newExp[expIdx].bullets!.filter((_, i) => i !== bulletIdx);
                                    setResumeData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  className="p-0.5 rounded text-neutral-400 hover:text-rose-500 cursor-pointer"
                                  title="Delete bullet"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </li>
                          );
                        })}

                        {/* Add bullet link */}
                        <li className="pt-0.5">
                          <button
                            onClick={() => {
                              const newExp = [...(resumeData.experience || [])];
                              newExp[expIdx].bullets = [...(newExp[expIdx].bullets || []), "Engineered optimized workflow that slashed latency by 35%."];
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                            className="text-[8.5pt] font-semibold text-neutral-400 hover:text-neutral-700 flex items-center gap-1 cursor-pointer pl-3"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add bullet</span>
                          </button>
                        </li>
                      </ul>

                      {/* Delete Position Button */}
                      <button
                        onClick={() => {
                          const newExp = (resumeData.experience || []).filter((_, i) => i !== expIdx);
                          setResumeData(prev => ({ ...prev, experience: newExp }));
                        }}
                        className="absolute -right-5 top-0 opacity-0 group-hover/exp:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer"
                        title="Delete position"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                    </div>
                  ))}
                </div>
              </div>

              {/* ── 4. PROJECTS SECTION ── */}
              {(resumeData.projects && resumeData.projects.length > 0) && (
                <div className="mb-3.5">
                  <div className="flex items-center justify-between pb-0.5 mb-1.5 border-b border-neutral-900">
                    <h2 className="text-[10pt] font-bold uppercase tracking-wider text-neutral-900">
                      Projects
                    </h2>
                    <button
                      onClick={() => {
                        setResumeData(prev => ({
                          ...prev,
                          projects: [
                            ...(prev.projects || []),
                            {
                              name: "Project Name | Tech Stack",
                              date: "2023",
                              bullets: ["Built real-time system handling 20,000 active users."]
                            }
                          ]
                        }));
                      }}
                      className="text-[9px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {resumeData.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="group/proj relative">
                        <div className="flex justify-between items-baseline font-bold text-[9.5pt]">
                          <input
                            type="text"
                            value={proj.name || ""}
                            onChange={(e) => {
                              const newProj = [...(resumeData.projects || [])];
                              newProj[pIdx].name = e.target.value;
                              setResumeData(prev => ({ ...prev, projects: newProj }));
                            }}
                            placeholder="Project Name | Tech Stack"
                            className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 flex-1"
                          />
                          <input
                            type="text"
                            value={proj.date || ""}
                            onChange={(e) => {
                              const newProj = [...(resumeData.projects || [])];
                              newProj[pIdx].date = e.target.value;
                              setResumeData(prev => ({ ...prev, projects: newProj }));
                            }}
                            placeholder="Date"
                            className="font-normal text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-24 shrink-0 text-[9pt]"
                          />
                        </div>

                        <ul className="list-none space-y-1 mt-0.5 pl-3">
                          {(proj.bullets || []).map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-1.5 text-[9pt] leading-[1.3] text-neutral-800">
                              <span className="select-none font-bold text-neutral-900 mt-0.5">•</span>
                              <textarea
                                rows={1}
                                value={b}
                                onChange={(e) => {
                                  const newProj = [...(resumeData.projects || [])];
                                  newProj[pIdx].bullets![bIdx] = e.target.value;
                                  setResumeData(prev => ({ ...prev, projects: newProj }));
                                }}
                                className="w-full bg-transparent hover:bg-neutral-50/60 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.3]"
                              />
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => {
                            const newProj = (resumeData.projects || []).filter((_, i) => i !== pIdx);
                            setResumeData(prev => ({ ...prev, projects: newProj }));
                          }}
                          className="absolute -right-5 top-0 opacity-0 group-hover/proj:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. TECHNICAL SKILLS SECTION (Inline Categorized Text Format) ── */}
              <div>
                <div className="flex items-center justify-between pb-0.5 mb-1.5 border-b border-neutral-900">
                  <h2 className="text-[10pt] font-bold uppercase tracking-wider text-neutral-900">
                    Technical Skills
                  </h2>
                  <button
                    onClick={() => {
                      setResumeData(prev => ({
                        ...prev,
                        skills: [
                          ...(prev.skills || []),
                          { category: "Developer Tools", items: ["Git", "Docker", "Linux"] }
                        ]
                      }));
                    }}
                    className="text-[9px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="space-y-1 text-[9pt] leading-[1.35]">
                  {(resumeData.skills || []).map((cat, catIdx) => (
                    <div key={catIdx} className="flex items-baseline gap-1 group/skill">
                      <input
                        type="text"
                        value={cat.category ? `${cat.category}:` : ""}
                        onChange={(e) => {
                          const newSkills = [...(resumeData.skills || [])];
                          newSkills[catIdx].category = e.target.value.replace(/:$/, "");
                          setResumeData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        placeholder="Category:"
                        className="font-bold text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 shrink-0 w-36"
                      />
                      <input
                        type="text"
                        value={(cat.items || []).join(", ")}
                        onChange={(e) => {
                          const newSkills = [...(resumeData.skills || [])];
                          newSkills[catIdx].items = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          setResumeData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        placeholder="Comma-separated items (e.g. Python, TypeScript, Docker)"
                        className="text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 flex-1 font-normal"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Right Drawer: AI Improvements Studio ── */}
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
                    <p className="text-[11px] text-muted-foreground">Click to apply directly to resume</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scanned Suggestions */}
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
                  No pre-scanned suggestions. Use the on-demand rewriter below to inject metrics into any bullet!
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
