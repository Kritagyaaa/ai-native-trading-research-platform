"use client";

import { useState } from "react";
import niftyDataset from "@/data/nifty_daily.json";
import { runBacktest } from "@/lib/backtest";

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
  const [step, setStep] = useState("ask"); // "ask" | "clarify" | "define" | "test" | "learn"
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

  // Test backtest results
  const [testResults, setTestResults] = useState(null);

  const handleAskSubmit = async (e, customQuestion) => {
    if (e) e.preventDefault();
    const q = customQuestion || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze question.");
      }

      setRawExperiment(data);

      setClarifiedParams({
        entry_condition: data.entry_condition || DEFAULTS.entry_condition,
        holding_period_days: data.holding_period_days || DEFAULTS.holding_period_days,
        exit_condition: data.exit_condition || DEFAULTS.exit_condition,
        filters: data.filters || DEFAULTS.filters,
      });

      if (data.missing_fields && data.missing_fields.length > 0) {
        setStep("clarify");
      } else {
        setStep("define");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred connecting to Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseFallbackDefaults = () => {
    // Graceful offline fallback in case of external API issues
    setError(null);
    setRawExperiment({
      instrument: "NIFTY",
      timeframe: "daily",
      entry_condition: null,
      exit_condition: null,
      holding_period_days: null,
      filters: null,
      underlying_question: question || "Does buying NIFTY after a sharp fall work?",
      missing_fields: ["entry_condition", "holding_period_days", "exit_condition"],
    });
    setClarifiedParams(DEFAULTS);
    setStep("clarify");
  };

  const handleClarifySubmit = (e) => {
    e.preventDefault();
    setStep("define");
  };

  const handleRunTest = () => {
    const results = runBacktest(niftyDataset, clarifiedParams);
    setTestResults(results);
    setStep("test");
  };

  const handleGoToLearn = () => {
    setStep("learn");
  };

  const handleReset = () => {
    setQuestion("");
    setStep("ask");
    setRawExperiment(null);
    setTestResults(null);
    setError(null);
  };

  const handleSelectSuggestedQuestion = (newQuestion) => {
    setQuestion(newQuestion);
    setStep("ask");
    setRawExperiment(null);
    setTestResults(null);
    setError(null);
    handleAskSubmit(null, newQuestion);
  };

  const formatPct = (val) => {
    if (typeof val !== "number" || isNaN(val)) return "0.00%";
    const sign = val > 0 ? "+" : "";
    return `${sign}${(val * 100).toFixed(2)}%`;
  };

  const stepOrder = ["ask", "clarify", "define", "test", "learn"];
  const currentStepIndex = stepOrder.indexOf(step) + 1;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur px-4 sm:px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="font-semibold tracking-tight text-slate-100 text-sm sm:text-base">
              AI-Native Trading Research
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Option 2
            </span>
          </div>

          {/* Desktop Stepper indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            {stepOrder.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span
                  className={
                    step === s
                      ? "text-emerald-400 font-medium"
                      : currentStepIndex > i + 1
                      ? "text-slate-300"
                      : "text-slate-600"
                  }
                >
                  {i + 1}. {s.toUpperCase()}
                </span>
                {i < stepOrder.length - 1 && <span className="text-slate-700">→</span>}
              </span>
            ))}
          </div>

          {/* Mobile Step Badge */}
          <div className="sm:hidden text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
            Stage {currentStepIndex}/5 • {step.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Error banner with retry options */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  API Communication Notice
                </p>
                <p className="text-xs text-rose-300/90 mt-1 font-mono break-all">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs text-rose-400 hover:text-rose-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-rose-500/20 text-xs">
              <button
                onClick={(e) => handleAskSubmit(e)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium cursor-pointer transition-colors"
              >
                Retry API Call
              </button>
              <button
                onClick={handleUseFallbackDefaults}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
              >
                Continue with Methodology Defaults
              </button>
            </div>
          </div>
        )}

        {/* STAGE 1: ASK */}
        {step === "ask" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Stage 1 • ASK
              </span>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-50">
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
                  className="w-full bg-transparent px-3 py-2 text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none resize-none font-sans"
                  disabled={loading}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-800/60 px-2 gap-2 sm:gap-0">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Scoping: NIFTY 50 daily closes
                  </span>
                  <button
                    type="submit"
                    disabled={!question.trim() || loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Extracting Logic with Gemini...
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

            {/* Loading state indicator card */}
            {loading && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300 font-mono flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Extracting quantitative parameters and identifying ambiguities...</span>
              </div>
            )}

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
                    onClick={() => {
                      setQuestion(item);
                      handleAskSubmit(null, item);
                    }}
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
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                Clarify Missing & Ambiguous Parameters
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Your question: &ldquo;<span className="text-slate-200">{question}</span>&rdquo;
              </p>
            </div>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    1. Entry Trigger Condition (Drop Magnitude)
                  </label>
                  {rawExperiment.missing_fields?.includes("entry_condition") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 w-fit">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    2. Holding Period Horizon
                  </label>
                  {rawExperiment.missing_fields?.includes("holding_period_days") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 w-fit">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    3. Exit Condition Strategy
                  </label>
                  {rawExperiment.missing_fields?.includes("exit_condition") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 w-fit">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                    4. Market Regime / Volatility Filter
                  </label>
                  {rawExperiment.missing_fields?.includes("filters") && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 w-fit">
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
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
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
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                Structured Experiment Card
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Formalized quantitative specification ready for empirical backtesting.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-2xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Underlying Research Question
                </p>
                <p className="text-base sm:text-lg font-medium text-slate-100 leading-snug">
                  {rawExperiment?.underlying_question || question}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 font-mono break-words">
                  Original Query: &ldquo;{question}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
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

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">Specification Complete.</span>{" "}
                  Click below to execute forward return test against the sample dataset.
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleRunTest}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    Run Test (Phase 4)
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 4: TEST */}
        {step === "test" && testResults && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Stage 4 • TEST
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("define")}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    View Definition
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    New Hypothesis
                  </button>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                Sample Returns Against Defined Condition
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Evaluating empirical forward returns after condition triggers vs. unconditional baseline.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span>
                  <strong>Dataset:</strong> Synthetic NIFTY 50 Daily Closes (750 trading sessions, 2022–2024 calibrated to historical volatility).
                </span>
              </div>
              <span className="font-mono text-[11px] text-sky-300">
                N = {testResults.sampleSize} events
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-2xl space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Sample Size (Events)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 font-mono">
                    {testResults.sampleSize}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Triggered occurrences
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Avg Return ({clarifiedParams.holding_period_days}d)
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-bold mt-1 font-mono ${
                      testResults.avgReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPct(testResults.avgReturn)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    After condition trigger
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Baseline Return ({clarifiedParams.holding_period_days}d)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-200 mt-1 font-mono">
                    {formatPct(testResults.baselineAvgReturn)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Unconditional index avg
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Excess vs Baseline
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-bold mt-1 font-mono ${
                      testResults.excessReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPct(testResults.excessReturn)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Strategy alpha vs market
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Condition Win Rate:</span>{" "}
                  <span className="text-slate-200 font-medium">
                    {(testResults.winRate * 100).toFixed(1)}%
                  </span>{" "}
                  <span className="text-slate-500">
                    (vs {(testResults.baselineWinRate * 100).toFixed(1)}% baseline)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Best Trade:</span>{" "}
                  <span className="text-emerald-400 font-medium">
                    {formatPct(testResults.bestTrade)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Worst Trade:</span>{" "}
                  <span className="text-rose-400 font-medium">
                    {formatPct(testResults.worstTrade)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">Test Complete.</span>{" "}
                  Proceed to Phase 5 to view empirical data separated from system inference.
                </div>
                <button
                  type="button"
                  onClick={handleGoToLearn}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Interpret Results (LEARN)
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 5: LEARN (Explicit separation requested by brief) */}
        {step === "learn" && testResults && (
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Stage 5 • LEARN
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("test")}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    View Raw Stats
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    New Hypothesis
                  </button>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                Research Findings & Inference
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Strict separation between empirical observation and inductive system conclusions.
              </p>
            </div>

            {/* BLOCK 1: What the data shows (Raw numbers only, no interpretation) */}
            <div className="rounded-2xl border border-cyan-800/60 bg-cyan-950/20 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-cyan-300">
                    What the data shows (Raw Numbers Only)
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  Empirical Fact
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs font-mono pt-1">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Triggered Events (N)</span>
                  <span className="text-base sm:text-lg font-bold text-cyan-200">{testResults.sampleSize}</span>
                  <span className="text-[10px] text-slate-500 block">out of 750 trading sessions</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Mean Forward Return</span>
                  <span className={`text-base sm:text-lg font-bold ${testResults.avgReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPct(testResults.avgReturn)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">over {clarifiedParams.holding_period_days} trading days</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Unconditional Baseline</span>
                  <span className="text-base sm:text-lg font-bold text-slate-200">
                    {formatPct(testResults.baselineAvgReturn)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">all {testResults.totalWindows} rolling windows</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Excess Return vs Baseline</span>
                  <span className={`text-base sm:text-lg font-bold ${testResults.excessReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPct(testResults.excessReturn)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">strategy alpha</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Win Rate (Positive Returns)</span>
                  <span className="text-base sm:text-lg font-bold text-slate-200">
                    {(testResults.winRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">vs {(testResults.baselineWinRate * 100).toFixed(1)}% baseline</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-900/40">
                  <span className="text-slate-400 text-[11px] block">Extreme Bounds</span>
                  <span className="text-xs font-bold text-slate-200 block mt-1">
                    +{ (testResults.bestTrade * 100).toFixed(2) }% / { (testResults.worstTrade * 100).toFixed(2) }%
                  </span>
                  <span className="text-[10px] text-slate-500 block">max gain / max drawdown</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-1">
                Data recorded strictly from synthetic NIFTY 50 daily closes (2022–2024). No execution friction or transaction costs subtracted.
              </p>
            </div>

            {/* BLOCK 2: What the system concludes (Plain-language takeaway + labeled as inference) */}
            <div className="rounded-2xl border-l-4 border-l-emerald-400 border-r border-t border-b border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                    What the system concludes (Inductive Inference)
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Qualitative Takeaway
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                <p>
                  <strong>Core Takeaway:</strong> In this 3-year market window,{" "}
                  <span className="text-slate-100 font-medium">
                    buying NIFTY immediately following a sharp single-day decline failed to generate positive alpha
                  </span>.
                  {testResults.excessReturn < 0 ? (
                    <>
                      {" "}The strategy delivered an average forward return of{" "}
                      <span className="text-rose-400 font-mono font-semibold">
                        {formatPct(testResults.avgReturn)}
                      </span>
                      , underperforming the unconditional passive baseline of{" "}
                      <span className="text-slate-200 font-mono font-semibold">
                        {formatPct(testResults.baselineAvgReturn)}
                      </span>{" "}
                      by{" "}
                      <span className="text-rose-400 font-mono font-semibold">
                        {formatPct(testResults.excessReturn)}
                      </span>
                      . Win rate also lagged the market ({(testResults.winRate * 100).toFixed(1)}% vs. {(testResults.baselineWinRate * 100).toFixed(1)}%).
                    </>
                  ) : (
                    <>
                      {" "}The strategy generated an average forward return of{" "}
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatPct(testResults.avgReturn)}
                      </span>
                      , outperforming the baseline by{" "}
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatPct(testResults.excessReturn)}
                      </span>
                      .
                    </>
                  )}
                </p>

                <p className="text-slate-400 text-xs">
                  <strong>Mechanics & Limitations:</strong> Sharp sell-offs in index equities frequently cluster into multi-session momentum pullbacks (&ldquo;falling knives&rdquo;) rather than instantaneous V-shaped bounces. Furthermore, with $N = {testResults.sampleSize}$ occurrences, events are non-independent and subject to regime concentration. Once real-world exchange slippage and STT (~0.10%–0.15% round-trip) are factored in, unconditional dip buying exhibits negative net expectancy.
                </p>
              </div>

              {/* Suggested Next Questions */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">Suggested Next Research Hypotheses:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectSuggestedQuestion(
                        "Does buying NIFTY after a sharp fall work during high volatility regimes?"
                      )
                    }
                    className="text-left p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all text-xs text-slate-300 cursor-pointer group"
                  >
                    <span className="text-emerald-400 font-mono block text-[10px] uppercase mb-0.5">
                      Hypothesis A (Regime Conditioning)
                    </span>
                    &ldquo;Does buying NIFTY after a sharp fall work during high volatility regimes?&rdquo;
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSelectSuggestedQuestion(
                        "Is buying NIFTY on a 2% single-day decline profitable with a 1-day bounce holding period?"
                      )
                    }
                    className="text-left p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all text-xs text-slate-300 cursor-pointer group"
                  >
                    <span className="text-emerald-400 font-mono block text-[10px] uppercase mb-0.5">
                      Hypothesis B (Shorter Horizon)
                    </span>
                    &ldquo;Is buying NIFTY on a 2% single-day decline profitable with a 1-day bounce holding period?&rdquo;
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
