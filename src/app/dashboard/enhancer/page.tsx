"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Wand2,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileEdit,
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Code2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface EnhancedOption {
  text: string;
  reasoning: string;
}

interface GithubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  htmlUrl: string;
}

interface GithubRepoResult {
  name: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
  xyzBullets: string[];
  latexSnippet: string;
}

interface GithubSyncResponse {
  profile: GithubProfile;
  repos: GithubRepoResult[];
}

const TRACK_OPTIONS = [
  "Software Engineering",
  "Product & Management",
  "Data Science & ML",
  "Research & Academia",
  "Finance & Consulting",
  "Design & Frontend",
] as const;

// All tone labels are kept <= 100 chars to satisfy POST /api/enhance validation
const TONES = [
  "Google XYZ Formula (Accomplished X, Measured by Y, By Doing Z)",
  "Metrics & Executive ROI Impact",
  "FAANG Systems Scale & Technical Depth",
  "Product Strategy, KPIs & Cross-Functional Leadership",
  "Data / ML Model Accuracy & Pipeline Latency",
  "Finance / Consulting Analytical Rigor",
  "Action-Oriented & Concise (1-Line Fit)",
];

const SAMPLE_DRAFTS = [
  "Fixed a bug that made the checkout page slow.",
  "Built an internal dashboard for tracking team metrics.",
  "Trained a churn model and improved accuracy.",
];

