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
              Your authentication is managed by Firebase Authentication. All saved resumes, target job descriptions, LaTeX documents, preferences, and billing usage records are stored in Firebase Cloud Firestore under strict owner-only rules tied to your unique user ID (`users/&#123;uid&#125;`). Browser storage keys are also scoped by UID and automatically cleared on sign-out or account switching.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. AI Processing &amp; LaTeX Compilation</h2>
            <p className="text-muted-foreground">
              When you run an ATS scan, Career Kit generation, or bullet rewrite, only the text required for that request is transmitted to our configured AI inference providers (Google Gemini, Groq, OpenAI) via encrypted TLS connections. When compiling LaTeX resumes to PDF, your `.tex` source is sent to stateless TeX Live compilers (`ytotech` / `texlive.net`) solely to return the rendered PDF binary.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Caching &amp; Performance</h2>
            <p className="text-muted-foreground">
              To avoid burning duplicate inference credits, identical prompts may be cached by cryptographic SHA-256 hash without exposing directory listings or personal email identifiers.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Payments &amp; Billing</h2>
            <p className="text-muted-foreground">
              When paid upgrades are activated via Stripe Checkout, card details are handled exclusively by Stripe&apos;s PCI-DSS compliant checkout interface. AI Resume Analyzer stores only plan entitlement metadata and monthly credit counters.
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
