"use client";

import React, { useEffect, useId, useState } from "react";
import {
  Award,
  Briefcase,
  Code2,
  FolderKanban,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { ResumeData } from "@/components/pdf/ResumeDocument";
import { LATEX_TEMPLATES, LatexTemplateId } from "@/lib/latexTemplates";

interface QuickFormDrawerProps {
  onClose: () => void;
  resumeData: ResumeData;
  templateId: LatexTemplateId;
  onApplyToMainTex: (updatedData: ResumeData, selectedTemplateId: LatexTemplateId) => void;
}

type SectionKey =
  | "template"
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "custom";

function cloneResumeData(data: ResumeData): ResumeData {
  return {
    personalInfo: { ...(data.personalInfo || {}) },
    summary: data.summary || "",
    experience: (data.experience || []).map((e) => ({
      ...e,
      bullets: [...(e.bullets || [])],
    })),
    education: (data.education || []).map((e) => ({
      ...e,
      bullets: [...(e.bullets || [])],
    })),
    projects: (data.projects || []).map((p) => ({
      ...p,
      bullets: [...(p.bullets || [])],
    })),
    skills: (data.skills || []).map((s) => ({
      category: s.category || "",
      items: [...(s.items || [])],
    })),
    certifications: (data.certifications || []).map((c) => ({ ...c })),
    customSections: (data.customSections || []).map((cs) => ({
      title: cs.title,
      content: cs.content || "",
      bullets: [...(cs.bullets || [])],
    })),
  };
}

export function QuickFormDrawer({
  onClose,
  resumeData,
  templateId,
  onApplyToMainTex,
}: QuickFormDrawerProps) {
  const [draft, setDraft] = useState<ResumeData>(() => cloneResumeData(resumeData));
  const [selectedTpl, setSelectedTpl] = useState<LatexTemplateId>(templateId);
  const [skillTexts, setSkillTexts] = useState<string[]>(() =>
    (resumeData.skills || []).map((s) => (s.items || []).join(", "))
  );
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(["template", "personal", "experience", "skills"])
  );

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updatePersonal = (field: keyof NonNullable<ResumeData["personalInfo"]>, value: string) => {
    setDraft((prev) => ({
      ...prev,
      personalInfo: { ...(prev.personalInfo || {}), [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedSkills = (draft.skills || [])
      .map((s, idx) => ({
        category: (s.category || "").trim() || "Skills",
        items: (skillTexts[idx] ?? (s.items || []).join(", "))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((s) => s.items.length > 0 || s.category.trim().length > 0);

    const cleanedData: ResumeData = {
      ...draft,
      experience: (draft.experience || []).map((exp) => ({
        ...exp,
        bullets: (exp.bullets || []).filter((b) => b.trim().length > 0),
      })),
      education: (draft.education || []).map((edu) => ({
        ...edu,
        bullets: (edu.bullets || []).filter((b) => b.trim().length > 0),
      })),
      projects: (draft.projects || []).map((proj) => ({
        ...proj,
        bullets: (proj.bullets || []).filter((b) => b.trim().length > 0),
      })),
      skills: cleanedSkills,
    };

    onApplyToMainTex(cleanedData, selectedTpl);
    onClose();
  };

  const experienceList = draft.experience || [];
  const educationList = draft.education || [];
  const projectsList = draft.projects || [];
  const skillsList = draft.skills || [];
  const customList = draft.customSections || [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-2xl h-full bg-card border-r border-border shadow-2xl flex flex-col min-h-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-foreground truncate">
                Guided Visual Resume Builder
              </h2>
              <p id={descId} className="text-xs text-muted-foreground truncate">
                Edit plain fields below — we generate clean, escaped Overleaf LaTeX automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Guided Form drawer"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto latex-scroller p-5 space-y-4">
            {/* 1. Template Selector */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("template")}
                onClick={() => toggleSection("template")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Overleaf Template Style ({LATEX_TEMPLATES.find((t) => t.id === selectedTpl)?.name})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("template") ? "Hide" : "Choose"}
                </span>
              </button>

              {openSections.has("template") && (
                <div className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-border/60">
                  {LATEX_TEMPLATES.map((tpl) => {
                    const active = selectedTpl === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTpl(tpl.id)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tpl.accentColor }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-bold text-foreground truncate">{tpl.name}</span>
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                          {tpl.tagline}
                        </p>
                        <p className="text-[10px] font-medium text-primary mt-1 truncate">
                          Best for: {tpl.audience}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. Personal Info & Links */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("personal")}
                onClick={() => toggleSection("personal")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  <span>Contact &amp; Profile Links</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("personal") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("personal") && (
                <div className="p-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/60">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.name || ""}
                      onChange={(e) => updatePersonal("name", e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={draft.personalInfo?.email || ""}
                      onChange={(e) => updatePersonal("email", e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.phone || ""}
                      onChange={(e) => updatePersonal("phone", e.target.value)}
                      placeholder="+1-555-234-5678"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.location || ""}
                      onChange={(e) => updatePersonal("location", e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      LinkedIn URL or Handle
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.linkedin || ""}
                      onChange={(e) => updatePersonal("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/alexrivera"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      GitHub URL or Handle
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.github || ""}
                      onChange={(e) => updatePersonal("github", e.target.value)}
                      placeholder="github.com/alexrivera"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Portfolio / Personal Website
                    </label>
                    <input
                      type="text"
                      value={draft.personalInfo?.portfolio || ""}
                      onChange={(e) => updatePersonal("portfolio", e.target.value)}
                      placeholder="alexrivera.dev"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 3. Summary */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("summary")}
                onClick={() => toggleSection("summary")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Code2 className="w-4 h-4 text-primary" />
                  <span>Professional Summary</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("summary") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("summary") && (
                <div className="p-4 pt-3 border-t border-border/60">
                  <textarea
                    rows={3}
                    value={draft.summary || ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Concise 2-3 sentence summary highlighting your track, years of experience, and impact..."
                    className="w-full p-3 rounded-lg bg-background border border-border text-xs text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                  />
                </div>
              )}
            </section>

            {/* 4. Experience */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("experience")}
                onClick={() => toggleSection("experience")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Work Experience ({experienceList.length})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("experience") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("experience") && (
                <div className="p-4 pt-3 space-y-4 border-t border-border/60">
                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-card border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary uppercase">
                          Role #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label={`Remove experience ${idx + 1}`}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).map((item, i) =>
                                i === idx ? { ...item, role: val } : item
                              ),
                            }));
                          }}
                          placeholder="Job Title (e.g. Senior Engineer)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).map((item, i) =>
                                i === idx ? { ...item, company: val } : item
                              ),
                            }));
                          }}
                          placeholder="Company Name"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={exp.date || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).map((item, i) =>
                                i === idx ? { ...item, date: val } : item
                              ),
                            }));
                          }}
                          placeholder="Dates (e.g. June 2022 - Present)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={exp.location || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).map((item, i) =>
                                i === idx ? { ...item, location: val } : item
                              ),
                            }));
                          }}
                          placeholder="Location (e.g. Remote / NYC)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Impact Bullets (auto-escaped for LaTeX)
                        </span>
                        {(exp.bullets || []).map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraft((prev) => ({
                                  ...prev,
                                  experience: (prev.experience || []).map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          bullets: (item.bullets || []).map((old, j) =>
                                            j === bIdx ? val : old
                                          ),
                                        }
                                      : item
                                  ),
                                }));
                              }}
                              placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
                              className="flex-1 p-2 rounded-lg bg-background border border-border text-xs text-foreground resize-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  experience: (prev.experience || []).map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          bullets: (item.bullets || []).filter((_, j) => j !== bIdx),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              aria-label={`Delete bullet ${bIdx + 1}`}
                              className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              experience: (prev.experience || []).map((item, i) =>
                                i === idx
                                  ? { ...item, bullets: [...(item.bullets || []), ""] }
                                  : item
                              ),
                            }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-semibold text-foreground cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        experience: [
                          ...(prev.experience || []),
                          { company: "", role: "", date: "", location: "", bullets: [""] },
                        ],
                      }))
                    }
                    className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Experience Entry</span>
                  </button>
                </div>
              )}
            </section>

            {/* 5. Projects */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("projects")}
                onClick={() => toggleSection("projects")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  <span>Projects ({projectsList.length})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("projects") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("projects") && (
                <div className="p-4 pt-3 space-y-4 border-t border-border/60">
                  {projectsList.map((proj, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-card border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary uppercase">
                          Project #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              projects: (prev.projects || []).filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label={`Remove project ${idx + 1}`}
                          className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={proj.name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              projects: (prev.projects || []).map((item, i) =>
                                i === idx ? { ...item, name: val } : item
                              ),
                            }));
                          }}
                          placeholder="Project Name"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={proj.description || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              projects: (prev.projects || []).map((item, i) =>
                                i === idx ? { ...item, description: val } : item
                              ),
                            }));
                          }}
                          placeholder="Tech Stack (e.g. Go, React)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={proj.date || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              projects: (prev.projects || []).map((item, i) =>
                                i === idx ? { ...item, date: val } : item
                              ),
                            }));
                          }}
                          placeholder="Year (e.g. 2025)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={proj.link || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            projects: (prev.projects || []).map((item, i) =>
                              i === idx ? { ...item, link: val } : item
                            ),
                          }));
                        }}
                        placeholder="Project / GitHub URL (optional)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                      />
                      <div className="space-y-2">
                        {(proj.bullets || []).map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraft((prev) => ({
                                  ...prev,
                                  projects: (prev.projects || []).map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          bullets: (item.bullets || []).map((old, j) =>
                                            j === bIdx ? val : old
                                          ),
                                        }
                                      : item
                                  ),
                                }));
                              }}
                              placeholder="Measurable project outcome..."
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  projects: (prev.projects || []).map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          bullets: (item.bullets || []).filter((_, j) => j !== bIdx),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              aria-label={`Delete project bullet ${bIdx + 1}`}
                              className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              projects: (prev.projects || []).map((item, i) =>
                                i === idx
                                  ? { ...item, bullets: [...(item.bullets || []), ""] }
                                  : item
                              ),
                            }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-semibold text-foreground cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        projects: [
                          ...(prev.projects || []),
                          { name: "", description: "", date: "", link: "", bullets: [""] },
                        ],
                      }))
                    }
                    className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>
              )}
            </section>

            {/* 6. Education */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("education")}
                onClick={() => toggleSection("education")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>Education ({educationList.length})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("education") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("education") && (
                <div className="p-4 pt-3 space-y-3 border-t border-border/60">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-card border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary uppercase">
                          School #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              education: (prev.education || []).filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label={`Remove education ${idx + 1}`}
                          className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              education: (prev.education || []).map((item, i) =>
                                i === idx ? { ...item, institution: val } : item
                              ),
                            }));
                          }}
                          placeholder="University / Institution"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={edu.degree || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              education: (prev.education || []).map((item, i) =>
                                i === idx ? { ...item, degree: val } : item
                              ),
                            }));
                          }}
                          placeholder="Degree (e.g. B.S. in Computer Science)"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={edu.date || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              education: (prev.education || []).map((item, i) =>
                                i === idx ? { ...item, date: val } : item
                              ),
                            }));
                          }}
                          placeholder="Graduation / Dates"
                          className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.location || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                education: (prev.education || []).map((item, i) =>
                                  i === idx ? { ...item, location: val } : item
                                ),
                              }));
                            }}
                            placeholder="City"
                            className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                          />
                          <input
                            type="text"
                            value={edu.gpa || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                education: (prev.education || []).map((item, i) =>
                                  i === idx ? { ...item, gpa: val } : item
                                ),
                              }));
                            }}
                            placeholder="GPA (opt.)"
                            className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        education: [
                          ...(prev.education || []),
                          { institution: "", degree: "", date: "", location: "", gpa: "", bullets: [] },
                        ],
                      }))
                    }
                    className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>
              )}
            </section>

            {/* 7. Technical Skills Categories */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("skills")}
                onClick={() => toggleSection("skills")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span>Skills Categories ({skillsList.length})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("skills") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("skills") && (
                <div className="p-4 pt-3 space-y-2.5 border-t border-border/60">
                  {skillsList.map((skill, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input
                        type="text"
                        value={skill.category || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            skills: (prev.skills || []).map((item, i) =>
                              i === idx ? { ...item, category: val } : item
                            ),
                          }));
                        }}
                        placeholder="Category (e.g. Languages)"
                        className="w-full sm:w-40 px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-semibold text-foreground shrink-0"
                      />
                      <input
                        type="text"
                        value={skillTexts[idx] ?? (skill.items || []).join(", ")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSkillTexts((prev) => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder="Comma-separated skills (TypeScript, Python, Go)"
                        className="w-full flex-1 px-2.5 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDraft((prev) => ({
                            ...prev,
                            skills: (prev.skills || []).filter((_, i) => i !== idx),
                          }));
                          setSkillTexts((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        aria-label={`Remove skill category ${idx + 1}`}
                        className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        skills: [...(prev.skills || []), { category: "", items: [] }],
                      }));
                      setSkillTexts((prev) => [...prev, ""]);
                    }}
                    className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill Category</span>
                  </button>
                </div>
              )}
            </section>

            {/* 8. Publications / Research / Custom Sections */}
            <section className="rounded-xl border border-border bg-background/60 overflow-hidden">
              <button
                type="button"
                aria-expanded={openSections.has("custom")}
                onClick={() => toggleSection("custom")}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Publications, Awards &amp; Custom Sections ({customList.length})</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {openSections.has("custom") ? "Hide" : "Edit"}
                </span>
              </button>

              {openSections.has("custom") && (
                <div className="p-4 pt-3 space-y-3 border-t border-border/60">
                  {customList.map((cs, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-card border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cs.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => ({
                              ...prev,
                              customSections: (prev.customSections || []).map((item, i) =>
                                i === idx ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          placeholder="Section Title (e.g. Publications, Leadership, Awards)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              customSections: (prev.customSections || []).filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label={`Remove custom section ${idx + 1}`}
                          className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={cs.content || (cs.bullets || []).join("\n")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => ({
                            ...prev,
                            customSections: (prev.customSections || []).map((item, i) =>
                              i === idx ? { ...item, content: val, bullets: [] } : item
                            ),
                          }));
                        }}
                        placeholder="Details, citation, or summary..."
                        className="w-full p-2 rounded-lg bg-background border border-border text-xs text-foreground resize-y"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        customSections: [
                          ...(prev.customSections || []),
                          { title: "Publications", content: "", bullets: [] },
                        ],
                      }))
                    }
                    className="w-full py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Publications / Custom Section</span>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3.5 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Special chars (&amp;, %, $, #) are auto-escaped safely.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply to main.tex</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
