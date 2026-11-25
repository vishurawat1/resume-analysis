"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Settings,
  LogOut,
  User,
  Mail,
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  MapPin,
  Check,
  Loader2,
  Compass,
  Sparkles,
  GitBranch,
  Target,
  FileCode2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const TARGET_TRACKS = [
  {
    id: "Software Engineering",
    desc: "Backend, Full-Stack, Systems & Cloud",
  },
  {
    id: "Product & Management",
    desc: "PM, Strategy, Growth & Technical Program",
  },
  {
    id: "Data Science & ML",
    desc: "ML Engineering, AI Research & Analytics",
  },
  {
    id: "Research & Academia",
    desc: "PhD, Labs, Publications & Fellowships",
  },
  {
    id: "Finance & Consulting",
    desc: "IB, Private Equity, Quant & MBB",
  },
  {
    id: "Design & Frontend",
    desc: "UX Engineering, Design Systems & Web UI",
  },
] as const;

const LATEX_TEMPLATE_OPTIONS = [
  {
    id: "jakes",
    name: "Engineering Classic (Jake's)",
    badge: "Default",
    desc: "ATS-proven single-column CS & SWE resume layout",
  },
  {
    id: "executive",
    name: "Executive / Product Leadership",
    badge: "Leadership",
    desc: "Crisp 10pt layout tuned for PM & senior roles",
  },
  {
    id: "modern-accent",
    name: "Modern Tech Slate",
    badge: "Modern",
    desc: "Subtle indigo accent rules & clean typography",
  },
  {
    id: "academic",
    name: "Research & Data Science CV",
    badge: "Academic",
    desc: "Highlights education, publications & ML projects",
  },
  {
    id: "minimalist-clean",
    name: "Finance & Consulting",
    badge: "Wall Street",
    desc: "Traditional tabular structure for finance & MBB",
  },
  {
    id: "compact-density",
    name: "High-Density Full-Stack 1-Pager",
    badge: "Compact",
    desc: "Tight margins & dense skills for packed resumes",
  },
] as const;

const QUICK_CITIES = [
  "Dehradun, Uttarakhand, India",
  "Bengaluru, Karnataka, India",
  "Delhi NCR, India",
  "Mumbai, Maharashtra, India",
  "San Francisco, CA, USA",
  "London, UK",
];

function cleanGithubUsername(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .split("/")[0]
    .trim();
}

