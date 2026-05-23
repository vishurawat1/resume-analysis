# AI Resume Analyzer SaaS 🚀

A full-stack, AI-powered Next.js application that evaluates resumes, scores them against job descriptions, and provides interactive, ATS-friendly enhancements. The platform features a premium UI, deep visual analytics, and a custom PDF generation engine that automatically converts unstructured resumes into strict, Harvard-style ATS formats.

## 🌟 Core Features

- **Multi-Format Resume Parsing:** Upload and parse raw text from both PDF and DOCX files securely in the browser.
- **Deep ATS Analytics:** Evaluates resumes holistically and against specific job descriptions. Visualizes strengths and weaknesses using interactive Radar Charts and section breakdowns.
- **Interactive AI Improvement Engine:** Generates highly specific, metrics-driven bullet point replacements. Users can accept/reject suggestions in real-time, instantly modifying their draft.
- **Dynamic PDF Generation:** Automatically maps flat unstructured text into a strict, standardized Harvard-style ATS resume template. Exports native, text-selectable PDFs directly from the browser.
- **Intelligent Caching:** Implements a Firestore-backed AI caching layer to dramatically reduce API costs and latency when users rescan identical documents.
- **Dark Mode & Premium UI:** Built with Tailwind CSS, Framer Motion, and Recharts for a dynamic, fully responsive, and professional SaaS experience.

## 🛠️ Technology Stack

- **Frontend / Fullstack:** [Next.js 16 (App Router)](https://nextjs.org/), React 19, TypeScript
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide-React
- **Data Visualization:** Recharts (Radar, Radial, and Bar graphs)
- **Backend Services:** Firebase (Authentication & Firestore Database)
- **AI Integration:** Groq (Llama 3), with automated fallback to Gemini API for high-availability unstructured parsing.
- **Document Processing:** `pdf-parse`, `mammoth` (Docx), `@react-pdf/renderer` (PDF Export)

## 🏗️ Architecture Highlights

### The AI Pipeline
The AI layer uses an intelligent orchestration service (`src/services/aiService.ts`) which intercepts requests before sending them to the LLM. 
1. **Cache Check:** Verifies if a SHA-256 hash of the exact prompt exists in Firestore.
2. **Primary Execution:** Calls Groq's insanely fast inference endpoint.
3. **Structured Output:** Forces the LLM to return strict, heavily constrained JSON payloads (Strengths, Weaknesses, Scores, Keyword Density, Exact Substring Replacements).
4. **Fallback:** Falls back to OpenRouter/Gemini in case of latency or strict rate limits.

### Structured ATS PDF Engine
Standardizing unstructured resumes into a single ATS format is a notoriously difficult computer science problem. This app solves it by:
1. Sending the flat, optimized text array to a background AI parser (`/api/build-resume`).
2. Mapping the output into a strict TypeScript interface (`ResumeData`).
3. Feeding the structured JSON into `@react-pdf/renderer` to draw a flawless, one-column, Times New Roman, ATS-friendly layout.

## 🔒 Security

- **Payload Protection:** All API routes (`/api/*`) are secured against memory exhaustion attacks (5MB file size hard limits, 20,000 character string limits).
- **Client-Side Secrets Isolation:** AI API keys are strictly executed server-side.
- **Rate Limiting:** In-memory request tracking prevents DDoS and API quota drainage.
- **Database Rules:** Strict Firestore Security Rules ensure users can only ever access their own `data/resume` collections, and blocks the frontend from accessing the backend `ai-cache`.

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with the following keys:
   ```env
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   # ... add remaining Firebase config keys
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to interact with the platform.
