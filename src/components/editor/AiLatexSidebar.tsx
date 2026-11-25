"use client";

import React, { useId, useState } from "react";
import {
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderGit2,
  GitFork,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Wand2,
  X,
} from "lucide-react";
import { Suggestion } from "@/components/analysis/ImprovementSuggestionCard";
import { ResumeData } from "@/components/pdf/ResumeDocument";
import { formatGithubRepoToTex, generateCoverLetterLatex } from "@/lib/latexTemplates";
import { getUserPref, setUserPref } from "@/lib/userStorage";

interface GithubSyncedRepo {
  name: string;
  description?: string;
  htmlUrl?: string;
  language?: string;
  stars?: number;
  forks?: number;
  topics?: string[];
  updatedAt?: string;
  xyzBullets?: string[];
  latexSnippet?: string;
}

interface GithubSyncProfile {
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  publicRepos?: number;
  followers?: number;
  htmlUrl?: string;
}

interface AiLatexSidebarProps {
  onClose: () => void;
  aiSuggestions: Suggestion[];
  appliedSuggestionIds: Set<number>;
  onApplySuggestion: (sug: Suggestion, idx: number) => void;
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
  onJobDescriptionChange: (jd: string) => void;
  missingKeywords: string[];
  onAddKeywordToSkills: (kw: string) => void;
  onInsertBulletSnippet: (plainBullet: string) => void;
  onInsertTexSnippet?: (rawTexSnippet: string) => void;
  onTailorFullTex: () => Promise<void>;
  isTailoringTex: boolean;
  tailorSummary: string[];
  structuredResume?: ResumeData;
  resumePlainText?: string;
  onLoadCoverLetterTex?: (coverLetterTex: string, meta?: { company?: string; jobTitle?: string }) => void;
  onJobMetaChange?: (meta: { jobTitle?: string; company?: string }) => void;
}

function buildResumeFallbackText(data?: ResumeData): string {
  if (!data) return "";
  const parts: string[] = [];
  if (data.personalInfo?.name) parts.push(data.personalInfo.name);
  if (data.summary) parts.push(data.summary);
  for (const exp of data.experience || []) {
    parts.push(`${exp.role || ""} at ${exp.company || ""}: ${(exp.bullets || []).join(" ")}`);
  }
  for (const proj of data.projects || []) {
    parts.push(`${proj.name || ""} (${proj.description || ""}): ${(proj.bullets || []).join(" ")}`);
  }
  for (const sk of data.skills || []) {
    parts.push(`${sk.category || ""}: ${(sk.items || []).join(", ")}`);
  }
  return parts.join("\n").trim();
}