const emptySubscribe = () => () => {};

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Personal Location & Work Preference State
  const [homeLocation, setHomeLocation] = useState("");
  const [workPreference, setWorkPreference] = useState("flexible");

  // Career Identity & Studio Defaults State
  const [githubUsername, setGithubUsername] = useState("");
  const [targetTrack, setTargetTrack] = useState<string>("Software Engineering");
  const [preferredLatexTemplate, setPreferredLatexTemplate] = useState<string>("jakes");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      // Yield a microtask so storage hydration stays asynchronous to the effect body
      await Promise.resolve();
      if (cancelled) return;

      const savedLoc =
        localStorage.getItem("userHomeLocation") ||
        sessionStorage.getItem("userHomeLocation") ||
        "";
      const savedPref =
        localStorage.getItem("userWorkPreference") ||
        sessionStorage.getItem("userWorkPreference") ||
        "flexible";
      const savedGithub =
        localStorage.getItem("userGithubUsername") ||
        sessionStorage.getItem("userGithubUsername") ||
        "";
      const savedTrack =
        localStorage.getItem("userTargetTrack") ||
        sessionStorage.getItem("userTargetTrack") ||
        "Software Engineering";
      const savedTemplate =
        localStorage.getItem("userPreferredLatexTemplate") ||
        sessionStorage.getItem("userPreferredLatexTemplate") ||
        "jakes";

      if (savedLoc) setHomeLocation(savedLoc);
      if (savedPref) setWorkPreference(savedPref);
      if (savedGithub) setGithubUsername(savedGithub);
      if (savedTrack) setTargetTrack(savedTrack);
      if (savedTemplate) setPreferredLatexTemplate(savedTemplate);

      if (!user) return;

      try {
        const settingsRef = doc(db, "users", user.uid, "data", "settings");
        const snap = await getDoc(settingsRef);
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          if (data?.homeLocation) {
            setHomeLocation(data.homeLocation);
            localStorage.setItem("userHomeLocation", data.homeLocation);
            sessionStorage.setItem("userHomeLocation", data.homeLocation);
          }
          if (data?.workPreference) {
            setWorkPreference(data.workPreference);
            localStorage.setItem("userWorkPreference", data.workPreference);
            sessionStorage.setItem("userWorkPreference", data.workPreference);
          }
          if (data?.githubUsername) {
            setGithubUsername(data.githubUsername);
            localStorage.setItem("userGithubUsername", data.githubUsername);
            sessionStorage.setItem("userGithubUsername", data.githubUsername);
          }
          if (data?.targetTrack) {
            setTargetTrack(data.targetTrack);
            localStorage.setItem("userTargetTrack", data.targetTrack);
            sessionStorage.setItem("userTargetTrack", data.targetTrack);
          }
          if (data?.preferredLatexTemplate) {
            setPreferredLatexTemplate(data.preferredLatexTemplate);
            localStorage.setItem("userPreferredLatexTemplate", data.preferredLatexTemplate);
            sessionStorage.setItem("userPreferredLatexTemplate", data.preferredLatexTemplate);
          }
        }
      } catch (err) {
        console.warn("Could not load user settings from Firestore:", err);
      }
    };

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    const trimmedLoc = homeLocation.trim();
    const cleanedGithub = cleanGithubUsername(githubUsername);
    setGithubUsername(cleanedGithub);

    // Persist in client storage
    if (typeof window !== "undefined") {
      localStorage.setItem("userHomeLocation", trimmedLoc);
      sessionStorage.setItem("userHomeLocation", trimmedLoc);

      localStorage.setItem("userWorkPreference", workPreference);
      sessionStorage.setItem("userWorkPreference", workPreference);

      if (cleanedGithub) {
        localStorage.setItem("userGithubUsername", cleanedGithub);
        sessionStorage.setItem("userGithubUsername", cleanedGithub);
      } else {
        localStorage.removeItem("userGithubUsername");
        sessionStorage.removeItem("userGithubUsername");
      }

      localStorage.setItem("userTargetTrack", targetTrack);
      sessionStorage.setItem("userTargetTrack", targetTrack);

      localStorage.setItem("userPreferredLatexTemplate", preferredLatexTemplate);
      sessionStorage.setItem("userPreferredLatexTemplate", preferredLatexTemplate);
    }

    // Persist to Firestore if logged in
    let cloudSyncFailed = false;
    if (user) {
      try {
        const payload = {
          homeLocation: trimmedLoc,
          workPreference,
          githubUsername: cleanedGithub,
          targetTrack,
          preferredLatexTemplate,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "users", user.uid, "data", "settings"), payload, { merge: true });
        await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      } catch (err) {
        console.error("Failed to save settings in Firestore:", err);
        cloudSyncFailed = true;
      }
    }

    setIsSaving(false);
    if (cloudSyncFailed) {
      setSaveError("Saved locally, but cloud sync failed. Please try saving again.");
      return;
    }

    setSaveSuccess(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSaveSuccess(false), 4000);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Confirmation Toast */}
      {saveSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white px-4 py-3 text-sm font-medium shadow-lg border border-emerald-500/40"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences saved across ATS Analysis, Enhancer &amp; LaTeX Studio!</span>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your home location, career identity, default Overleaf LaTeX template, and account theme.
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-8">
        {/* Section 1: Location & Commute Preferences */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Personal Location &amp; Commute Radar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Powers AI distance calculation, relocation advisory, and commute viability against target job postings.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5" />
              Active on ATS Analysis
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="home-location-input"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2"
              >
                Your Current City / Home Base Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="home-location-input"
                  type="text"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                  placeholder="e.g. Dehradun, Uttarakhand, India or Bengaluru, Karnataka"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Enter your residential city. The AI will calculate accurate travel distance and identify whether an on-site JD requires relocation.
              </p>
            </div>

            {/* Quick 1-click popular locations */}
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Quick Suggestions
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_CITIES.map((city) => (
                  <button
                    type="button"
                    key={city}
                    onClick={() => setHomeLocation(city)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      homeLocation === city
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/50 hover:bg-muted border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Arrangement Preference */}
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Work Arrangement Preference
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: "flexible", label: "Flexible / Open to All", desc: "Remote, Hybrid, or On-Site" },
                  { id: "relocation", label: "Open to Relocate", desc: "Domestic or International" },
                  { id: "hybrid", label: "Local / Hybrid Only", desc: "Manageable daily commute" },
                  { id: "remote", label: "Remote Only", desc: "Zero commute required" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setWorkPreference(opt.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      workPreference === opt.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-border/80 bg-background/50 text-foreground"
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Career Identity & Studio Defaults */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Career Identity &amp; Studio Defaults
                </h2>
                <p className="text-xs text-muted-foreground">
                  Personalizes AI bullet tone, GitHub repository imports, Career Kit prep, and your default Overleaf LaTeX template.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 self-start sm:self-auto">
              <Compass className="w-3.5 h-3.5" />
              Synced to Studio
            </span>
          </div>

          <div className="space-y-6">
            {/* GitHub Handle / Portfolio Username */}
            <div>
              <label
                htmlFor="github-username-input"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2"
              >
                GitHub Handle / Portfolio Username
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="github-username-input"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. octocat or https://github.com/octocat"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Pre-fills the GitHub Sync generator in AI Bullet Rewriter and LaTeX Studio so you can convert repos into Google XYZ bullets in 1 click.
              </p>
            </div>

            {/* Target Industry / Track */}
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Target Industry / Track
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {TARGET_TRACKS.map((track) => (
                  <button
                    type="button"
                    key={track.id}
                    onClick={() => setTargetTrack(track.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      targetTrack === track.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 bg-background/50 text-foreground"
                    }`}
                  >
                    <span className="text-xs font-semibold flex items-center justify-between gap-2">
                      {track.id}
                      {targetTrack === track.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{track.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Overleaf LaTeX Template */}
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FileCode2 className="w-3.5 h-3.5 text-primary" />
                Default Overleaf LaTeX Template
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {LATEX_TEMPLATE_OPTIONS.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => setPreferredLatexTemplate(tpl.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      preferredLatexTemplate === tpl.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 bg-background/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs font-semibold truncate">{tpl.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {tpl.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Save CTA */}
          {saveError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {saveError}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/70">
            <p className="text-xs text-muted-foreground">
              Saves location, work preference, GitHub handle, target track, and default LaTeX template together.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Preferences...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Account Information */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-md border border-border">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.email || "No email linked"}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Account Security
                </label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-md border border-border">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Verified Account</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out of All Devices
            </button>
          </div>
        </div>

        {/* App Theme Preferences */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" /> App Preferences
            </h2>

            <div>
              <label className="text-sm font-medium mb-3 block">Application Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs font-semibold">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs font-semibold">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    theme === "system"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Laptop className="w-5 h-5" />
                  <span className="text-xs font-semibold">System</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
