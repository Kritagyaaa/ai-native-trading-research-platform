"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Does buying NIFTY after a sharp fall work?",
  "Is buying NIFTY on a 2% single-day decline profitable over 5 days?",
  "Does buying NIFTY after high volatility yield positive forward returns?",
];

// Sensible defaults from thinking-note.md
const DEFAULTS = {
  entry_condition: "Single-day decline >= 1.5%",
  holding_period_days: 5,
  exit_condition: "Time-based exit after holding period",
  filters: "none",
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState("ask"); // "ask" | "clarify" | "define"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extracted raw experiment from Gemini
  const [rawExperiment, setRawExperiment] = useState(null);

  // Finalized / clarified parameters
  const [clarifiedParams, setClarifiedParams] = useState({
    entry_condition: DEFAULTS.entry_condition,
    holding_period_days: DEFAULTS.holding_period_days,
    exit_condition: DEFAULTS.exit_condition,
    filters: DEFAULTS.filters,
  });

  const handleAskSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze question.");
      }

      setRawExperiment(data);

      // Initialize clarified values from extraction or defaults
      setClarifiedParams({
        entry_condition: data.entry_condition || DEFAULTS.entry_condition,
        holding_period_days: data.holding_period_days || DEFAULTS.holding_period_days,
        exit_condition: data.exit_condition || DEFAULTS.exit_condition,
        filters: data.filters || DEFAULTS.filters,
      });

      // If there are missing fields that need clarification, go to clarify; else go directly to define
      if (data.missing_fields && data.missing_fields.length > 0) {
        setStep("clarify");
      } else {
        setStep("define");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClarifySubmit = (e) => {
    e.preventDefault();
    setStep("define");
  };

  const handleReset = () => {
    setQuestion("");
    setStep("ask");
    setRawExperiment(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur px-6 py-4 sticky top-0 z-20">
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

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={step === "ask" ? "text-emerald-400 font-medium" : "text-slate-400"}>
              1. ASK
            </span>
            <span className="text-slate-600">→</span>
            <span className={step === "clarify" ? "text-emerald-400 font-medium" : "text-slate-400"}>
              2. CLARIFY
            </span>
            <span className="text-slate-600">→</span>
            <span className={step === "define" ? "text-emerald-400 font-medium" : "text-slate-400"}>
              3. DEFINE
            </span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-600">4. TEST</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-600">5. LEARN</span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm flex items-start justify-between">
            <div>
              <p className="font-medium">Error running analysis</p>
              <p className="text-xs text-rose-400/90 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STAGE 1: ASK */}
        {step === "ask" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Stage 1 • ASK
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">
                Ask a trading research question
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                State your market hypothesis in plain language. The system extracts
                the underlying testable logic and identifies ambiguous parameters.
              </p>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/70 p-2 shadow-2xl focus-within:border-emerald-500/60 transition-colors">
                <textarea
                  id="research-question-input"
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Does buying NIFTY after a sharp fall work?"
                  className="w-full bg-transparent px-3 py-2 text-slate-100 placeholder-slate-500 text-base focus:outline-none resize-none font-sans"
                  disabled={loading}
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 px-2">
                  <span className="text-xs text-slate-500 font-mono">
                    Scoping: NIFTY 50 daily closes
                  </span>
                  <button
                    type="submit"
                    disabled={!question.trim() || loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium text-sm transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Extracting Logic...
                      </>
                    ) : (
                      <>
                        Analyze Hypothesis
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Sample research hypotheses:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={loading}
                    onClick={() => setQuestion(item)}
                    className="text-left text-xs text-slate-400 hover:text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 rounded-lg px-3 py-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    &ldquo;{item}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: CLARIFY */}
        {step === "clarify" && rawExperiment && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Stage 2 • CLARIFY
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Start Over
                </button>
              </div>
              <h2 className="text-2xl font-semibold text-slate-50">
                Clarify Missing & Ambiguous Parameters
              </h2>
              <p className="text-slate-400 text-sm">
                Your question: &ldquo;<span className="text-slate-200">{question}</span>&rdquo;
              </p>
            </div>

            {/* Note banner explaining the detected gaps */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Disambiguation Required
              </p>
              <p className="text-amber-300/80">
                The language model flagged{" "}
                <span className="font-mono text-amber-200 font-medium">
                  {rawExperiment.missing_fields?.join(", ") || "parameters"}
                </span>{" "}
                as underspecified. We proposed quantitative defaults from our research methodology.
                Review and override below:
              </p>
            </div>

            <form onSubmit={handleClarifySubmit} className="space-y-4">
              {/* Entry Condition Field */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    1. Entry Trigger Condition (Drop Magnitude)
                  </label>
                  {rawExperiment.missing_fields?.includes("entry_condition") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Ambiguous in query
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Defines what constitutes a &ldquo;sharp fall&rdquo; in daily close:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "Mild Drop (≥ 1.0%)", value: "Single-day decline >= 1.0%" },
                    { label: "Sharp Fall (≥ 1.5% • Default)", value: "Single-day decline >= 1.5%" },
                    { label: "Severe Crash (≥ 2.5%)", value: "Single-day decline >= 2.5%" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setClarifiedParams((prev) => ({
                          ...prev,
                          entry_condition: opt.value,
                        }))
                      }
                      className={`text-xs p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        clarifiedParams.entry_condition === opt.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holding Period Field */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    2. Holding Period Horizon
                  </label>
                  {rawExperiment.missing_fields?.includes("holding_period_days") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Unspecified in query
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Number of trading sessions before position is closed:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "1 Day (Next Close)", days: 1 },
                    { label: "3 Days", days: 3 },
                    { label: "5 Days (1 Week • Default)", days: 5 },
                    { label: "10 Days (2 Weeks)", days: 10 },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() =>
                        setClarifiedParams((prev) => ({
                          ...prev,
                          holding_period_days: opt.days,
                        }))
                      }
                      className={`text-xs p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        clarifiedParams.holding_period_days === opt.days
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exit Condition Field */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    3. Exit Condition Strategy
                  </label>
                  {rawExperiment.missing_fields?.includes("exit_condition") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Unspecified in query
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    {
                      label: "Pure Time Exit (Exit at session close of Day t+H)",
                      value: "Time-based exit after holding period",
                    },
                    {
                      label: "Time Exit with 2% Stop Loss",
                      value: "Time-based exit with 2% stop-loss threshold",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setClarifiedParams((prev) => ({
                          ...prev,
                          exit_condition: opt.value,
                        }))
                      }
                      className={`text-xs p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        clarifiedParams.exit_condition === opt.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regime Filter Field */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    4. Market Regime / Volatility Filter
                  </label>
                  {rawExperiment.missing_fields?.includes("filters") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Unfiltered in query
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    {
                      label: "All Market Regimes (No filter • Default)",
                      value: "none",
                    },
                    {
                      label: "High Volatility Only (20d Ann. Vol > 18%)",
                      value: "high_volatility",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setClarifiedParams((prev) => ({
                          ...prev,
                          filters: opt.value,
                        }))
                      }
                      className={`text-xs p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        clarifiedParams.filters === opt.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-sm transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  Confirm & Define Experiment
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STAGE 3: DEFINE */}
        {step === "define" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Stage 3 • DEFINE
                </span>
                <button
                  type="button"
                  onClick={() => setStep("clarify")}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Adjust Parameters
                </button>
              </div>
              <h2 className="text-2xl font-semibold text-slate-50">
                Structured Experiment Card
              </h2>
              <p className="text-slate-400 text-sm">
                Formalized quantitative specification ready for empirical backtesting.
              </p>
            </div>

            {/* Experiment Card mirroring assignment structure */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Underlying Research Question
                </p>
                <p className="text-lg font-medium text-slate-100 leading-snug">
                  {rawExperiment?.underlying_question || question}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 font-mono">
                  Original Query: &ldquo;{question}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                    Instrument / Asset
                  </span>
                  <p className="text-slate-200 text-sm font-sans font-medium">
                    NIFTY 50 Index (Cash/Spot Proxy)
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Timeframe: Daily Close
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                    Entry Condition
                  </span>
                  <p className="text-emerald-400 text-sm font-sans font-medium">
                    {clarifiedParams.entry_condition}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Execution: Close of trigger session (t)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                    Exit Condition & Horizon
                  </span>
                  <p className="text-slate-200 text-sm font-sans font-medium">
                    {clarifiedParams.holding_period_days} Trading Days ({clarifiedParams.exit_condition})
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Fill: Close at t + {clarifiedParams.holding_period_days}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                    Regime / Volatility Filter
                  </span>
                  <p className="text-slate-200 text-sm font-sans font-medium capitalize">
                    {clarifiedParams.filters === "high_volatility"
                      ? "High Volatility (20d Ann. Vol > 18%)"
                      : "Unconditional (All Regimes)"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Data Window: 750 trading sessions (~3 Years)
                  </p>
                </div>
              </div>

              {/* Ready for TEST notice */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">Specification Complete.</span>{" "}
                  Ready to test condition against sample NIFTY daily dataset.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
                    title="Phase 4 will activate the backtest"
                  >
                    Run Test (Phase 4) →
                  </button>
                </div>
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
