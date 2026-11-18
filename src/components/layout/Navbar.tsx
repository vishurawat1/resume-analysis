/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import Image from "next/image";
import { User, Bell, Menu, LogOut, Sun, Moon, CheckCircle2, UploadCloud, FileEdit } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/50 bg-background/60 backdrop-blur-xl px-4 md:px-6 shadow-xs print:hidden">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-black text-xs tracking-tighter">
            AR
          </div>
          <span className="hidden sm:inline-block font-bold text-sm tracking-tight text-foreground">
            AI Resume Analyzer
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <Link
          href="/dashboard/editor"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-xs cursor-pointer"
        >
          <FileEdit className="w-3.5 h-3.5 text-primary" />
          <span>Resume Studio</span>
        </Link>

        <Link
          href="/dashboard/upload"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>New Scan</span>
        </Link>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in fade-in zoom-in duration-200">
              <h3 className="font-semibold text-xs mb-3 pb-2 border-b border-border flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Notifications
              </h3>
              <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="w-6 h-6 text-primary/50" />
                <p className="text-xs">You&apos;re all caught up!</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2.5 bg-muted/50 px-3 py-1 rounded-full border border-border">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-foreground">{user?.displayName || "User"}</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
          </div>
          {user?.photoURL ? (
            <div className="relative h-7 w-7 rounded-full overflow-hidden border border-border">
              <Image src={user.photoURL} alt="Profile" fill className="object-cover" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        
        <button 
          onClick={() => signOut()}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
