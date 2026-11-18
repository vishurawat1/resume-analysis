"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Sparkles, ShieldCheck, MapPin, FileCheck2, Building2 } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ElementType;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Why do 75% of qualified resumes get rejected before a human sees them?",
    answer: "Applicant Tracking Systems (like Workday, Greenhouse, Taleo, and Lever) use algorithmic parsing to match candidate resumes against job requisitions. If your resume uses incompatible fonts, multi-column tables, or misses crucial semantic keywords and action metrics, the ATS assigns a low compatibility score—silently archiving your application without recruiter review.",
    icon: FileCheck2,
    tag: "ATS Algorithms",
  },
  {
    question: "How does the Company Legitimacy & Scam Shield work?",
    answer: "Our engine cross-references the employer's name, corporate footprint, public domain records, and job description syntax. It checks for telltale green flags (standard benefits, structured duties, verifiable presence) and warns you against red flags (phantom listings, generic unverified mailboxes, pay-to-work schemes, or unrealistic compensation promises).",
    icon: Building2,
    tag: "Scam Detection",
  },
  {
    question: "What happens if a job has an absurd location like 'Space' or is 2,000 km away?",
    answer: "Our Commute & Location Radar calculates geographic proximity between your location and the target workplace. If you apply for a distant role, it flags domestic or cross-border relocation requirements. If someone writes 'Space', 'Mars', or an impossible location, our AI delivers a witty reality check while advising on true remote feasibility!",
    icon: MapPin,
    tag: "Commute Radar",
  },
  {
    question: "What makes the downloaded Executive PDF better than generic resume builders?",
    answer: "Most web builders render HTML-to-image PDFs that ATS parsers cannot read. Our engine generates pure vector PDF documents powered by standard PostScript fonts (Helvetica), strict linear document flow, zero nested table columns, and clickable contact hyperlinks—guaranteeing 100% OCR and text extractability across all ATS platforms.",
    icon: Sparkles,
    tag: "Vector PDF",
  },
  {
    question: "Is my personal information and resume text kept private?",
    answer: "Yes, completely. Your uploaded resume is analyzed securely and processed in memory for your session. We do not sell your personal data, scrape your contacts, or train public AI models on your private documents. You have total autonomy to delete your data at any time.",
    icon: ShieldCheck,
    tag: "Privacy & Security",
  },
  {
    question: "Can I customize the AI suggestions before downloading the final resume?",
    answer: "Absolutely. Our Interactive AI Improvement Studio gives you full control with 1-click Accept or Dismiss options for each suggestion. You can inspect the exact 'Why' reasoning, see the impact categorization (High/Medium), and review before exporting your finalized executive PDF.",
    icon: HelpCircle,
    tag: "User Control",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-muted/20 border-t border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
            Everything you need to know about AI Resume Analyzer
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Clear answers on how our algorithms score resumes, detect scams, assess commutes, and optimize your job applications.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const Icon = faq.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-card border-primary/40 shadow-md"
                    : "bg-card/70 border-border hover:border-border/80 hover:bg-card"
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-xl shrink-0 border ${
                      isOpen ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-foreground text-sm sm:text-base">
                      {faq.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {faq.tag}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
