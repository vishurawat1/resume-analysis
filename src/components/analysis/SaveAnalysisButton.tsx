"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveAnalysisButtonProps {
  resumeText: string;
  atsScore: number;
}

export function SaveAnalysisButton({ resumeText, atsScore }: SaveAnalysisButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSave = async () => {
    if (!resumeText) return;
    
    setIsSaving(true);
    setError("");

    try {
      if (!user) throw new Error("You must be logged in to save.");
      
      await setDoc(doc(db, "users", user.uid, "data", "resume"), {
        atsScore: atsScore,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsSaved(true);
      
      // Reset the success state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSave}
        disabled={isSaving || isSaved}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          isSaved 
            ? "bg-green-500 text-white cursor-default" 
            : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSaved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save Results"}
      </button>
      
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