export function AiLatexSidebar({
  onClose,
  aiSuggestions,
  appliedSuggestionIds,
  onApplySuggestion,
  jobTitle,
  company,
  location,
  jobDescription,
  onJobDescriptionChange,
  missingKeywords,
  onAddKeywordToSkills,
  onInsertBulletSnippet,
  onInsertTexSnippet,
  onTailorFullTex,
  isTailoringTex,
  tailorSummary,
  structuredResume,
  resumePlainText,
  onLoadCoverLetterTex,
  onJobMetaChange,
}: AiLatexSidebarProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "jd" | "github" | "cover-letter">("ai");
  const [customDraft, setCustomDraft] = useState("");
  const [customTone, setCustomTone] = useState("Metrics and Data Focused");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<Array<{ text: string; reasoning: string }>>([]);
  const [insertedOptionIdx, setInsertedOptionIdx] = useState<number | null>(null);
  const [genError, setGenError] = useState("");

  // GitHub Sync State
  const [githubUsername, setGithubUsername] = useState<string>(() =>
    getUserPref("userGithubUsername")
  );
  const [githubTargetRole, setGithubTargetRole] = useState<string>(() => {
    if (jobTitle) return jobTitle;
    return getUserPref("userTargetTrack");
  });
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [githubProfile, setGithubProfile] = useState<GithubSyncProfile | null>(null);
  const [githubRepos, setGithubRepos] = useState<GithubSyncedRepo[]>([]);
  const [insertedRepoKey, setInsertedRepoKey] = useState<string | null>(null);

  // Cover Letter Generator State
  const [clCompany, setClCompany] = useState(company);
  const [clJobTitle, setClJobTitle] = useState(jobTitle);
  const [clNotes, setClNotes] = useState("");
  const [isGeneratingCl, setIsGeneratingCl] = useState(false);
  const [clError, setClError] = useState("");
  const [clSuccessMsg, setClSuccessMsg] = useState("");

  const aiTabId = useId();
  const jdTabId = useId();
  const githubTabId = useId();
  const coverTabId = useId();
  const draftInputId = useId();
  const toneSelectId = useId();
  const jdTextareaId = useId();
  const ghInputId = useId();
  const ghRoleId = useId();
  const clCompanyId = useId();
  const clTitleId = useId();

  const handleGenerateBullets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDraft.trim()) return;
    setIsGenerating(true);
    setGeneratedOptions([]);
    setGenError("");

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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate bullets");
      if (Array.isArray(data.options)) {
        setGeneratedOptions(data.options);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeywordBullet = async (kw: string) => {
    setActiveTab("ai");
    const promptDraft = `Demonstrate measurable production impact engineering solutions with ${kw}`;
    setCustomDraft(promptDraft);
    setIsGenerating(true);
    setGeneratedOptions([]);
    setGenError("");

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: promptDraft,
          role: jobTitle || "Software Engineer",
          tone: "Metrics and Data Focused",
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.options)) {
        setGeneratedOptions(data.options);
      }
    } catch {
      setGenError("Could not generate keyword bullet right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGithubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;
    setIsSyncingGithub(true);
    setGithubError("");

    try {
      const res = await fetch("/api/github-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: githubUsername.trim(),
          targetRole: (githubTargetRole || jobTitle || "Software Engineer").trim(),
          maxRepos: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `GitHub sync failed (${res.status})`);
      }

      if (data.profile) {
        setGithubProfile(data.profile);
        if (data.profile.username) {
          setUserPref("userGithubUsername", data.profile.username);
        }
      }
      setGithubRepos(Array.isArray(data.repos) ? data.repos : []);
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Could not fetch GitHub repositories.");
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleInsertGithubProject = (repo: GithubSyncedRepo) => {
    const texBlock = formatGithubRepoToTex({
      name: repo.name,
      htmlUrl: repo.htmlUrl,
      description: repo.description,
      topics: repo.topics,
      xyzBullets: repo.xyzBullets,
      language: repo.language,
      stars: repo.stars,
      updatedAt: repo.updatedAt,
    });

    if (onInsertTexSnippet) {
      onInsertTexSnippet(`\n${texBlock}\n`);
    } else {
      onInsertBulletSnippet(repo.xyzBullets?.[0] || repo.description || repo.name);
    }
    setInsertedRepoKey(repo.name);
    setTimeout(() => setInsertedRepoKey(null), 2200);
  };

  const handleGenerateCoverLetterAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingCl(true);
    setClError("");
    setClSuccessMsg("");

    const effectiveCompany = (clCompany || company || "Hiring Team").trim();
    const effectiveTitle = (clJobTitle || jobTitle || "Target Role").trim();
    const effectiveResume =
      (resumePlainText && resumePlainText.trim()) ||
      buildResumeFallbackText(structuredResume) ||
      "Experienced candidate seeking impactful role.";
    const effectiveJd =
      (jobDescription && jobDescription.trim()) ||
      (clNotes && clNotes.trim()) ||
      `Seeking a ${effectiveTitle} at ${effectiveCompany} to deliver measurable product and engineering outcomes.`;

    onJobMetaChange?.({ company: effectiveCompany, jobTitle: effectiveTitle });

    try {
      const track = getUserPref("userTargetTrack") || undefined;
      const res = await fetch("/api/career-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cover-letter",
          resumeText: effectiveResume,
          jobDescription: effectiveJd,
          jobTitle: effectiveTitle,
          company: effectiveCompany,
          missingKeywords,
          candidateName: structuredResume?.personalInfo?.name,
          track,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Cover letter generation failed");
      }

      const cl = data?.coverLetter;
      const latexSource =
        typeof cl?.latexSource === "string" && cl.latexSource.includes("\\begin{document}")
          ? cl.latexSource
          : generateCoverLetterLatex({
              candidateName: structuredResume?.personalInfo?.name || "Your Name",
              email: structuredResume?.personalInfo?.email,
              phone: structuredResume?.personalInfo?.phone,
              location: structuredResume?.personalInfo?.location,
              company: effectiveCompany,
              jobTitle: effectiveTitle,
              salutation: cl?.salutation || "Dear Hiring Manager,",
              paragraphs:
                Array.isArray(cl?.paragraphs) && cl.paragraphs.length > 0
                  ? cl.paragraphs
                  : [
                      `I am excited to apply for the ${effectiveTitle} position at ${effectiveCompany}.`,
                    ],
              signOff: cl?.signOff || "Sincerely,",
            });

      onLoadCoverLetterTex?.(latexSource, {
        company: effectiveCompany,
        jobTitle: effectiveTitle,
      });
      setClSuccessMsg("Loaded AI cover letter into cover_letter.tex and compiling PDF!");
    } catch (err) {
      setClError(err instanceof Error ? err.message : "Could not generate cover letter right now.");
    } finally {
      setIsGeneratingCl(false);
    }
  };

  const handleLoadQuickCoverLetterTemplate = () => {
    const effectiveCompany = (clCompany || company || "Hiring Company").trim();
    const effectiveTitle = (clJobTitle || jobTitle || "Software Engineer").trim();
    const p = structuredResume?.personalInfo;
    const summaryText = structuredResume?.summary?.trim();
    const topExp = structuredResume?.experience?.[0];

    const paragraphs = [
      `I am writing to express my enthusiastic interest in the ${effectiveTitle} position at ${effectiveCompany}. ${
        summaryText || "With a proven track record of shipping scalable, reliable systems, I am eager to contribute immediate value to your team."
      }`,
      topExp
        ? `Most recently as ${topExp.role || "an engineer"} at ${topExp.company || "my current organization"}, ${
            topExp.bullets?.[0] || "I led key technical initiatives focused on measurable performance and customer impact."
          }`
        : `Across my recent work, I have focused on solving ambiguous engineering problems, strengthening reliability, and delivering measurable business outcomes.`,
      `I would welcome the opportunity to discuss how my background aligns with ${effectiveCompany}'s goals for the ${effectiveTitle} role. Thank you for your time and consideration.`,
    ];

    const latex = generateCoverLetterLatex({
      candidateName: p?.name || "Your Name",
      email: p?.email,
      phone: p?.phone,
      location: p?.location,
      company: effectiveCompany,
      jobTitle: effectiveTitle,
      salutation: "Dear Hiring Manager,",
      paragraphs,
      signOff: "Sincerely,",
    });

    onLoadCoverLetterTex?.(latex, { company: effectiveCompany, jobTitle: effectiveTitle });
    setClSuccessMsg("Loaded Overleaf cover letter template into cover_letter.tex!");
  };

  return (
    <aside
      aria-label="AI LaTeX Assistant"
      className="w-full sm:w-[400px] border-l border-border bg-card flex flex-col shrink-0 h-full min-h-0 shadow-xl z-20"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-foreground truncate">Overleaf AI Copilot</h2>
            <p className="text-[11px] text-muted-foreground truncate">
              AI Polish, Target JD, GitHub Sync &amp; Cover Letter
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Copilot drawer"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Accessible WAI-ARIA Tablist (4 Panels) */}
      <div
        role="tablist"
        aria-label="AI Copilot sections"
        className="grid grid-cols-4 border-b border-border bg-muted/30 shrink-0 px-1"
      >
        <button
          type="button"
          id={aiTabId}
          role="tab"
          aria-selected={activeTab === "ai"}
          onClick={() => setActiveTab("ai")}
          className={`relative py-2.5 px-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "ai"
              ? "text-primary after:content-[''] after:absolute after:inset-x-1.5 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 shrink-0" />
          <span>Polish</span>
          {aiSuggestions.length - appliedSuggestionIds.size > 0 && (
            <span className="px-1 rounded-full text-[9px] font-bold bg-primary/15 text-primary">
              {aiSuggestions.length - appliedSuggestionIds.size}
            </span>
          )}
        </button>

        <button
          type="button"
          id={jdTabId}
          role="tab"
          aria-selected={activeTab === "jd"}
          onClick={() => setActiveTab("jd")}
          className={`relative py-2.5 px-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "jd"
              ? "text-primary after:content-[''] after:absolute after:inset-x-1.5 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Target className="w-3.5 h-3.5 shrink-0" />
          <span>JD</span>
          {missingKeywords.length > 0 && (
            <span className="px-1 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-500">
              {missingKeywords.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id={githubTabId}
          role="tab"
          aria-selected={activeTab === "github"}
          onClick={() => setActiveTab("github")}
          className={`relative py-2.5 px-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "github"
              ? "text-primary after:content-[''] after:absolute after:inset-x-1.5 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
          <span>GitHub</span>
        </button>

        <button
          type="button"
          id={coverTabId}
          role="tab"
          aria-selected={activeTab === "cover-letter"}
          onClick={() => setActiveTab("cover-letter")}
          className={`relative py-2.5 px-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "cover-letter"
              ? "text-primary after:content-[''] after:absolute after:inset-x-1.5 after:bottom-0 after:border-b-2 after:border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span>Letter</span>
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto latex-scroller p-4 space-y-5">
        {/* Panel 1: AI Polish & Tailor */}
        <div role="tabpanel" aria-labelledby={aiTabId} hidden={activeTab !== "ai"}>
          {activeTab === "ai" && (
            <div className="space-y-5">
              {/* 1-Click Tailor Whole .tex Document */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Tailor Full LaTeX to Job</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Upgrades your <code className="text-[10px] font-mono bg-muted px-1 rounded">main.tex</code> bullets with Google XYZ metrics while preserving valid TeX Live syntax.
                </p>
                <button
                  type="button"
                  onClick={onTailorFullTex}
                  disabled={isTailoringTex || !jobDescription.trim()}
                  className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTailoringTex ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing main.tex...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>
                        {jobDescription.trim()
                          ? "Auto-Tailor .tex to Target JD"
                          : "Add Target JD First (JD Tab)"}
                      </span>
                    </>
                  )}
                </button>

                {tailorSummary.length > 0 && (
                  <ul className="pt-2 border-t border-primary/15 space-y-1 text-[11px] text-foreground">
                    {tailorSummary.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Scanned ATS Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-foreground">Scanned Bullet Upgrades</span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {appliedSuggestionIds.size}/{aiSuggestions.length}
                    </span>
                  </div>

                  {aiSuggestions.map((sug, idx) => {
                    const isApplied = appliedSuggestionIds.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                          isApplied
                            ? "bg-emerald-500/5 border-emerald-500/30 opacity-75"
                            : "bg-background border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {sug.impact} Impact
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-through">
                          {sug.original}
                        </p>
                        <p className="text-[11px] text-foreground font-medium bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                          {sug.improved}
                        </p>
                        <button
                          type="button"
                          onClick={() => onApplySuggestion(sug, idx)}
                          disabled={isApplied}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            isApplied
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-foreground text-background hover:opacity-90"
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Applied to main.tex</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Apply to main.tex</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custom Google XYZ Bullet -> \resumeItem Generator */}
              <form
                onSubmit={handleGenerateBullets}
                className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <label htmlFor={draftInputId} className="text-xs font-bold text-foreground">
                    Generate LaTeX Bullet Point
                  </label>
                  <span className="text-[10px] text-muted-foreground">Auto-Escaped</span>
                </div>
                <textarea
                  id={draftInputId}
                  rows={3}
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  placeholder="Describe what you built or tools used (e.g. Built caching layer with Redis reducing latency)..."
                  className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />

                <div>
                  <label htmlFor={toneSelectId} className="sr-only">
                    Bullet Focus Tone
                  </label>
                  <select
                    id={toneSelectId}
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    className="w-full p-2 rounded-lg bg-background border border-border text-xs font-medium text-foreground"
                  >
                    <option value="Metrics and Data Focused">Metrics &amp; Data Focused</option>
                    <option value="Technical Depth and Scale">Technical Depth &amp; Scale</option>
                    <option value="Leadership and Initiative">Leadership &amp; Initiative</option>
                  </select>
                </div>

                {genError && (
                  <p role="alert" className="text-[11px] text-destructive font-medium">
                    {genError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isGenerating || !customDraft.trim()}
                  className="w-full py-2 rounded-lg bg-foreground text-background text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing TeX Bullets...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate \resumeItem Options</span>
                    </>
                  )}
                </button>

                {generatedOptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {generatedOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-background border border-border space-y-2 text-[11px]"
                      >
                        <p className="text-foreground font-medium leading-relaxed">{opt.text}</p>
                        <p className="text-[10px] text-muted-foreground italic">{opt.reasoning}</p>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertBulletSnippet(opt.text);
                            setInsertedOptionIdx(idx);
                            setTimeout(() => setInsertedOptionIdx(null), 2000);
                          }}
                          className="w-full py-1 px-2 rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          {insertedOptionIdx === idx ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Inserted into main.tex!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Insert \resumeItem at Cursor</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Panel 2: Target JD & Keywords */}
        <div role="tabpanel" aria-labelledby={jdTabId} hidden={activeTab !== "jd"}>
          {activeTab === "jd" && (
            <div className="space-y-5">
              {(jobTitle || company || location) && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
                  {jobTitle && (
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{jobTitle}</span>
                    </div>
                  )}
                  {company && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{company}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Keywords */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">Missing Target Keywords</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {missingKeywords.length}
                  </span>
                </div>

                {missingKeywords.length > 0 ? (
                  <div className="space-y-1.5">
                    {missingKeywords.map((kw, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border text-xs"
                      >
                        <span className="font-semibold text-foreground truncate min-w-0">
                          {kw}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleKeywordBullet(kw)}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Wand2 className="w-2.5 h-2.5" />
                            <span>Bullet</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddKeywordToSkills(kw)}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Inject directly into LaTeX Technical Skills"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Skill</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>All scanned keywords covered!</span>
                  </div>
                )}
              </div>

              {/* Editable Job Description */}
              <div className="space-y-2">
                <label htmlFor={jdTextareaId} className="text-xs font-bold text-foreground block">
                  Target Job Description
                </label>
                <textarea
                  id={jdTextareaId}
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => onJobDescriptionChange(e.target.value)}
                  placeholder="Paste target Job Description here to enable 1-Click Auto-Tailor .tex..."
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-[11px] text-foreground leading-relaxed latex-scroller focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Panel 3: GitHub Repo Sync -> \resumeProjectHeading */}
        <div role="tabpanel" aria-labelledby={githubTabId} hidden={activeTab !== "github"}>
          {activeTab === "github" && (
            <div className="space-y-4">
              <form
                onSubmit={handleGithubSync}
                className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FolderGit2 className="w-4 h-4 text-primary" />
                  <span>Sync GitHub Repositories</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Import top public repos with quantified Google XYZ bullets and 1-click inject clean{" "}
                  <code className="font-mono text-[10px] bg-background px-1 rounded">\resumeProjectHeading</code> blocks.
                </p>

                <div>
                  <label htmlFor={ghInputId} className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    GitHub Username or URL
                  </label>
                  <input
                    id={ghInputId}
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="e.g. octocat or github.com/octocat"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={ghRoleId} className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Target Role Context (Optional)
                  </label>
                  <input
                    id={ghRoleId}
                    type="text"
                    value={githubTargetRole}
                    onChange={(e) => setGithubTargetRole(e.target.value)}
                    placeholder="e.g. Backend Engineer, ML Engineer"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {githubError && (
                  <p role="alert" className="text-[11px] text-destructive font-medium">
                    {githubError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSyncingGithub || !githubUsername.trim()}
                  className="w-full py-2 px-3 rounded-lg bg-foreground text-background hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingGithub ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Repos &amp; Crafting XYZ Bullets...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync GitHub Projects</span>
                    </>
                  )}
                </button>
              </form>

              {githubProfile && (
                <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {githubProfile.name || `@${githubProfile.username}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      @{githubProfile.username}
                      {typeof githubProfile.publicRepos === "number"
                        ? ` · ${githubProfile.publicRepos} public repos`
                        : ""}
                    </p>
                  </div>
                  {githubProfile.htmlUrl && (
                    <a
                      href={githubProfile.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                      aria-label={`Open ${githubProfile.username} on GitHub`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {githubRepos.length > 0 && (
                <div className="space-y-3">
                  {githubRepos.map((repo) => (
                    <div
                      key={repo.name}
                      className="p-3 rounded-xl bg-background border border-border space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate">{repo.name}</span>
                            {repo.language && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground shrink-0">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0 font-mono">
                          <span className="inline-flex items-center gap-0.5" title="Stars">
                            <Star className="w-3 h-3 text-amber-500" />
                            {repo.stars ?? 0}
                          </span>
                          {typeof repo.forks === "number" && (
                            <span className="inline-flex items-center gap-0.5" title="Forks">
                              <GitFork className="w-3 h-3" />
                              {repo.forks}
                            </span>
                          )}
                        </div>
                      </div>

                      {Array.isArray(repo.xyzBullets) && repo.xyzBullets.length > 0 && (
                        <ul className="space-y-1.5 pt-1 border-t border-border/60">
                          {repo.xyzBullets.map((b, bIdx) => (
                            <li
                              key={bIdx}
                              className="text-[11px] text-foreground leading-relaxed bg-muted/30 p-2 rounded-lg flex items-start justify-between gap-2"
                            >
                              <span>{b}</span>
                              <button
                                type="button"
                                onClick={() => onInsertBulletSnippet(b)}
                                title="Insert single bullet at cursor"
                                className="px-1.5 py-0.5 rounded bg-background border border-border hover:bg-muted text-[10px] font-semibold text-primary shrink-0 cursor-pointer"
                              >
                                + Item
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        type="button"
                        onClick={() => handleInsertGithubProject(repo)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {insertedRepoKey === repo.name ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Inserted \resumeProjectHeading!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert \resumeProjectHeading at Cursor</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 4: Overleaf Cover Letter Generator -> cover_letter.tex */}
        <div role="tabpanel" aria-labelledby={coverTabId} hidden={activeTab !== "cover-letter"}>
          {activeTab === "cover-letter" && (
            <div className="space-y-4">
              <form
                onSubmit={handleGenerateCoverLetterAi}
                className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Overleaf Cover Letter Studio</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tailors a matching LaTeX cover letter into{" "}
                  <code className="font-mono text-[10px] bg-muted px-1 rounded">cover_letter.tex</code> and compiles a crisp PDF.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label htmlFor={clCompanyId} className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Target Company
                    </label>
                    <input
                      id={clCompanyId}
                      type="text"
                      value={clCompany}
                      onChange={(e) => setClCompany(e.target.value)}
                      placeholder="e.g. Stripe, Anthropic, Goldman Sachs"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label htmlFor={clTitleId} className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Target Role
                    </label>
                    <input
                      id={clTitleId}
                      type="text"
                      value={clJobTitle}
                      onChange={(e) => setClJobTitle(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                    />
                  </div>
                </div>

                {!jobDescription.trim() && (
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Role Focus / Job Summary (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={clNotes}
                      onChange={(e) => setClNotes(e.target.value)}
                      placeholder="Paste key JD requirements or why you are excited about this team..."
                      className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground resize-none"
                    />
                  </div>
                )}

                {clError && (
                  <p role="alert" className="text-[11px] text-destructive font-medium">
                    {clError}
                  </p>
                )}

                {clSuccessMsg && (
                  <p role="status" className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{clSuccessMsg}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingCl}
                  className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingCl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Cover Letter .tex...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate AI Cover Letter</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLoadQuickCoverLetterTemplate}
                  className="w-full py-2 px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Load Instant Template into cover_letter.tex</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
