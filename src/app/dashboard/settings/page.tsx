/* eslint-disable react-hooks/set-state-in-effect */
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
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Personal Location State
  const [homeLocation, setHomeLocation] = useState("");
  const [workPreference, setWorkPreference] = useState("flexible");
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initial load from local/session storage
    const savedLoc =
      (typeof window !== "undefined" ? localStorage.getItem("userHomeLocation") : null) ||
      (typeof window !== "undefined" ? sessionStorage.getItem("userHomeLocation") : null) ||
      "";
    const savedPref =
      (typeof window !== "undefined" ? localStorage.getItem("userWorkPreference") : null) ||
      "flexible";

    if (savedLoc) setHomeLocation(savedLoc);
    if (savedPref) setWorkPreference(savedPref);

    // Load from Firestore if user is authenticated
    if (user) {
      const loadUserSettings = async () => {
        try {
          const settingsRef = doc(db, "users", user.uid, "data", "settings");
          const snap = await getDoc(settingsRef);
          if (snap.exists()) {
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
          }
        } catch (err) {
          console.warn("Could not load user settings from Firestore:", err);
        }
      };
      loadUserSettings();
    }
  }, [user]);

  const handleSaveLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLocation(true);
    setSaveSuccess(false);

    const trimmedLoc = homeLocation.trim();

    // Persist in client storage
    if (typeof window !== "undefined") {
      localStorage.setItem("userHomeLocation", trimmedLoc);
      sessionStorage.setItem("userHomeLocation", trimmedLoc);
      localStorage.setItem("userWorkPreference", workPreference);
      sessionStorage.setItem("userWorkPreference", workPreference);
    }

    // Persist to Firestore if logged in
    if (user) {
      try {
        const settingsRef = doc(db, "users", user.uid, "data", "settings");
        await setDoc(
          settingsRef,
          {
            homeLocation: trimmedLoc,
            workPreference,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Also merge top-level user doc for convenience
        await setDoc(
          doc(db, "users", user.uid),
          {
            homeLocation: trimmedLoc,
            workPreference,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to save location in Firestore:", err);
      }
    }

    setIsSavingLocation(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const quickCities = [
    "Dehradun, Uttarakhand, India",
    "Bengaluru, Karnataka, India",
    "Delhi NCR, India",
    "Mumbai, Maharashtra, India",
    "San Francisco, CA, USA",
    "London, UK",
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal location, commute preferences, account details, and app theme.
        </p>
      </div>

      {/* Primary Section: Location & Commute Preferences */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Personal Location & Commute Radar</h2>
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

        <form onSubmit={handleSaveLocation} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Your Current City / Home Base Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="e.g. Dehradun, Uttarakhand, India or Bengaluru, Karnataka"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-medium"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Enter your residential city. The AI will calculate accurate road/air travel distance and identify whether an on-site JD requires relocation.
            </p>
          </div>

          {/* Quick 1-click popular locations */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {quickCities.map((city) => (
                <button
                  type="button"
                  key={city}
                  onClick={() => setHomeLocation(city)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
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
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Work Arrangement Preference
            </label>
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
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingLocation}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
            >
              {isSavingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Save Location Preferences
                </>
              )}
            </button>

            {saveSuccess && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Updated! Your ATS analysis will now prioritize this location.
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Account Information */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-md border border-border">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.email || "No email linked"}</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Account Security</label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-md border border-border">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Verified Account</span>
                </div>
              </div>
            </div>
            
            <button
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
