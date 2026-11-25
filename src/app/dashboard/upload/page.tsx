"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dropzone } from "@/components/ui/Dropzone";
import {
  Building,
  MapPin,
  Search,
  FileText,
  AlertCircle,
  Loader2,
  FileEdit,
  Link2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  Briefcase,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface RolePreset {
  id: string;
  label: string;
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: "swe-stripe",
    label: "SWE (Stripe-style)",
    jobTitle: "Software Engineer, Payments Infrastructure",
    company: "Stripe",
    location: "San Francisco, CA / Hybrid",
    jobDescription: `About the Role:
We are looking for a Software Engineer to join our Payments Infrastructure team building high-throughput, fault-tolerant APIs and ledger services that move billions of dollars globally.

Responsibilities:
- Design, build, and scale low-latency distributed backend services in Go, Java, Ruby, or TypeScript/Node.js.
- Ensure 99.999% API reliability, idempotency, and strict data consistency across PostgreSQL and Kafka event pipelines.
- Collaborate with product, security, and partner engineering teams to launch new global payment rails.
- Drive observability, automated testing, and performance optimization across core microservices.

Requirements:
- 3+ years of experience building production distributed systems, REST/GraphQL APIs, or cloud-native services.
- Strong foundation in SQL databases, caching (Redis), message queues (Kafka/SQS), and Kubernetes/Docker.
- Experience writing clean, maintainable code with measurable latency, throughput, and reliability improvements.`,
  },
  {
    id: "product-manager",
    label: "Product Manager",
    jobTitle: "Senior Product Manager, Core Growth",
    company: "Figma",
    location: "San Francisco, CA / Remote",
    jobDescription: `About the Role:
Join our Core Growth team to define product strategy, run high-velocity experiments, and scale self-serve activation and enterprise adoption.

Responsibilities:
- Own the end-to-end product roadmap for onboarding, collaboration workflows, and monetization funnels.
- Partner closely with engineering, design, and data science to ship user-centric features and A/B tests.
- Define north-star KPIs, activation metrics, and retention cohorts using SQL, Amplitude, or Mixpanel.
- Conduct customer discovery interviews and translate qualitative insights into crisp PRDs and launch plans.

Requirements:
- 4+ years of product management experience at a B2B SaaS or high-growth consumer technology company.
- Track record of driving measurable revenue, conversion, or retention impact through data-driven iteration.
- Strong technical fluency with APIs, analytics instrumentation, and cross-functional stakeholder alignment.`,
  },
  {
    id: "data-ml",
    label: "Data / ML Engineer",
    jobTitle: "Machine Learning Engineer, Ranking & Recommendations",
    company: "Spotify",
    location: "New York, NY / Hybrid",
    jobDescription: `About the Role:
Build production machine learning pipelines, feature stores, and real-time ranking models serving personalized experiences to hundreds of millions of users.

Responsibilities:
- Train, evaluate, and deploy deep learning and gradient-boosted ranking models in Python, PyTorch, and Spark.
- Architect low-latency model inference microservices and automated feature engineering pipelines on AWS/GCP.
- Partner with research scientists and product teams to design online A/B experiments and measure offline/online lift.
- Optimize GPU training throughput, feature freshness, and data quality monitoring with Airflow and dbt.

Requirements:
- 3+ years of hands-on experience shipping production ML models or large-scale data pipelines.
- Proficiency in Python, SQL, PyTorch/TensorFlow, Apache Spark, Docker, and Kubernetes.
- Demonstrated impact improving model precision/recall, NDCG, or inference latency at scale.`,
  },
  {
    id: "finance-analyst",
    label: "Finance Analyst",
    jobTitle: "Investment Banking & Corporate Finance Analyst",
    company: "Goldman Sachs",
    location: "New York, NY",
    jobDescription: `About the Role:
Support M&A advisory, capital raising, and strategic valuation engagements for technology and healthcare clients.

Responsibilities:
- Build dynamic three-statement financial models, DCF valuations, LBO analyses, and accretion/dilution models in Excel.
- Conduct comparable company and precedent transaction benchmarking using Bloomberg, Capital IQ, and SEC filings.
- Author executive-ready pitch decks, investment memos, and board presentations for C-suite leadership.
- Coordinate due diligence workstreams across legal, accounting, and corporate development teams.

Requirements:
- Bachelor's degree in Finance, Economics, Mathematics, or related quantitative discipline.
- 1-3 years of experience in investment banking, private equity, FP&A, or management consulting.
- Exceptional proficiency in financial modeling, Excel, PowerPoint, SQL/Python analytics, and attention to detail.`,
  },
  {
    id: "ux-frontend",
    label: "UX / Frontend",
    jobTitle: "Staff Frontend & Design Systems Engineer",
    company: "Vercel",
    location: "Remote",
    jobDescription: `About the Role:
Craft fast, accessible, and delightful developer interfaces and reusable React component libraries used by millions of builders worldwide.

Responsibilities:
- Architect accessible UI primitives and design system tokens using React, TypeScript, Next.js, and Tailwind CSS.
- Optimize Core Web Vitals (LCP, INP, CLS), client bundle sizes, and smooth micro-interactions with Framer Motion.
- Partner directly with product designers in Figma to translate visual concepts into WCAG 2.1 AA compliant interfaces.
- Lead frontend code reviews, visual regression testing (Playwright), and keyboard-navigation polish.

Requirements:
- 3+ years building modern React/TypeScript web applications with deep CSS and browser rendering expertise.
- Strong command of semantic HTML, ARIA accessibility patterns, state management, and Next.js App Router.
- Portfolio or shipped products showcasing craft, motion fidelity, and measurable UX performance gains.`,
  },
];

