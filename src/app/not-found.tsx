import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <SearchX className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
            404 — Page Not Found
          </p>
          <h1 className="text-2xl font-black tracking-tight">We couldn&apos;t find that route</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page may have moved or the URL might contain a typo. Head back home or open your resume workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <span>Open Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
