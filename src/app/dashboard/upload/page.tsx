"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dropzone } from "@/components/ui/Dropzone";
import { Building, MapPin, Search, FileText, AlertCircle, Loader2, FileEdit } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setExtractedText("");
    setParseError("");

    if (!selectedFile) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse document");
      }

      setExtractedText(data.text);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to parse document";
      setParseError(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground mt-1">Submit your resume and job description to get instant AI analysis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
              Your Resume
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Upload your latest resume in PDF or DOCX format.</p>
            <Dropzone onFileSelect={handleFileSelect} isLoading={isParsing} />
          </div>

          {/* Extracted Text Preview */}
          {(extractedText || parseError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm"
            >
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" />
                Parsed Content Preview
              </h3>
              
              {parseError ? (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{parseError}</p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-muted/50 border border-border">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono h-48 overflow-y-auto">
                    {extractedText}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 h-fit"
        >
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
              Target Job Description
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Paste the job description you are targeting.</p>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Job Title (e.g. Senior Software Engineer)"
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company (e.g. Google, Stripe, or Startup)"
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. Remote, San Francisco, Space)"
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-48 p-4 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4"
      >
        <button
          type="button"
          disabled={!file || !extractedText || isParsing || isSaving}
          onClick={() => {
            if (extractedText) {
              sessionStorage.setItem("resumeText", extractedText);
              sessionStorage.setItem("jobDescription", jobDescription);
              sessionStorage.setItem("fileName", file?.name || "resume.pdf");
              sessionStorage.setItem("jobTitle", jobTitle);
              sessionStorage.setItem("company", company);
              sessionStorage.setItem("location", location);
            }
            router.push("/dashboard/editor");
          }}
          className={cn(
            "w-full sm:w-auto px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-muted shadow-xs",
            (!file || !extractedText) && "opacity-60 cursor-not-allowed"
          )}
        >
          <FileEdit className="w-4 h-4 text-primary" />
          <span>Open in Resume Studio</span>
        </button>

        <button
          disabled={!file || !extractedText || jobDescription.length <= 10 || isSaving}
          className={cn(
            "w-full sm:w-auto rounded-xl px-8 py-3 text-sm font-semibold transition-all flex items-center justify-center min-w-[160px] cursor-pointer",
            file && extractedText && jobDescription.length > 10
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
          )}
          onClick={async () => {
            if (!user) {
              alert("You must be logged in to save your resume.");
              return;
            }
            try {
              setIsSaving(true);
              await setDoc(doc(db, "users", user.uid, "data", "resume"), {
                text: extractedText,
                fileName: file?.name || "resume.pdf",
                jobDescription,
                jobTitle,
                company,
                location,
                updatedAt: new Date().toISOString()
              });
              
              // Also keep it in sessionStorage for backward compatibility/immediate synchronous access
              sessionStorage.setItem("resumeText", extractedText);
              sessionStorage.setItem("jobDescription", jobDescription);
              sessionStorage.setItem("fileName", file?.name || "resume.pdf");
              sessionStorage.setItem("jobTitle", jobTitle);
              sessionStorage.setItem("company", company);
              sessionStorage.setItem("location", location);
              
              router.push("/dashboard/analysis");
            } catch (err) {
              console.error("Failed to save to Firestore", err);
              alert("Failed to save resume. Please try again.");
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Resume"}
        </button>
      </motion.div>
    </div>
  );
}
