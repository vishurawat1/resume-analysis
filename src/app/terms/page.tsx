import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and fair-use guidelines for AI Resume Analyzer.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>

        <header className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <FileText className="h-4 w-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: November 25, 2026
          </p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Service Scope &amp; AI Advisory Disclaimer</h2>
            <p className="text-muted-foreground">
              AI Resume Analyzer provides automated ATS scoring heuristics, LaTeX formatting, cover letter drafts, company risk signals, and interview preparation prompts. Outputs are advisory tools to assist job seekers and do not guarantee employment, interview offers, or compensation outcomes. Always verify accuracy before submitting applications.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Fair Use &amp; Abuse Prevention</h2>
            <p className="text-muted-foreground">
              Accounts are intended for individual use. Automated scraping, credential sharing, bypassing monthly credit meters, attempting SSRF probes via URL import, or submitting restricted LaTeX shell primitives (`\write18`) is strictly prohibited and may result in rate limiting or suspension.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Subscriptions, Credits &amp; Cancellation</h2>
            <p className="text-muted-foreground">
              Monthly AI credits reset automatically at the start of each UTC calendar month and do not roll over. Paid subscriptions may be cancelled prior to renewal to avoid future charges.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Ownership of Your Content</h2>
            <p className="text-muted-foreground">
              You retain 100% ownership of all resumes, LaTeX source files, cover letters, and PDFs you create or export using AI Resume Analyzer.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
