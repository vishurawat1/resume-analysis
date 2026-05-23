"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFileSelect: (file: File | null) => void;
  isLoading?: boolean;
}

export function Dropzone({ onFileSelect, isLoading }: DropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 15, 95));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isLoading,
  });

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening file dialog
    setSelectedFile(null);
    onFileSelect(null);
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/10 hover:bg-muted/30 hover:border-primary/50",
            isDragReject && "border-destructive bg-destructive/5",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} aria-label="Upload resume" />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className={cn(
              "p-4 rounded-full mb-4 transition-colors",
              isDragActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              isDragReject && "bg-destructive/10 text-destructive"
            )}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="mb-2 text-sm font-semibold">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PDF or DOCX (MAX. 5MB)</p>
            {isDragReject && <p className="text-xs text-destructive mt-2">Unsupported file type</p>}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col p-5 border border-border/50 rounded-xl bg-card/80 backdrop-blur-md shadow-sm gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0 transition-colors", isLoading ? "bg-primary/20 text-primary animate-pulse" : "bg-green-500/10 text-green-500")}>
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isLoading ? "Parsing document..." : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFile}
                  disabled={isLoading}
                  className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-primary rounded-full"
                  transition={{ ease: "easeInOut", duration: 0.5 }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
