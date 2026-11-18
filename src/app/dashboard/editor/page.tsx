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
  Gauge,
  Copy,
  ChevronUp,
  ChevronDown,
  Columns2,
  UploadCloud,
  Printer,
  Palette,
  LayoutTemplate,
  Sliders,
  Maximize2,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { pdf } from "@react-pdf/renderer";
import { ResumeDocument, ResumeData } from "@/components/pdf/ResumeDocument";
import { Suggestion } from "@/components/analysis/ImprovementSuggestionCard";

// ── Auto-Resizing Textarea for Bullet Points (Prevents any clipping or overlap) ──
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 22)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

// ── Auto-Width Input for Header Contact Bar ──
function AutoWidthInput({
  value,
  onChange,
  placeholder,
  className,
  isLink = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  isLink?: boolean;
}) {
  const displayVal = value || "";
  const len = Math.max(displayVal.length || placeholder.length, 6);
  const widthCh = `${Math.min(Math.max(len + 1, 8), 34)}ch`;

  return (
    <input
      type="text"
      value={displayVal}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: widthCh }}
      className={`text-center hover:bg-neutral-100 focus:bg-blue-50 focus:outline-none rounded px-1.5 py-0.5 transition-all ${
        isLink ? "text-neutral-900 underline decoration-neutral-300" : "text-neutral-800"
      } ${className || ""}`}
    />
  );
}

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
  summary: "Results-driven Software Engineer with 5+ years of experience engineering high-scale distributed systems, event-driven architectures, and high-performance web applications.",
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
  ],
  customSections: []
};

type SectionKey = "summary" | "education" | "experience" | "projects" | "skills" | "certifications" | "custom";

const COLOR_THEMES = [
  { id: "black", name: "Noir Black", border: "border-neutral-900", text: "text-neutral-900", line: "#000000" },
  { id: "navy", name: "Executive Navy", border: "border-blue-900", text: "text-blue-900", line: "#1e3a8a" },
  { id: "emerald", name: "Modern Emerald", border: "border-emerald-800", text: "text-emerald-800", line: "#065f46" },
  { id: "burgundy", name: "Classic Crimson", border: "border-rose-900", text: "text-rose-900", line: "#881337" },
  { id: "slate", name: "Slate Minimal", border: "border-slate-800", text: "text-slate-800", line: "#1e293b" },
];

