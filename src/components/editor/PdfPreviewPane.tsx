"use client";

import React, { useId, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCode2,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import { TexInsights } from "@/lib/latexTemplates";

export interface CompileErrorInfo {
  message: string;
  line: number | null;
  log: string;
}

interface PdfPreviewPaneProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  compileError: CompileErrorInfo | null;
  lastCompiledAt: string | null;
  compilerBackend: string | null;
  compileDurationMs: number | null;
  onRecompile: () => void;
  onDownloadPdf: () => void;
  onJumpToLine: (line: number) => void;
  onAiFixError: () => void;
  isFixingError: boolean;
  activeDocName?: string;
  texInsights?: TexInsights;
}

export function PdfPreviewPane({
  pdfUrl,
  isCompiling,
  compileError,
  lastCompiledAt,
  compilerBackend,
  compileDurationMs,
  onRecompile,
  onDownloadPdf,
  onJumpToLine,
  onAiFixError,
  isFixingError,
  activeDocName = "main.tex",
  texInsights,
}: PdfPreviewPaneProps) {
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const logDrawerId = useId();
  const warningCount = texInsights?.missingEscapeWarnings.length ?? 0;
  const firstWarning = texInsights?.missingEscapeWarnings[0];

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-neutral-200 dark:bg-neutral-900 relative">
      {/* ── Overleaf PDF Pane Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isCompiling ? (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="truncate">Compiling {activeDocName}...</span>
            </span>
          ) : compileError ? (
            <span
              role="alert"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive min-w-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Compile Error{compileError.line ? ` (Line ${compileError.line})` : ""}
              </span>
            </span>
          ) : pdfUrl ? (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-w-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate font-semibold text-foreground">
                PDF Ready
              </span>
              {compileDurationMs !== null && (
                <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border">
                  {(compileDurationMs / 1000).toFixed(2)}s
                  {compilerBackend === "memory-cache" ? " (cached)" : ""}
                </span>
              )}
              {lastCompiledAt && (
                <span className="hidden xl:inline text-[11px] text-muted-foreground">
                  · {lastCompiledAt}
                </span>
              )}
            </span>
          ) : (
            <span role="status" className="text-xs text-muted-foreground">
              Waiting to compile...
            </span>
          )}

          {/* Live Document Metrics Pill */}
          {texInsights && (
            <span
              aria-label={`Document metrics: ${texInsights.wordCount} words, ${texInsights.bulletCount} bullets, ${texInsights.sectionCount} sections, estimated ${texInsights.estimatedPages} pages`}
              className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border shrink-0 ${
                texInsights.estimatedPages > 1.2 && activeDocName === "main.tex"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : "bg-muted/70 text-muted-foreground border-border"
              }`}
              title={`${texInsights.wordCount} words · ${texInsights.bulletCount} bullets · ${texInsights.sectionCount} sections · Est. ${texInsights.estimatedPages} page(s)`}
            >
              <span>{texInsights.wordCount}w</span>
              <span aria-hidden="true">·</span>
              <span>~{texInsights.estimatedPages}p</span>
            </span>
          )}

          {warningCount > 0 && firstWarning && (
            <button
              type="button"
              onClick={() => onJumpToLine(firstWarning.line)}
              title={`Possible unescaped "${firstWarning.char}" on line ${firstWarning.line}. Click to jump.`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer transition-colors shrink-0"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>
                {warningCount} unescaped {firstWarning.char} (L{firstWarning.line})
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {compileError?.log && (
            <button
              type="button"
              aria-expanded={showLogDrawer}
              aria-controls={logDrawerId}
              onClick={() => setShowLogDrawer((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                showLogDrawer
                  ? "bg-destructive/15 text-destructive border-destructive/40"
                  : "bg-background hover:bg-muted text-foreground border-border"
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Logs</span>
            </button>
          )}

          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open compiled ${activeDocName} PDF in new browser tab`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background hover:bg-muted text-foreground border border-border transition-colors"
                title="Open compiled PDF in a full browser tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Open PDF</span>
              </a>
              <button
                type="button"
                onClick={onDownloadPdf}
                aria-label={`Download compiled ${activeDocName} PDF`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3 h-3" />
                <span>Download PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Overleaf-Style Compilation Error Banner ── */}
      {compileError && (
        <div
          role="alert"
          className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 text-xs space-y-2 shrink-0"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 font-bold text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>pdflatex halted cleanly with a syntax issue</span>
              </div>
              <p className="font-mono text-[11px] text-foreground break-words bg-background/70 p-2 rounded border border-destructive/20">
                {compileError.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {compileError.line !== null && (
                <button
                  type="button"
                  onClick={() => onJumpToLine(compileError.line!)}
                  className="px-2.5 py-1 rounded-lg bg-background border border-border hover:bg-muted text-[11px] font-bold text-foreground cursor-pointer transition-colors"
                >
                  Jump to Line {compileError.line}
                </button>
              )}

              <button
                type="button"
                onClick={onAiFixError}
                disabled={isFixingError}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isFixingError ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI Fixing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>1-Click AI Fix Syntax</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showLogDrawer && compileError.log && (
            <div
              id={logDrawerId}
              className="mt-2 rounded-lg bg-neutral-950 text-neutral-200 border border-neutral-800 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <span>Raw TeX Live Compiler Output</span>
                <button
                  type="button"
                  onClick={() => setShowLogDrawer(false)}
                  aria-label="Close log drawer"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono max-h-48 overflow-auto latex-scroller whitespace-pre-wrap leading-relaxed">
                {compileError.log}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Compiled Vector PDF Viewport ── */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        {isCompiling && !pdfUrl && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-neutral-100 dark:bg-neutral-950">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Compiling Overleaf LaTeX Output...
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Running TeX Live pdfLaTeX engine on {activeDocName} to build an authentic ATS vector PDF.
              </p>
            </div>
          </div>
        )}

        {!isCompiling && !pdfUrl && !compileError && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <FileCode2 className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">
              Ready to Compile {activeDocName}
            </p>
            <button
              type="button"
              onClick={onRecompile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Compile LaTeX Now</span>
            </button>
          </div>
        )}

        {pdfUrl && (
          <div className="flex-1 min-h-0 relative flex flex-col">
            <iframe
              key={pdfUrl}
              src={`${pdfUrl}#view=FitH`}
              title={`Compiled Overleaf LaTeX PDF Preview (${activeDocName})`}
              className="w-full h-full flex-1 block border-0 bg-neutral-300 dark:bg-neutral-900"
            />

            {/* Subtle overlay while re-compiling next version */}
            {isCompiling && (
              <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-lg flex items-center gap-2 text-xs font-semibold text-foreground pointer-events-none">
                <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                <span>Recompiling...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