export default function EnhancerPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Bullet Rewriter state
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState("");
  const [track, setTrack] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<EnhancedOption[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // GitHub Sync -> XYZ Generator state
  const [githubUsername, setGithubUsername] = useState("");
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [githubResult, setGithubResult] = useState<GithubSyncResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDefaults = async () => {
      await Promise.resolve();
      if (cancelled) return;

      const storedTrack =
        localStorage.getItem("userTargetTrack") ||
        sessionStorage.getItem("userTargetTrack") ||
        "";
      const storedGithub =
        localStorage.getItem("userGithubUsername") ||
        sessionStorage.getItem("userGithubUsername") ||
        "";

      if (storedTrack) setTrack(storedTrack);
      if (storedGithub) setGithubUsername(storedGithub);

      if (user && (!storedTrack || !storedGithub)) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid, "data", "settings"));
          if (!cancelled && snap.exists()) {
            const data = snap.data();
            if (!storedTrack && data?.targetTrack) {
              setTrack(data.targetTrack);
              localStorage.setItem("userTargetTrack", data.targetTrack);
            }
            if (!storedGithub && data?.githubUsername) {
              setGithubUsername(data.githubUsername);
              localStorage.setItem("userGithubUsername", data.githubUsername);
            }
          }
        } catch {
          // ignore settings fallback error
        }
      }
    };

    loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const effectiveRole = [role.trim(), track.trim()]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 100);

  const handleEnhance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setIsLoading(true);
    setError("");
    setOptions(null);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: draft.slice(0, 2000),
          role: effectiveRole,
          tone: tone.slice(0, 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to enhance bullet point");
      }

      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options);
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = githubUsername.trim();
    if (!cleaned) {
      setGithubError("Enter a GitHub username or profile URL.");
      return;
    }

    setIsSyncingGithub(true);
    setGithubError("");

    try {
      const res = await fetch("/api/github-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleaned,
          targetRole: effectiveRole || undefined,
          maxRepos: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync GitHub repositories");
      }

      setGithubResult(data as GithubSyncResponse);
    } catch (err: unknown) {
      console.error("GitHub sync failed:", err);
      setGithubError(
        err instanceof Error ? err.message : "Failed to fetch repositories from GitHub."
      );
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const sendBulletToLatexStudio = (text: string) => {
    sessionStorage.setItem("pendingLatexBullet", text);
    router.push("/dashboard/editor");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wand2 className="w-8 h-8 text-primary" /> AI Bullet &amp; GitHub Rewriter
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform rough duties into Google XYZ achievements or generate project bullets directly from your GitHub repositories.
        </p>
      </div>

      {/* Section 1: Bullet Point Enhancer */}
      <div className="grid md:grid-cols-12 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-5 space-y-6"
        >
          <form
            onSubmit={handleEnhance}
            className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="bullet-draft-input" className="block text-sm font-medium">
                  Draft Bullet Point
                </label>
                <span className="text-[11px] text-muted-foreground">Try a sample</span>
              </div>
              <textarea
                id="bullet-draft-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Fixed a bug that made the app slow."
                className="w-full h-32 p-3 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SAMPLE_DRAFTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setDraft(sample)}
                    className="text-[11px] px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors text-left cursor-pointer"
                  >
                    &ldquo;{sample}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="enhancer-track-select" className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Industry / Track
                </label>
                <select
                  id="enhancer-track-select"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Auto / General</option>
                  {TRACK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="enhancer-role-input" className="block text-sm font-medium mb-2">
                  Target Role (Optional)
                </label>
                <input
                  id="enhancer-role-input"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Combined with your selected Track to tailor action verbs &amp; metrics.
                </p>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium mb-2">Desired Tone &amp; Focus</span>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border text-left cursor-pointer",
                      tone === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Enhancements
                </>
              )}
            </button>

            {error && (
              <div
                role="alert"
                className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-7"
        >
          {isLoading ? (
            <div className="h-full min-h-[400px] bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Applying Google XYZ career coaching...</p>
            </div>
          ) : options ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Suggestions
              </h2>
              {options.map((opt, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  key={idx}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors space-y-3"
                >
                  <p className="text-foreground leading-relaxed text-sm sm:text-base">
                    <span className="text-primary font-bold mr-2">&bull;</span>
                    {opt.text}
                  </p>
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md border border-border/50">
                    <span className="font-semibold block mb-1">Why this works:</span>
                    {opt.reasoning}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(opt.text, `opt-${idx}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {copiedKey === `opt-${idx}` ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Bullet</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendBulletToLatexStudio(opt.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Send to LaTeX Studio</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-card/50 border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Waiting for input</h3>
              <p className="text-sm max-w-sm">
                Paste a rough bullet on the left (or pick a sample) and generate 3 quantified Google XYZ variations ready for LaTeX Studio.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Section 2: GitHub Repository -> XYZ Bullet Generator */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                GitHub Repository &rarr; XYZ Bullet Generator
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Fetch your top public repositories and automatically generate quantified Google XYZ bullets and Overleaf{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  \resumeProjectHeading
                </code>{" "}
                snippets.
              </p>
            </div>
          </div>

          <form onSubmit={handleGithubSync} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="GitHub username or URL"
              aria-label="GitHub username or URL"
              className="px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[220px]"
            />
            <button
              type="submit"
              disabled={isSyncingGithub || !githubUsername.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {isSyncingGithub ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing Repos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate from GitHub</span>
                </>
              )}
            </button>
          </form>
        </div>

        {githubError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{githubError}</span>
          </div>
        )}

        {githubResult ? (
          <div className="space-y-6">
            {/* GitHub Profile Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                  {(githubResult.profile.name || githubResult.profile.username)
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {githubResult.profile.name || githubResult.profile.username}
                    </span>
                    <a
                      href={githubResult.profile.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      @{githubResult.profile.username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {githubResult.profile.bio && (
                    <p className="text-xs text-muted-foreground truncate max-w-xl mt-0.5">
                      {githubResult.profile.bio}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span>
                  <strong className="text-foreground">{githubResult.profile.publicRepos}</strong> public repos
                </span>
                <span>
                  <strong className="text-foreground">{githubResult.profile.followers}</strong> followers
                </span>
              </div>
            </div>

            {/* Repo Cards */}
            {githubResult.repos.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                No public non-fork repositories found for @{githubResult.profile.username}.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {githubResult.repos.map((repo) => (
                  <div
                    key={repo.name}
                    className="rounded-xl border border-border bg-background/60 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-base text-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span className="truncate">{repo.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            {repo.stars}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <GitFork className="w-3.5 h-3.5" />
                            {repo.forks}
                          </span>
                        </div>
                      </div>

                      {(repo.language || repo.topics.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {repo.language}
                            </span>
                          )}
                          {repo.topics.slice(0, 4).map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground border border-border"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* XYZ Bullets */}
                      <div className="space-y-2.5 pt-1">
                        {repo.xyzBullets.map((bullet, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-3 rounded-lg bg-card border border-border space-y-2"
                          >
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                              <span className="text-primary font-bold mr-1.5">&bull;</span>
                              {bullet}
                            </p>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(bullet, `gh-${repo.name}-${bIdx}`)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground transition-colors cursor-pointer"
                              >
                                {copiedKey === `gh-${repo.name}-${bIdx}` ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => sendBulletToLatexStudio(bullet)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <FileEdit className="w-3 h-3" />
                                <span>Send to LaTeX Studio</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Copyable LaTeX \resumeProjectHeading snippet */}
                    {repo.latexSnippet && (
                      <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/60">
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                            Overleaf LaTeX Snippet
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(repo.latexSnippet, `tex-${repo.name}`)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {copiedKey === `tex-${repo.name}` ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Copied LaTeX</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy \resumeProjectHeading</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {repo.latexSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              Turn your open-source repos into resume-ready project bullets
            </p>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Enter any public GitHub username (or set your default handle in Settings), then click{" "}
              <span className="font-semibold text-foreground">Generate from GitHub</span> to pull top repositories with XYZ bullets and Overleaf LaTeX blocks.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