export default function ResumeEditorPage() {
  const { user } = useAuth();

  // Core Resume State
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Canva Styling Controls
  const [fontFamily, setFontFamily] = useState<"times" | "sans" | "georgia">("times");
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);
  const [layoutMode, setLayoutMode] = useState<"single" | "two-column">("single");
  const [spacingMode, setSpacingMode] = useState<"compact" | "normal" | "relaxed">("normal");
  const [zoomScale, setZoomScale] = useState(100);

  // Section Ordering (Canva Freedom: move any section up/down, delete, add custom)
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([
    "summary",
    "education",
    "experience",
    "projects",
    "skills",
    "custom"
  ]);

  // Original Uploaded Resume Comparison (Split View)
  const [showSplitView, setShowSplitView] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [uploadedRawText, setUploadedRawText] = useState<string>("");

  // Drawers
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showJdDrawer, setShowJdDrawer] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

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

  // Active Bullet Target for Contextual AI Rewrites
  const [activeBulletTarget, setActiveBulletTarget] = useState<{
    section: "experience" | "projects" | "custom";
    entryIdx: number;
    bulletIdx: number;
    text: string;
  } | null>(null);

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
        const cachedPdfUrl = sessionStorage.getItem("uploadedPdfDataUrl");
        
        const cachedJd = sessionStorage.getItem("jobDescription") || "";
        const cachedJobTitle = sessionStorage.getItem("jobTitle") || "";
        const cachedCompany = sessionStorage.getItem("company") || "";
        const cachedLocation = sessionStorage.getItem("location") || "";

        setJobDescription(cachedJd);
        setJobTitle(cachedJobTitle);
        setCompany(cachedCompany);
        setLocation(cachedLocation);

        if (cachedPdfUrl) {
          setUploadedPdfUrl(cachedPdfUrl);
        }
        if (cachedText) {
          setUploadedRawText(cachedText);
        }

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

  // Section Reordering Helpers
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setSectionOrder(newOrder);
  };

  const removeSection = (sec: SectionKey) => {
    setSectionOrder(prev => prev.filter(s => s !== sec));
  };

  // Add Custom Section
  const handleAddCustomSection = () => {
    const title = prompt("Enter section title (e.g. Certifications, Leadership, Awards):", "Additional Accomplishments");
    if (!title) return;
    setResumeData(prev => ({
      ...prev,
      customSections: [
        ...(prev.customSections || []),
        {
          title,
          content: "",
          bullets: ["Spearheaded impactful initiative resulting in measurable growth."]
        }
      ]
    }));
    if (!sectionOrder.includes("custom")) {
      setSectionOrder(prev => [...prev, "custom"]);
    }
  };

  // 100% WYSIWYG Browser Vector Print (Zero React-PDF overlap bugs, 100% pixel-perfect)
  const handlePrintPdf = () => {
    window.print();
  };

  // Direct Vector PDF Download via React-PDF
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
      // Fallback to native print if React-PDF fails
      window.print();
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Direct File Replacement / Upload inside Editor
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cache Data URL for PDF viewer
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

      const parseRes = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!parseRes.ok) throw new Error("Failed to parse file");
      const { text } = await parseRes.json();
      setUploadedRawText(text);
      sessionStorage.setItem("resumeText", text);

      // Structure with AI
      const structRes = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      if (structRes.ok) {
        const structured = await structRes.json();
        setResumeData(structured);
        sessionStorage.setItem("resumeStructuredData", JSON.stringify(structured));
      }
    } catch (err) {
      console.error("Failed to import resume:", err);
      alert("Failed to parse file. Please try again.");
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Apply a scanned AI Full Bullet Suggestion
  const handleApplySuggestion = (sug: Suggestion, index: number) => {
    const original = sug.original.trim().toLowerCase();
    const improved = sug.improved.trim();

    let replaced = false;

    const newExp = (resumeData.experience || []).map((exp) => {
      const newBullets = (exp.bullets || []).map((b) => {
        if (b.toLowerCase().includes(original) || original.includes(b.toLowerCase().slice(0, 30))) {
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
    setTimeout(() => setFlashHighlight(null), 3500);

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

  // Direct AI Bullet Trigger from Canvas Hover Wand
  const handleTriggerAiForBullet = async (
    text: string,
    section: "experience" | "projects" | "custom",
    entryIdx: number,
    bulletIdx: number
  ) => {
    setActiveBulletTarget({ section, entryIdx, bulletIdx, text });
    setCustomDraft(text);
    setShowAiDrawer(true);
    setShowJdDrawer(false);
    setIsRewritingCustom(true);
    setCustomRewrites([]);

    const entryRole = section === "experience" 
      ? resumeData.experience?.[entryIdx]?.role 
      : section === "projects"
      ? resumeData.projects?.[entryIdx]?.name
      : resumeData.customSections?.[entryIdx]?.title;

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: text,
          role: jobTitle || entryRole || "Software Engineer",
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

  // Generate a full bullet for a missing keyword
  const handleGenerateBulletForKeyword = async (keyword: string) => {
    const promptText = `Demonstrate high impact and technical proficiency using ${keyword} in production`;
    setCustomDraft(promptText);
    setActiveBulletTarget(null);
    setShowAiDrawer(true);
    setShowJdDrawer(false);
    setIsRewritingCustom(true);
    setCustomRewrites([]);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: promptText,
          role: jobTitle || "Software Engineer",
          tone: "Metrics and Data Focused",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.options) {
          setCustomRewrites(data.options);
        }
      }
    } catch (err) {
      console.error("AI keyword bullet error", err);
    } finally {
      setIsRewritingCustom(false);
    }
  };

  // Custom AI Rewriter form submission
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

  // Replace active bullet with AI option
  const handleReplaceTargetBullet = (newBulletText: string) => {
    if (!activeBulletTarget) {
      const newExp = [...(resumeData.experience || [])];
      if (newExp.length > 0) {
        newExp[0].bullets = [newBulletText, ...(newExp[0].bullets || [])];
        setResumeData(prev => ({ ...prev, experience: newExp }));
      }
      setFlashHighlight(newBulletText);
      setTimeout(() => setFlashHighlight(null), 3000);
      return;
    }

    const { section, entryIdx, bulletIdx } = activeBulletTarget;
    if (section === "experience") {
      const newExp = [...(resumeData.experience || [])];
      if (newExp[entryIdx]?.bullets) {
        newExp[entryIdx].bullets![bulletIdx] = newBulletText;
        setResumeData(prev => ({ ...prev, experience: newExp }));
      }
    } else if (section === "projects") {
      const newProj = [...(resumeData.projects || [])];
      if (newProj[entryIdx]?.bullets) {
        newProj[entryIdx].bullets![bulletIdx] = newBulletText;
        setResumeData(prev => ({ ...prev, projects: newProj }));
      }
    } else {
      const newCustom = [...(resumeData.customSections || [])];
      if (newCustom[entryIdx]?.bullets) {
        newCustom[entryIdx].bullets![bulletIdx] = newBulletText;
        setResumeData(prev => ({ ...prev, customSections: newCustom }));
      }
    }

    setFlashHighlight(newBulletText);
    setTimeout(() => setFlashHighlight(null), 3500);
    handleSaveDraft();
  };

  // Insert active bullet as new item below target
  const handleInsertBelowTargetBullet = (newBulletText: string) => {
    if (!activeBulletTarget) {
      const newExp = [...(resumeData.experience || [])];
      if (newExp.length > 0) {
        newExp[0].bullets = [...(newExp[0].bullets || []), newBulletText];
        setResumeData(prev => ({ ...prev, experience: newExp }));
      }
    } else {
      const { section, entryIdx, bulletIdx } = activeBulletTarget;
      if (section === "experience") {
        const newExp = [...(resumeData.experience || [])];
        if (newExp[entryIdx]?.bullets) {
          newExp[entryIdx].bullets!.splice(bulletIdx + 1, 0, newBulletText);
          setResumeData(prev => ({ ...prev, experience: newExp }));
        }
      } else if (section === "projects") {
        const newProj = [...(resumeData.projects || [])];
        if (newProj[entryIdx]?.bullets) {
          newProj[entryIdx].bullets!.splice(bulletIdx + 1, 0, newBulletText);
          setResumeData(prev => ({ ...prev, projects: newProj }));
        }
      } else {
        const newCustom = [...(resumeData.customSections || [])];
        if (newCustom[entryIdx]?.bullets) {
          newCustom[entryIdx].bullets!.splice(bulletIdx + 1, 0, newBulletText);
          setResumeData(prev => ({ ...prev, customSections: newCustom }));
        }
      }
    }

    setFlashHighlight(newBulletText);
    setTimeout(() => setFlashHighlight(null), 3500);
    handleSaveDraft();
  };

  // Selected Font Family CSS
  const getFontFamilyStyle = () => {
    if (fontFamily === "sans") return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    if (fontFamily === "georgia") return "Georgia, Cambria, 'Times New Roman', serif";
    return "'Times New Roman', Times, Baskerville, serif";
  };

  // Selected Spacing Class
  const getSectionMarginClass = () => {
    if (spacingMode === "compact") return "mb-2.5";
    if (spacingMode === "relaxed") return "mb-5";
    return "mb-3.5";
  };

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Opening Canva Document Studio...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col -m-4 md:-m-6 bg-neutral-100 dark:bg-neutral-950 font-sans print:m-0 print:p-0 print:bg-white">
      
      {/* ── Top Canva Workspace Header ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 px-4 md:px-6 py-2 bg-background/95 backdrop-blur-md border-b border-border shadow-xs print:hidden">
        
        {/* Left: Breadcrumbs & Split View Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/dashboard/analysis" className="hover:text-foreground transition-colors">
              Analysis
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-bold text-foreground">Canva Studio</span>
          </div>

          {/* Split View Toggle: Original Resume vs Editor */}
          <button
            onClick={() => setShowSplitView(!showSplitView)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showSplitView
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            }`}
            title="Compare live editor side-by-side with your original uploaded resume"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split View (Original)</span>
          </button>
        </div>

        {/* Center: Canva Visual Styling Controls */}
        <div className="flex items-center gap-2">
          
          {/* Font Selector */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="times">Times Roman (LaTeX/Classic)</option>
              <option value="sans">Modern Sans (Canva Clean)</option>
              <option value="georgia">Georgia (Executive Elegant)</option>
            </select>
          </div>

          {/* Theme Color Selector */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setColorTheme(theme)}
                style={{ backgroundColor: theme.line }}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                  colorTheme.id === theme.id ? "scale-125 ring-2 ring-primary ring-offset-1" : "opacity-75 hover:opacity-100"
                }`}
                title={theme.name}
              />
            ))}
          </div>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-card border border-border text-xs">
            <button
              onClick={() => setZoomScale(Math.max(70, zoomScale - 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] font-bold text-foreground px-1">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale(Math.min(130, zoomScale + 10))}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          {/* Import / Replace Resume Button */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Import Resume</span>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleDirectFileUpload}
              className="hidden"
            />
          </label>

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
            <span className="hidden sm:inline">Target JD</span>
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
            <span>AI Bullets</span>
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

          {/* 100% WYSIWYG Vector PDF Export (Print to PDF - 0% Overlap) */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
            title="Download pixel-perfect PDF directly from browser (100% WYSIWYG)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body (With optional Split View) ── */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* ── Optional Left Pane: Original Uploaded Resume Preview ── */}
        {showSplitView && (
          <div className="w-1/2 border-r border-border bg-neutral-200 dark:bg-neutral-900 p-4 flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>Original Uploaded Resume</span>
              </div>
              <button
                onClick={() => setShowSplitView(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close Split View
              </button>
            </div>

            <div className="flex-1 bg-white dark:bg-neutral-950 rounded-xl border border-border overflow-auto shadow-inner p-4">
              {uploadedPdfUrl ? (
                <iframe
                  src={uploadedPdfUrl}
                  title="Original PDF"
                  className="w-full h-full min-h-[700px] rounded-lg border-0"
                />
              ) : uploadedRawText ? (
                <pre className="text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-mono leading-relaxed">
                  {uploadedRawText}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground text-xs space-y-2">
                  <UploadCloud className="w-8 h-8 text-muted-foreground/60" />
                  <p className="font-semibold">No original document preview found in session cache.</p>
                  <p className="text-[11px]">Click &ldquo;Import Resume&rdquo; above to drop your PDF and view it side-by-side.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main Canvas Scrollable Wrapper ── */}
        <div className={`flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8 flex justify-start xl:justify-center ${
          showSplitView ? "w-1/2" : "w-full"
        }`}>
          
          <div 
            style={{ 
              transform: `scale(${zoomScale / 100})`, 
              transformOrigin: "top center",
              fontFamily: getFontFamilyStyle()
            }}
            className="transition-transform duration-200 shrink-0"
          >
            {/* ── CANVA EDITABLE RESUME SHEET (US Letter Standard: 816px x 1056px) ── */}
            <div 
              id="resume-canvas-sheet"
              className="w-[816px] min-h-[1056px] bg-white text-neutral-900 shadow-2xl p-[36px] md:p-[42px] leading-[1.3] text-[9.5pt] select-text relative border border-neutral-200 print:border-none print:shadow-none print:m-0 print:p-8"
            >
              
              {/* ── 1. HEADER (Canva Editable Name & Contact Bar) ── */}
              <div className="text-center mb-4 pb-2 border-b border-neutral-100">
                <input
                  type="text"
                  value={resumeData.personalInfo?.name || ""}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  placeholder="FIRST LAST"
                  className="w-full text-center text-[22pt] font-bold tracking-normal text-neutral-900 uppercase hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-2 transition-colors leading-tight mb-2"
                />

                {/* Single-line Dynamic Contact Bar */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[8.5pt] text-neutral-800 font-normal">
                  <AutoWidthInput
                    value={resumeData.personalInfo?.phone || ""}
                    onChange={(val) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: val }
                    }))}
                    placeholder="(123) 456-7890"
                  />
                  <span className="text-neutral-400 select-none">|</span>
                  <AutoWidthInput
                    value={resumeData.personalInfo?.email || ""}
                    onChange={(val) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, email: val }
                    }))}
                    placeholder="email@example.com"
                    isLink
                  />
                  <span className="text-neutral-400 select-none">|</span>
                  <AutoWidthInput
                    value={resumeData.personalInfo?.location || ""}
                    onChange={(val) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, location: val }
                    }))}
                    placeholder="City, State"
                  />
                  <span className="text-neutral-400 select-none">|</span>
                  <AutoWidthInput
                    value={resumeData.personalInfo?.linkedin || ""}
                    onChange={(val) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, linkedin: val }
                    }))}
                    placeholder="linkedin.com/in/handle"
                    isLink
                  />
                  <span className="text-neutral-400 select-none">|</span>
                  <AutoWidthInput
                    value={resumeData.personalInfo?.github || ""}
                    onChange={(val) => setResumeData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, github: val }
                    }))}
                    placeholder="github.com/handle"
                    isLink
                  />
                </div>
              </div>

              {/* ── DYNAMIC SECTIONS IN USER-CONFIGURABLE ORDER ── */}
              {sectionOrder.map((sectionKey, sIdx) => {
                
                // ── SUMMARY SECTION ──
                if (sectionKey === "summary") {
                  if (resumeData.summary === undefined && !sectionOrder.includes("summary")) return null;
                  return (
                    <div key="summary" className={`${getSectionMarginClass()} group/sec relative`}>
                      <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                        <h2 className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text}`}>
                          Professional Summary
                        </h2>
                        
                        {/* Section Move / Delete Actions */}
                        <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => moveSection(sIdx, "up")}
                            disabled={sIdx === 0}
                            className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            title="Move section up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveSection(sIdx, "down")}
                            disabled={sIdx === sectionOrder.length - 1}
                            className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            title="Move section down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeSection("summary")}
                            className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            title="Remove section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <AutoResizeTextarea
                        value={resumeData.summary || ""}
                        onChange={(val) => setResumeData(prev => ({ ...prev, summary: val }))}
                        placeholder="Write a compelling executive summary or core profile..."
                        className="w-full bg-transparent hover:bg-neutral-50/80 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.3] text-[9pt]"
                      />
                    </div>
                  );
                }

                // ── EDUCATION SECTION ──
                if (sectionKey === "education") {
                  return (
                    <div key="education" className={`${getSectionMarginClass()} group/sec relative`}>
                      <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                        <h2 className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text}`}>
                          Education
                        </h2>
                        
                        {/* Section Actions */}
                        <div className="flex items-center gap-2">
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
                            className="text-[9px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100 print:hidden"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add School</span>
                          </button>

                          <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 print:hidden">
                            <button
                              onClick={() => moveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveSection(sIdx, "down")}
                              disabled={sIdx === sectionOrder.length - 1}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeSection("education")}
                              className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(resumeData.education || []).map((edu, eduIdx) => (
                          <div key={eduIdx} className="group/edu relative">
                            {/* Row 1: School (Bold) \hfill Location (Bold) */}
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
                                className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
                              />
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <input
                                  type="text"
                                  value={edu.location || ""}
                                  onChange={(e) => {
                                    const newEdu = [...(resumeData.education || [])];
                                    newEdu[eduIdx].location = e.target.value;
                                    setResumeData(prev => ({ ...prev, education: newEdu }));
                                  }}
                                  placeholder="City, State"
                                  className="font-bold text-[9pt] text-right text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-28 shrink-0"
                                />
                                <button
                                  onClick={() => {
                                    const newEdu = (resumeData.education || []).filter((_, i) => i !== eduIdx);
                                    setResumeData(prev => ({ ...prev, education: newEdu }));
                                  }}
                                  className="opacity-0 group-hover/edu:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5 print:hidden"
                                  title="Delete school"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Degree & GPA (Italic) \hfill Dates (Italic) */}
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
                                className="italic text-[9pt] text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
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
                                className="italic text-[9pt] text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32 shrink-0 ml-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ── EXPERIENCE SECTION ──
                if (sectionKey === "experience") {
                  return (
                    <div key="experience" className={`${getSectionMarginClass()} group/sec relative`}>
                      <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                        <h2 className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text}`}>
                          Experience
                        </h2>
                        
                        <div className="flex items-center gap-2">
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
                                      "Spearheaded distributed cloud infrastructure optimization, improving throughput by 35%."
                                    ]
                                  }
                                ]
                              }));
                            }}
                            className="text-[9px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100 print:hidden"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Role</span>
                          </button>

                          <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 print:hidden">
                            <button
                              onClick={() => moveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveSection(sIdx, "down")}
                              disabled={sIdx === sectionOrder.length - 1}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeSection("experience")}
                              className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {(resumeData.experience || []).map((exp, expIdx) => (
                          <div key={expIdx} className="group/exp relative">
                            {/* Row 1: Company (Bold) \hfill Location (Bold) */}
                            <div className="flex justify-between items-baseline font-bold text-[9.5pt]">
                              <input
                                type="text"
                                value={exp.company || ""}
                                onChange={(e) => {
                                  const newExp = [...(resumeData.experience || [])];
                                  newExp[expIdx].company = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: newExp }));
                                }}
                                placeholder="Company Name"
                                className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
                              />
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <input
                                  type="text"
                                  value={exp.location || ""}
                                  onChange={(e) => {
                                    const newExp = [...(resumeData.experience || [])];
                                    newExp[expIdx].location = e.target.value;
                                    setResumeData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  placeholder="City, State"
                                  className="font-bold text-[9pt] text-right text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32 shrink-0"
                                />
                                <button
                                  onClick={() => {
                                    const newExp = (resumeData.experience || []).filter((_, i) => i !== expIdx);
                                    setResumeData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  className="opacity-0 group-hover/exp:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5 print:hidden"
                                  title="Delete position"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Role (Italic) \hfill Dates (Italic) */}
                            <div className="flex justify-between items-baseline text-[9pt] text-neutral-800 italic mb-0.5">
                              <input
                                type="text"
                                value={exp.role || ""}
                                onChange={(e) => {
                                  const newExp = [...(resumeData.experience || [])];
                                  newExp[expIdx].role = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: newExp }));
                                }}
                                placeholder="Role / Title"
                                className="italic text-[9pt] text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
                              />
                              <input
                                type="text"
                                value={exp.date || ""}
                                onChange={(e) => {
                                  const newExp = [...(resumeData.experience || [])];
                                  newExp[expIdx].date = e.target.value;
                                  setResumeData(prev => ({ ...prev, experience: newExp }));
                                }}
                                placeholder="Dates"
                                className="italic text-[9pt] text-right text-neutral-700 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-32 shrink-0 ml-2"
                              />
                            </div>

                            {/* Bullets with Hover AI Polish Wand */}
                            <ul className="list-none space-y-1 mt-1 pl-3">
                              {(exp.bullets || []).map((bullet, bulletIdx) => {
                                const isHighlighted = flashHighlight === bullet;
                                return (
                                  <li 
                                    key={bulletIdx}
                                    className={`flex items-start gap-1.5 group/bullet text-[9pt] leading-[1.28] text-neutral-800 transition-colors ${
                                      isHighlighted ? "bg-emerald-100 ring-2 ring-emerald-400 rounded" : ""
                                    }`}
                                  >
                                    <span className="select-none font-bold text-neutral-900 mt-0.5 shrink-0">•</span>
                                    <AutoResizeTextarea
                                      value={bullet}
                                      onChange={(val) => {
                                        const newExp = [...(resumeData.experience || [])];
                                        newExp[expIdx].bullets![bulletIdx] = val;
                                        setResumeData(prev => ({ ...prev, experience: newExp }));
                                      }}
                                      placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
                                      className="w-full bg-transparent hover:bg-neutral-50/80 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.28] min-w-0"
                                    />

                                    {/* Action Wand & Delete */}
                                    <div className="opacity-0 group-hover/bullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1 print:hidden">
                                      <button
                                        onClick={() => handleTriggerAiForBullet(bullet, "experience", expIdx, bulletIdx)}
                                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer flex items-center gap-1 text-[10px] font-semibold bg-emerald-50/50 border border-emerald-500/20 shadow-2xs"
                                        title="AI Polish full bullet with metrics"
                                      >
                                        <Wand2 className="w-3 h-3" />
                                        <span className="hidden sm:inline">AI Polish</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const newExp = [...(resumeData.experience || [])];
                                          newExp[expIdx].bullets = newExp[expIdx].bullets!.filter((_, i) => i !== bulletIdx);
                                          setResumeData(prev => ({ ...prev, experience: newExp }));
                                        }}
                                        className="p-1 rounded text-neutral-400 hover:text-rose-500 cursor-pointer"
                                        title="Delete bullet"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}

                              <li className="pt-0.5 print:hidden">
                                <button
                                  onClick={() => {
                                    const newExp = [...(resumeData.experience || [])];
                                    newExp[expIdx].bullets = [...(newExp[expIdx].bullets || []), "Spearheaded key engineering initiatives that accelerated delivery by 30%."];
                                    setResumeData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  className="text-[8.5pt] font-semibold text-neutral-400 hover:text-neutral-800 flex items-center gap-1 cursor-pointer pl-3"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>Add bullet</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ── PROJECTS SECTION ──
                if (sectionKey === "projects") {
                  return (
                    <div key="projects" className={`${getSectionMarginClass()} group/sec relative`}>
                      <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                        <h2 className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text}`}>
                          Projects
                        </h2>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setResumeData(prev => ({
                                ...prev,
                                projects: [
                                  ...(prev.projects || []),
                                  {
                                    name: "Project Name",
                                    description: "Go, Kafka, Redis, Docker",
                                    date: "2023",
                                    bullets: ["Engineered distributed pipeline capable of handling 50k events/sec."]
                                  }
                                ]
                              }));
                            }}
                            className="text-[9px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100 print:hidden"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Project</span>
                          </button>

                          <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 print:hidden">
                            <button
                              onClick={() => moveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveSection(sIdx, "down")}
                              disabled={sIdx === sectionOrder.length - 1}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeSection("projects")}
                              className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {(resumeData.projects || []).map((proj, pIdx) => (
                          <div key={pIdx} className="group/proj relative">
                            {/* Line 1: Project Name \hfill Date */}
                            <div className="flex justify-between items-baseline font-bold text-[9.5pt]">
                              <input
                                type="text"
                                value={proj.name || ""}
                                onChange={(e) => {
                                  const newProj = [...(resumeData.projects || [])];
                                  newProj[pIdx].name = e.target.value;
                                  setResumeData(prev => ({ ...prev, projects: newProj }));
                                }}
                                placeholder="Project Name"
                                className="font-bold text-[9.5pt] text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
                              />
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <input
                                  type="text"
                                  value={proj.date || ""}
                                  onChange={(e) => {
                                    const newProj = [...(resumeData.projects || [])];
                                    newProj[pIdx].date = e.target.value;
                                    setResumeData(prev => ({ ...prev, projects: newProj }));
                                  }}
                                  placeholder="Date"
                                  className="font-bold text-[9pt] text-right text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 w-24 shrink-0"
                                />
                                <button
                                  onClick={() => {
                                    const newProj = (resumeData.projects || []).filter((_, i) => i !== pIdx);
                                    setResumeData(prev => ({ ...prev, projects: newProj }));
                                  }}
                                  className="opacity-0 group-hover/proj:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5 print:hidden"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Line 2: Technologies / Subtitle */}
                            <div className="flex justify-between items-baseline text-[9pt] text-neutral-800 italic mb-0.5">
                              <input
                                type="text"
                                value={proj.description || ""}
                                onChange={(e) => {
                                  const newProj = [...(resumeData.projects || [])];
                                  newProj[pIdx].description = e.target.value;
                                  setResumeData(prev => ({ ...prev, projects: newProj }));
                                }}
                                placeholder="Technologies (e.g. Next.js, TypeScript, PostgreSQL)"
                                className="italic text-[9pt] text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 min-w-0 flex-1"
                              />
                            </div>

                            {/* Bullets */}
                            <ul className="list-none space-y-1 mt-0.5 pl-3">
                              {(proj.bullets || []).map((b, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-1.5 group/pbullet text-[9pt] leading-[1.28] text-neutral-800">
                                  <span className="select-none font-bold text-neutral-900 mt-0.5 shrink-0">•</span>
                                  <AutoResizeTextarea
                                    value={b}
                                    onChange={(val) => {
                                      const newProj = [...(resumeData.projects || [])];
                                      newProj[pIdx].bullets![bIdx] = val;
                                      setResumeData(prev => ({ ...prev, projects: newProj }));
                                    }}
                                    placeholder="Accomplished [X] using [Y] resulting in [Z]..."
                                    className="w-full bg-transparent hover:bg-neutral-50/80 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.28] min-w-0"
                                  />

                                  <div className="opacity-0 group-hover/pbullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1 print:hidden">
                                    <button
                                      onClick={() => handleTriggerAiForBullet(b, "projects", pIdx, bIdx)}
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer flex items-center gap-1 text-[10px] font-semibold bg-emerald-50/50 border border-emerald-500/20"
                                      title="AI Polish full bullet"
                                    >
                                      <Wand2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newProj = [...(resumeData.projects || [])];
                                        newProj[pIdx].bullets = newProj[pIdx].bullets!.filter((_, i) => i !== bIdx);
                                        setResumeData(prev => ({ ...prev, projects: newProj }));
                                      }}
                                      className="p-1 rounded text-neutral-400 hover:text-rose-500 cursor-pointer"
                                      title="Delete bullet"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </li>
                              ))}

                              <li className="pt-0.5 print:hidden">
                                <button
                                  onClick={() => {
                                    const newProj = [...(resumeData.projects || [])];
                                    newProj[pIdx].bullets = [...(newProj[pIdx].bullets || []), "Engineered optimized feature delivering measurable user engagement."];
                                    setResumeData(prev => ({ ...prev, projects: newProj }));
                                  }}
                                  className="text-[8.5pt] font-semibold text-neutral-400 hover:text-neutral-800 flex items-center gap-1 cursor-pointer pl-3"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>Add bullet</span>
                                </button>
                              </li>
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ── TECHNICAL SKILLS SECTION ──
                if (sectionKey === "skills") {
                  return (
                    <div key="skills" className={`${getSectionMarginClass()} group/sec relative`}>
                      <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                        <h2 className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text}`}>
                          Technical Skills
                        </h2>
                        
                        <div className="flex items-center gap-2">
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
                            className="text-[9px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100 print:hidden"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Category</span>
                          </button>

                          <div className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 print:hidden">
                            <button
                              onClick={() => moveSection(sIdx, "up")}
                              disabled={sIdx === 0}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveSection(sIdx, "down")}
                              disabled={sIdx === sectionOrder.length - 1}
                              className="p-0.5 text-neutral-400 hover:text-neutral-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeSection("skills")}
                              className="p-0.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-[9pt] leading-[1.3]">
                        {(resumeData.skills || []).map((cat, catIdx) => (
                          <div key={catIdx} className="flex items-baseline gap-1 group/skill relative">
                            <input
                              type="text"
                              value={cat.category ? `${cat.category}:` : ""}
                              onChange={(e) => {
                                const newSkills = [...(resumeData.skills || [])];
                                newSkills[catIdx].category = e.target.value.replace(/:$/, "");
                                setResumeData(prev => ({ ...prev, skills: newSkills }));
                              }}
                              placeholder="Category:"
                              style={{ width: `${Math.max((cat.category || "Category").length * 8 + 14, 110)}px` }}
                              className="font-bold text-neutral-900 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 -ml-1 shrink-0"
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
                              className="text-neutral-800 hover:bg-neutral-50 focus:bg-blue-50/50 focus:outline-none rounded px-1 min-w-0 flex-1 font-normal"
                            />
                            <button
                              onClick={() => {
                                const newSkills = (resumeData.skills || []).filter((_, i) => i !== catIdx);
                                setResumeData(prev => ({ ...prev, skills: newSkills }));
                              }}
                              className="opacity-0 group-hover/skill:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5 shrink-0 print:hidden"
                              title="Delete category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ── CUSTOM / FREEFORM SECTIONS (Canva Style) ──
                if (sectionKey === "custom" && resumeData.customSections && resumeData.customSections.length > 0) {
                  return (
                    <div key="custom">
                      {resumeData.customSections.map((sec, secIdx) => (
                        <div key={secIdx} className={`${getSectionMarginClass()} group/custom relative`}>
                          <div className={`flex items-center justify-between pb-0.5 mb-1.5 border-b-[0.75pt] ${colorTheme.border}`}>
                            <input
                              type="text"
                              value={sec.title || "Custom Section"}
                              onChange={(e) => {
                                const newCustom = [...(resumeData.customSections || [])];
                                newCustom[secIdx].title = e.target.value;
                                setResumeData(prev => ({ ...prev, customSections: newCustom }));
                              }}
                              className={`text-[10pt] font-bold uppercase tracking-wider ${colorTheme.text} bg-transparent hover:bg-neutral-50 focus:outline-none rounded px-1 -ml-1`}
                            />

                            <div className="flex items-center gap-1 print:hidden">
                              <button
                                onClick={() => {
                                  const newCustom = [...(resumeData.customSections || [])];
                                  newCustom[secIdx].bullets = [...(newCustom[secIdx].bullets || []), "Accomplished key objective with measurable impact."];
                                  setResumeData(prev => ({ ...prev, customSections: newCustom }));
                                }}
                                className="text-[9px] font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Add Item</span>
                              </button>
                              <button
                                onClick={() => {
                                  const newCustom = (resumeData.customSections || []).filter((_, i) => i !== secIdx);
                                  setResumeData(prev => ({ ...prev, customSections: newCustom }));
                                }}
                                className="opacity-0 group-hover/custom:opacity-100 text-neutral-400 hover:text-rose-500 cursor-pointer p-0.5"
                                title="Delete section"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <ul className="list-none space-y-1 pl-3">
                            {(sec.bullets || []).map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-1.5 group/cbullet text-[9pt] leading-[1.28] text-neutral-800">
                                <span className="select-none font-bold text-neutral-900 mt-0.5 shrink-0">•</span>
                                <AutoResizeTextarea
                                  value={b}
                                  onChange={(val) => {
                                    const newCustom = [...(resumeData.customSections || [])];
                                    newCustom[secIdx].bullets![bIdx] = val;
                                    setResumeData(prev => ({ ...prev, customSections: newCustom }));
                                  }}
                                  placeholder="Accomplished [X] with measurable result..."
                                  className="w-full bg-transparent hover:bg-neutral-50/80 focus:bg-blue-50/50 focus:outline-none rounded px-1 resize-none overflow-hidden text-neutral-800 leading-[1.28] min-w-0"
                                />

                                <div className="opacity-0 group-hover/cbullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1 print:hidden">
                                  <button
                                    onClick={() => handleTriggerAiForBullet(b, "custom", secIdx, bIdx)}
                                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                    title="AI Polish bullet"
                                  >
                                    <Wand2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newCustom = [...(resumeData.customSections || [])];
                                      newCustom[secIdx].bullets = newCustom[secIdx].bullets!.filter((_, i) => i !== bIdx);
                                      setResumeData(prev => ({ ...prev, customSections: newCustom }));
                                    }}
                                    className="p-1 rounded text-neutral-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                }

                return null;
              })}

              {/* ── Canva Freedom: Add Custom Section Button ── */}
              <div className="pt-3 border-t border-dashed border-neutral-300 print:hidden flex justify-center">
                <button
                  onClick={handleAddCustomSection}
                  className="px-4 py-1.5 rounded-lg border border-dashed border-neutral-400 hover:border-neutral-800 text-neutral-600 hover:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Section (Canva Style)</span>
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* ── Right Drawer: AI Bullet Studio (Generates FULL complete bullet points) ── */}
        {showAiDrawer && (
          <aside className="w-80 md:w-[420px] border-l border-border bg-card/95 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 shadow-2xl z-40 overflow-y-auto print:hidden">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">AI Bullet Studio</h3>
                    <p className="text-[11px] text-muted-foreground">Full-sentence Google XYZ generator</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Selection Indicator */}
              {activeBulletTarget && (
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 mb-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Targeting Bullet #{activeBulletTarget.bulletIdx + 1}</span>
                    </span>
                    <button
                      onClick={() => setActiveBulletTarget(null)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Clear target
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                    &ldquo;{activeBulletTarget.text}&rdquo;
                  </p>
                </div>
              )}

              {/* Full Bullet Generator Form */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Full Bullet Point Generator</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">Google XYZ Standard</span>
                </div>

                <form onSubmit={handleRunCustomRewrite} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    placeholder="Enter what you accomplished, tools used, or rough bullet..."
                    className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground resize-none leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <div className="flex gap-2">
                    <select
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-background border border-border text-xs text-foreground font-medium"
                    >
                      <option value="Metrics and Data Focused">Metrics & Data Focused</option>
                      <option value="Professional and Impact-Driven">Professional & Impact</option>
                      <option value="Leadership and Initiative">Leadership & Initiative</option>
                      <option value="Technical Depth and Scale">Technical Depth & Scale</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isRewritingCustom || !customDraft.trim()}
                    className="w-full py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isRewritingCustom ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Full Bullets...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Generate 3 Complete Bullet Variations</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Generated Full Bullet Variations */}
                {customRewrites.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    <span className="text-[11px] font-bold text-foreground block">
                      Generated Full Bullet Options:
                    </span>
                    {customRewrites.map((opt, i) => (
                      <div key={i} className="p-3 rounded-lg bg-background border border-border text-xs space-y-2 hover:border-primary/40 transition-colors shadow-2xs">
                        <p className="text-foreground font-medium leading-relaxed">• {opt.text}</p>
                        <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1">
                          ⚡ {opt.reasoning}
                        </p>
                        
                        <div className="flex gap-1.5 pt-1">
                          {activeBulletTarget ? (
                            <button
                              onClick={() => handleReplaceTargetBullet(opt.text)}
                              className="flex-1 py-1 px-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Replace Target Bullet</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReplaceTargetBullet(opt.text)}
                              className="flex-1 py-1 px-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Insert into Experience</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleInsertBelowTargetBullet(opt.text)}
                            className="py-1 px-2.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Insert as an additional bullet"
                          >
                            + As New
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scanned Full Bullet Suggestions from Analysis */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Scanned Complete Bullet Upgrades</span>
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
                          className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                            isApplied 
                              ? "bg-emerald-500/5 border-emerald-500/30 opacity-70" 
                              : "bg-background border-border shadow-xs hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              Full Bullet Upgrade
                            </span>
                            <span className={`text-[10px] font-bold ${
                              sug.impact === "High" ? "text-blue-500" : "text-amber-500"
                            }`}>
                              {sug.impact} Impact
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="p-2 rounded bg-muted/30 border border-border/40">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">Existing:</span>
                              <p className="text-[11px] text-muted-foreground line-through leading-relaxed">
                                • {sug.original}
                              </p>
                            </div>
                            <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-0.5">Recommended Full Rewrite:</span>
                              <p className="text-xs font-medium text-foreground leading-relaxed">
                                • {sug.improved}
                              </p>
                            </div>
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
                                <span>Replace with Full Rewrite</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

        {/* ── Right Drawer: Target Job Description & Match Radar ── */}
        {showJdDrawer && (
          <aside className="w-80 md:w-[400px] border-l border-border bg-card/95 backdrop-blur-xl p-5 flex flex-col justify-between shrink-0 shadow-2xl z-40 overflow-y-auto print:hidden">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Target JD Match Radar</h3>
                    <p className="text-[11px] text-muted-foreground">Keyword alignment & bullet generator</p>
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

              {/* Missing Keywords Checklist + 1-Click Full Bullet Generator */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Missing Target Keywords</span>
                  <span className="text-muted-foreground font-mono">
                    {missingKeywords.length} Remaining
                  </span>
                </div>

                {missingKeywords.length > 0 ? (
                  <div className="space-y-2">
                    {missingKeywords.map((kw, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border text-xs"
                      >
                        <span className="font-semibold text-foreground">{kw}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleGenerateBulletForKeyword(kw)}
                            className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Generate complete bullet using this keyword"
                          >
                            <Wand2 className="w-2.5 h-2.5" />
                            <span>Full Bullet</span>
                          </button>
                          <button
                            onClick={() => handleAddKeywordToSkills(kw)}
                            className="p-1 rounded text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                            title="Add to Skills section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
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

      {/* ── Print Stylesheet (High-Res 100% WYSIWYG Print to PDF) ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.4in;
          }
          body {
            background: white !important;
            color: black !important;
          }
          header, aside, button, input[type="file"], .print\\:hidden {
            display: none !important;
          }
          #resume-canvas-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            resize: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
}
