"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Does buying NIFTY after a sharp fall work?",
  "Is buying NIFTY on a 2% single-day decline profitable over 5 days?",
  "Does buying NIFTY after high volatility yield positive forward returns?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmittedQuestion(question.trim());
  };

  const handleReset = () => {
    setQuestion("");
    setSubmittedQuestion(null);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation / Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="font-semibold tracking-tight text-slate-100">
              AI-Native Trading Research
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              v0.1 Prototype
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-emerald-400 font-medium">1. ASK</span>
            <span>→</span>
            <span>2. CLARIFY</span>
            <span>→</span>
            <span>3. DEFINE</span>
            <span>→</span>
            <span>4. TEST</span>
            <span>→</span>
            <span>5. LEARN</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {!submittedQuestion ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Phase 1: Formulation
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">
                Ask a trading research question
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                State your market hypothesis in plain English. The platform will
                quantify your intent, disambiguate conditions, and test it against
                historical data.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/70 p-2 shadow-2xl focus-within:border-emerald-500/60 transition-colors">
                <textarea
                  id="research-question-input"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Does buying NIFTY after a sharp fall work?"
                  className="w-full bg-transparent px-3 py-2 text-slate-100 placeholder-slate-500 text-base focus:outline-none resize-none font-sans"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 px-2">
                  <span className="text-xs text-slate-500 font-mono">
                    Natural language hypothesis
                  </span>
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium text-sm transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    Analyze Question
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Prompt suggestions */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Sample research hypotheses:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="text-left text-xs text-slate-400 hover:text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                  >
                    &ldquo;{item}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  Hypothesis Captured (Stage: ASK)
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Edit Question
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-mono mb-1">RAW QUESTION</p>
                <p className="text-lg font-medium text-slate-100">
                  &ldquo;{submittedQuestion}&rdquo;
                </p>
              </div>

              <div className="pt-2 text-xs text-slate-400 font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for CLARIFY & DEFINE pipeline</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        AI Full-Stack Developer Intern Challenge • Option 2 Prototype
      </footer>
    </div>
  );
}
