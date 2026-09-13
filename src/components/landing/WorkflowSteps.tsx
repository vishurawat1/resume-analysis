"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, ArrowRight, Layers, FileUp } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Upload Your Resume & Target Job",
    description: "Drop in your existing resume in PDF or DOCX format alongside the job description you want to target.",
    icon: FileUp,
    accent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    step: "02",
    title: "AI ATS Simulation & Gap Analysis",
    description: "Our algorithm runs your resume through simulated Workday, Greenhouse, and Lever parsers to reveal exactly what's missing.",
    icon: Sparkles,
    accent: "bg-primary/10 text-primary border-primary/20",
  },
  {
    step: "03",
    title: "Apply Instant Fixes & Fast-Track Interviews",
    description: "Incorporate targeted keyword suggestions, rewrite bullets with quantifiable metrics, and apply with 100% confidence.",
    icon: Download,
    accent: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
];

export function WorkflowSteps() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-background border-t border-border">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3">
            <Layers className="w-3.5 h-3.5" />
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            How AI Resume Analyzer transforms your job search
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            From initial document upload to an interview-ready resume in less than 60 seconds.
          </p>
        </div>

        {/* 3 Step Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-xl border ${s.accent} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-muted-foreground/30 font-mono">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-semibold text-primary">
                  <span>Step {idx + 1} of 3</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
