/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useAuth } from "@/context/AuthContext";
import { Settings, LogOut, User, Mail, ShieldCheck, Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
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
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out of All Devices
            </button>
          </div>
        </div>

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
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === "light" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs font-semibold">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === "dark" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs font-semibold">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === "system" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
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
