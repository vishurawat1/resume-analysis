"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, Copy, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedOption {
  text: string;
  reasoning: string;
}

const TONES = [
  "Professional and Impact-Driven",
  "Metrics and Data Focused",
  "Action-Oriented and Concise",
  "Leadership and Initiative",
  "Technical Depth and Problem Solving"
];

export default function EnhancerPage() {
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<EnhancedOption[] | null>(null);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleEnhance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setIsLoading(true);
    setError("");
    setOptions(null);

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, role, tone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to enhance bullet point");
      }

      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options);
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wand2 className="w-8 h-8 text-primary" /> Bullet Point Enhancer
        </h1>
        <p className="text-muted-foreground mt-1">Transform weak bullet points into impactful, ATS-optimized achievements.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-5 space-y-6"
        >
          <form onSubmit={handleEnhance} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Draft Bullet Point</label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Fixed a bug that made the app slow."
                className="w-full h-32 p-3 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Role (Optional)</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Helps the AI tailor the vocabulary.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Desired Tone & Focus</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      tone === t 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Enhancements
                </>
              )}
            </button>
            
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-7"
        >
          {isLoading ? (
            <div className="h-full min-h-[400px] bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Applying career coaching magic...</p>
            </div>
          ) : options ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Suggestions
              </h3>
              {options.map((opt, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors group relative"
                >
                  <div className="pr-12">
                    <p className="text-foreground leading-relaxed">
                      <span className="text-primary font-bold mr-2">•</span>
                      {opt.text}
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md border border-border/50">
                      <span className="font-semibold block mb-1">Why this works:</span>
                      {opt.reasoning}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(opt.text, idx)}
                    className="absolute top-5 right-5 p-2 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-card/50 border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Waiting for input</h3>
              <p className="text-sm max-w-sm">Paste a bullet point on the left and hit generate to see 3 highly-optimized variations.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
