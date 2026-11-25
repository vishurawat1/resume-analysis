import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "How AI Resume Analyzer collects, processes, and protects candidate data.",
};

export default function PrivacyPage() {
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
            <ShieldCheck className="h-4 w-4" />
            <span>Trust &amp; Privacy</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: November 25, 2026
          </p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Account &amp; Data Isolation</h2>
            <p className="text-muted-foreground">
              All saved resumes, target job descriptions, LaTeX source files, preferences, and monthly usage counters are stored in an encrypted cloud database protected by strict owner-only access controls tied to your authenticated account ID. Browser session storage is also scoped per account and cleared automatically on sign-out or account switching.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. AI Processing &amp; Document Compilation</h2>
            <p className="text-muted-foreground">
              When you run an ATS scan, Career Kit generation, or bullet rewrite, only the text required for that request is transmitted over TLS to our inference providers. When compiling LaTeX resumes to PDF, your document source is processed statelessly solely to return your rendered PDF binary.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Caching &amp; Performance</h2>
            <p className="text-muted-foreground">
              To avoid consuming duplicate monthly credits, identical analysis prompts may be matched via one-way cryptographic hashes without directory listing or exposing personal email identifiers.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Payments &amp; Billing</h2>
            <p className="text-muted-foreground">
              Paid subscription checkouts are processed through a PCI-DSS compliant third-party payment gateway. AI Resume Analyzer stores only plan tier status and monthly credit balances—never raw credit card details.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">5. Your Controls</h2>
            <p className="text-muted-foreground">
              You may replace or overwrite your stored resume and preferences at any time inside the Dashboard and Settings pages.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
