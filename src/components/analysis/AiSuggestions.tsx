"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function AiSuggestions({ suggestions }: { suggestions: { section: string; current: string; suggested: string }[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-semibold text-lg text-foreground">AI Enhancement Suggestions</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Line-by-line suggestions to make your bullet points more impactful and metrics-driven.
      </p>
      
      <div className="space-y-4 mt-4">
        {suggestions.map((sug, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {sug.section}
            </div>
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="p-3 bg-muted/50 rounded-md border border-border text-sm text-muted-foreground line-through decoration-destructive/50">
                {sug.current}
              </div>
              <div className="flex justify-center rotate-90 md:rotate-0">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="p-3 bg-primary/5 rounded-md border border-primary/20 text-sm font-medium text-foreground relative">
                <div className="absolute -top-2 -right-2 p-1 bg-primary text-primary-foreground rounded-full">
                  <Sparkles className="h-3 w-3" />
                </div>
                {sug.suggested}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
