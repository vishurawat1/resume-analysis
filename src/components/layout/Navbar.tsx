/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import Image from "next/image";
import { User, Bell, Menu, LogOut, Sun, Moon, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/50 bg-background/60 backdrop-blur-xl px-4 md:px-6 shadow-sm print:hidden">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            A
          </div>
          <span className="hidden sm:inline-block font-semibold text-lg tracking-tight">
            AI Resume Analyzer
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in zoom-in duration-200">
              <h3 className="font-semibold text-sm mb-3 pb-2 border-b border-border flex items-center gap-2">
                <Bell className="w-4 h-4" /> Notifications
              </h3>
              <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="w-8 h-8 text-primary/50" />
                <p className="text-xs">You&apos;re all caught up!</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-foreground">{user?.displayName || "User"}</span>
            <span className="text-[10px] text-muted-foreground">{user?.email}</span>
          </div>
          {user?.photoURL ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border">
              <Image src={user.photoURL} alt="Profile" fill className="object-cover" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
        <button 
          onClick={() => signOut()}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