const SAMPLE_RESUME_TEXT = `ALEX RIVERA
San Francisco, CA | alex.rivera@example.com | +1-555-234-5678 | github.com/alexrivera | linkedin.com/in/alexrivera

SUMMARY
Product-minded Senior Software Engineer with 5+ years of experience building high-scale distributed backend APIs, modern Next.js/TypeScript web interfaces, and data-driven ML features.

EXPERIENCE
Apex Cloud Technologies — Lead Full Stack Engineer | San Francisco, CA | June 2022 – Present
- Architected distributed event-streaming payments & telemetry platform using TypeScript, Node.js, Go, and Apache Kafka, processing 1.4M daily requests at 99.99% availability.
- Optimized PostgreSQL compound indexing and Redis caching strategies, slashing p95 API latency by 48% and saving $42,000/year in cloud compute.
- Partnered with Product and Design to ship a self-serve onboarding workflow in Next.js and Tailwind CSS, boosting user activation conversion by 28%.
- Mentored 6 engineers and automated CI/CD release pipelines with Docker, Kubernetes, and Playwright regression checks.

Veloce Digital Systems — Software Engineer | Austin, TX | June 2020 – May 2022
- Built Python/FastAPI data ingestion microservices and financial reconciliation dashboards processing $180M+ in monthly transaction volume.
- Reduced frontend bundle size by 37% and improved Core Web Vitals (LCP under 1.2s) across customer-facing React applications.
- Collaborated with cross-functional analytics teams to launch automated A/B experimentation and SQL cohort reporting.

PROJECTS
PulseStream Telemetry Engine | Go, React, Apache Kafka, Redis, Docker
- Engineered an open-source real-time metrics ingestion engine sustaining 50,000 logs/sec at sub-10ms query latency.

EDUCATION
University of California, Berkeley — B.S. in Computer Science (GPA: 3.85/4.0) | May 2020

SKILLS
Languages: TypeScript, JavaScript, Python, Go, SQL, HTML/CSS
Frameworks & UI: Next.js, React, Node.js, FastAPI, Tailwind CSS, Figma
Infrastructure & Data: PostgreSQL, Redis, Apache Kafka, Docker, Kubernetes, AWS, CI/CD`;

const SAMPLE_RESUME_FILENAME = "Alex_Rivera_Sample_Resume.txt";

