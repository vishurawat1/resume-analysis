import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Resume Analyzer - Next-Gen ATS Scoring & Job Intelligence",
    template: "%s | AI Resume Analyzer",
  },
  description: "Beat automated applicant filters with Workday-grade ATS simulation, company scam protection, commute reality radar, and 1-click executive vector PDF export.",
  keywords: [
    "ATS resume scanner",
    "resume analyzer",
    "job description match",
    "applicant tracking system",
    "resume score",
    "company scam check",
    "commute radar",
    "executive resume builder"
  ],
  metadataBase: new URL("https://vr-resume-analysis.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vr-resume-analysis.vercel.app",
    title: "AI Resume Analyzer - Next-Gen ATS Scoring & Job Intelligence",
    description: "Beat automated applicant filters with Workday-grade ATS simulation, company scam protection, commute reality radar, and 1-click executive vector PDF export.",
    siteName: "AI Resume Analyzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Analyzer - Next-Gen ATS Scoring & Job Intelligence",
    description: "Beat automated applicant filters with Workday-grade ATS simulation, company scam protection, commute reality radar, and 1-click executive vector PDF export.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} h-full antialiased`}>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app') && window.location.hostname !== 'vr-resume-analysis.vercel.app') {
                window.location.replace('https://vr-resume-analysis.vercel.app' + window.location.pathname + window.location.search);
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col relative bg-background selection:bg-primary/20">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
