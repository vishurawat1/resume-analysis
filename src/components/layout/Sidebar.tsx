"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UploadCloud, 
  BarChart3, 
  Settings, 
  X, 
  Sparkles, 
  Wand2,
  FileCode2,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  highlight?: boolean;
  badge?: string;
}

const navigation: NavItem[] = [
  { 
    name: "Scan New Resume", 
    href: "/dashboard/upload", 
    icon: UploadCloud,
    description: "Target job match & analysis",
    highlight: true,
  },
  { 
    name: "LaTeX Studio (Overleaf)", 
    href: "/dashboard/editor", 
    icon: FileCode2,
    description: "Compile .tex to exact Overleaf PDF",
    badge: "TeX",
  },
  { 
    name: "ATS Score & Report", 
    href: "/dashboard/analysis", 
    icon: BarChart3,
    description: "Scores, commute & scam radar",
  },
  { 
    name: "Resume Health Audit", 
    href: "/dashboard/review", 
    icon: Sparkles,
    description: "Overall strengths & weaknesses",
  },
  { 
    name: "AI Bullet Rewriter", 
    href: "/dashboard/enhancer", 
    icon: Wand2,
    description: "Turn duties into achievements",
  },
  { 
    name: "Dashboard Home", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    description: "Saved scans & recent history",
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col print:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close header */}
        <div className="flex h-16 items-center justify-between px-4 md:hidden border-b border-border">
          <span className="font-semibold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-3">
            Core Tools
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate leading-tight">
                      {item.name}
                    </span>
                    {item.highlight && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    {item.badge && !isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-tight">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] truncate leading-tight mt-0.5",
                    isActive ? "text-primary-foreground/80 font-normal" : "text-muted-foreground/80"
                  )}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings & Plans footer */}
        <div className="p-3 border-t border-border space-y-1.5">
          <Link
            href="/pricing"
            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
            onClick={() => {
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
          >
            <Crown className="h-4 w-4 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold">Plans &amp; Upgrades</span>
              <span className="text-[10px] text-primary/80">100–500 AI credits / mo</span>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
              pathname === "/dashboard/settings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className={cn(
              "h-4 w-4 transition-colors",
              pathname === "/dashboard/settings"
                ? "text-primary-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            )} />
            <div className="flex flex-col">
              <span className="font-semibold">Account Settings</span>
              <span className={cn(
                "text-[10px]",
                pathname === "/dashboard/settings" ? "text-primary-foreground/80" : "text-muted-foreground/80"
              )}>
                Profile & preferences
              </span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