function syncUserPreferencesToSession() {
  const storedHome = localStorage.getItem("userHomeLocation");
  if (storedHome) sessionStorage.setItem("userHomeLocation", storedHome);
  const storedTrack = localStorage.getItem("userTargetTrack");
  if (storedTrack) sessionStorage.setItem("userTargetTrack", storedTrack);
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSampleResume, setIsSampleResume] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Job URL auto-fill state
  const [jobUrl, setJobUrl] = useState("");
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [fetchJobError, setFetchJobError] = useState("");
  const [fetchJobSuccess, setFetchJobSuccess] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const hasResume = Boolean(extractedText.trim()) && !isParsing;
  const hasJobDesc = jobDescription.trim().length > 10;
  const effectiveFileName =
    file?.name || (isSampleResume ? SAMPLE_RESUME_FILENAME : "resume.pdf");

  const handleFileSelect = async (selectedFile: File | null) => {
    setIsSampleResume(false);
    setFile(selectedFile);
    setExtractedText("");
    setParseError("");
    setSaveError("");

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

      setExtractedText(data.text);

      // Cache PDF Data URL for Split View in Editor
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf")
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          if (res) {
            try {
              sessionStorage.setItem("uploadedPdfDataUrl", res);
            } catch (err) {
              console.warn("File too large for sessionStorage", err);
            }
          }
        };
        reader.readAsDataURL(selectedFile);
      } else {
        sessionStorage.removeItem("uploadedPdfDataUrl");
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to parse document";
      setParseError(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSampleResume = () => {
    setFile(null);
    setIsSampleResume(true);
    setParseError("");
    setSaveError("");
    setExtractedText(SAMPLE_RESUME_TEXT);
    sessionStorage.removeItem("uploadedPdfDataUrl");
  };

  const handleClearSampleResume = () => {
    setIsSampleResume(false);
    setExtractedText("");
    setParseError("");
    setSaveError("");
  };

  const handleFetchJobUrl = async () => {
    const trimmed = jobUrl.trim();
    if (!trimmed) {
      setFetchJobError("Enter a public job posting URL to auto-fill.");
      return;
    }

    setIsFetchingJob(true);
    setFetchJobError("");
    setFetchJobSuccess("");

    try {
      const res = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not extract job description from that URL.");
      }

      setJobTitle(typeof data.jobTitle === "string" ? data.jobTitle.trim() : "");
      setCompany(typeof data.company === "string" ? data.company.trim() : "");
      setLocation(typeof data.location === "string" ? data.location.trim() : "");
      if (typeof data.jobDescription === "string" && data.jobDescription.trim()) {
        setJobDescription(data.jobDescription.trim());
      }

      setActivePresetId(null);
      setFetchJobSuccess(
        data.sourceHost
          ? `Imported job details from ${data.sourceHost}`
          : "Job details imported successfully"
      );
    } catch (err: unknown) {
      console.error("Failed to fetch job URL:", err);
      setFetchJobError(
        err instanceof Error
          ? err.message
          : "Unable to import that URL. You can paste the job description manually below."
      );
    } finally {
      setIsFetchingJob(false);
    }
  };

  const handleApplyPreset = (preset: RolePreset) => {
    setActivePresetId(preset.id);
    setJobTitle(preset.jobTitle);
    setCompany(preset.company);
    setLocation(preset.location);
    setJobDescription(preset.jobDescription);
    setFetchJobError("");
    setFetchJobSuccess("");
    setSaveError("");
  };

  const handleOpenLatexStudio = () => {
    if (!hasResume || isSaving) return;
    // Reset prior LaTeX source so the newly chosen resume converts fresh to Overleaf .tex
    sessionStorage.removeItem("resumeLatexSource");
    sessionStorage.removeItem("resumeStructuredData");
    sessionStorage.setItem("resumeText", extractedText);
    sessionStorage.setItem("jobDescription", jobDescription);
    sessionStorage.setItem("fileName", effectiveFileName);
    sessionStorage.setItem("jobTitle", jobTitle);
    sessionStorage.setItem("company", company);
    sessionStorage.setItem("location", location);
    syncUserPreferencesToSession();
    router.push("/dashboard/editor");
  };

  const handleAnalyzeResume = async () => {
    if (!hasResume || !hasJobDesc || isSaving) return;
    setSaveError("");

    if (!user) {
      setSaveError("You must be signed in to save and run an ATS analysis.");
      return;
    }

    try {
      setIsSaving(true);
      await setDoc(doc(db, "users", user.uid, "data", "resume"), {
        text: extractedText,
        fileName: effectiveFileName,
        jobDescription,
        jobTitle,
        company,
        location,
        updatedAt: new Date().toISOString(),
      });

      // Clear prior analysis & editor session cache so new file triggers a fresh scan & LaTeX build
      sessionStorage.removeItem("aiResult");
      sessionStorage.removeItem("analyzedResumeText");
      sessionStorage.removeItem("analyzedJobDesc");
      sessionStorage.removeItem("resumeLatexSource");
      sessionStorage.removeItem("resumeStructuredData");

      sessionStorage.setItem("resumeText", extractedText);
      sessionStorage.setItem("jobDescription", jobDescription);
      sessionStorage.setItem("fileName", effectiveFileName);
      sessionStorage.setItem("jobTitle", jobTitle);
      sessionStorage.setItem("company", company);
      sessionStorage.setItem("location", location);
      syncUserPreferencesToSession();

      router.push("/dashboard/analysis");
    } catch (err) {
      console.error("Failed to save to Firestore", err);
      setSaveError("Failed to save your resume to cloud storage. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Resume &amp; Target Job</h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume (or load a sample), paste or auto-fill a job posting, and launch your ATS Report or LaTeX Studio.
        </p>
      </div>

      {/* Quick Step Progress Banner */}
      <div
        aria-label="Scan workflow progress"
        className="bg-card border border-border rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
              hasResume
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-primary/10 text-primary border-primary/30"
            )}
          >
            {hasResume ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
            )}
            1. Resume
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />

          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
              hasJobDesc
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : hasResume
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border"
            )}
          >
            {hasJobDesc ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                2
              </span>
            )}
            2. Target JD
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />

          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
              hasResume && hasJobDesc
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border"
            )}
          >
            <span className="w-4 h-4 rounded-full bg-background/20 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            3. ATS Report or LaTeX Studio
          </span>
        </div>

        <span className="text-[11px] text-muted-foreground">
          {hasResume && hasJobDesc
            ? "Ready for deep ATS analysis"
            : hasResume
              ? "Resume ready — add a Target JD or open LaTeX Studio"
              : "Start by uploading a PDF/DOCX or loading the sample"}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                    1
                  </span>
                  Your Resume
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload your latest resume in PDF or DOCX format.
                </p>
              </div>
            </div>

            {isSampleResume ? (
              <div className="flex flex-col p-5 border border-emerald-500/30 rounded-xl bg-emerald-500/5 gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{SAMPLE_RESUME_FILENAME}</p>
                      <p className="text-xs text-muted-foreground">
                        Sample candidate resume loaded — ready to scan or edit
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSampleResume}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors cursor-pointer shrink-0"
                    title="Clear sample resume and upload your own"
                    aria-label="Clear sample resume"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleClearSampleResume}
                  className="self-start text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  Switch to uploading your own PDF / DOCX
                </button>
              </div>
            ) : (
              <>
                <Dropzone onFileSelect={handleFileSelect} isLoading={isParsing} />
                {!extractedText && !isParsing && (
                  <div className="flex items-center justify-between gap-3 pt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                      Just exploring? Test the workflow in 1 click:
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadSampleResume}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Load Sample Resume
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Extracted Text Preview */}
          {(extractedText || parseError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm"
            >
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" />
                Parsed Content Preview
              </h3>

              {parseError ? (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{parseError}</p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted/50 border border-border">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono h-48 overflow-y-auto">
                    {extractedText}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5 h-fit"
        >
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                2
              </span>
              Target Job Description
            </h2>
            <p className="text-sm text-muted-foreground">
              Import from a job posting URL, pick a sample role preset, or paste manually.
            </p>
          </div>

          {/* Import from Job URL */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2.5">
            <label
              htmlFor="job-url-input"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-primary" />
              Import from Job URL
            </label>
            <div className="flex gap-2">
              <input
                id="job-url-input"
                type="url"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  if (fetchJobError) setFetchJobError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchJobUrl();
                  }
                }}
                placeholder="https://boards.greenhouse.io/... or job link"
                className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isFetchingJob}
              />
              <button
                type="button"
                onClick={handleFetchJobUrl}
                disabled={isFetchingJob || !jobUrl.trim()}
                className="px-3.5 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isFetchingJob ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <span>Auto-Fill JD</span>
                )}
              </button>
            </div>
            {fetchJobError && (
              <p className="text-xs text-destructive flex items-start gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{fetchJobError}</span>
              </p>
            )}
            {fetchJobSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{fetchJobSuccess}</span>
              </p>
            )}
          </div>

          {/* Sample Role Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              Try Sample Preset / Diverse Roles
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    activePresetId === preset.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job Title (e.g. Senior Software Engineer)"
                aria-label="Job Title"
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (e.g. Stripe)"
                  aria-label="Company"
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (e.g. Remote, SF)"
                  aria-label="Job Location"
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setActivePresetId(null);
              }}
              placeholder="Paste the full job description here..."
              aria-label="Target Job Description"
              className="w-full h-44 p-4 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </motion.div>
      </div>

      {saveError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2"
      >
        <button
          type="button"
          disabled={!hasResume || isSaving}
          onClick={handleOpenLatexStudio}
          className={cn(
            "w-full sm:w-auto px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-muted shadow-xs",
            (!hasResume || isSaving) && "opacity-60 cursor-not-allowed"
          )}
        >
          <FileEdit className="w-4 h-4 text-primary" />
          <span>Open in LaTeX Studio</span>
        </button>

        <button
          type="button"
          disabled={!hasResume || !hasJobDesc || isSaving}
          onClick={handleAnalyzeResume}
          className={cn(
            "w-full sm:w-auto rounded-xl px-8 py-3 text-sm font-semibold transition-all flex items-center justify-center min-w-[170px] cursor-pointer",
            hasResume && hasJobDesc && !isSaving
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
          )}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Resume"}
        </button>
      </motion.div>
    </div>
  );
}
