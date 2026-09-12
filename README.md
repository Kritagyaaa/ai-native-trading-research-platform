# AI-Native Trading Research Platform

An AI-native quantitative research prototype that transforms natural-language trading hypotheses into structured, testable empirical experiments following the **ASK → CLARIFY → DEFINE → TEST → LEARN** research methodology.

Built for the **AI Full-Stack Developer Intern Challenge (Option 2)**.

---

## 1. Architecture

The application follows a structured, sequential research pipeline:

```
[1. ASK]
User inputs plain-language hypothesis (e.g., "Does buying NIFTY after a sharp fall work?")
        │
        ▼
[Server Route: /api/parse-experiment]
Gemini extracts structured parameters & identifies missing/underspecified fields
        │
        ▼
[2. CLARIFY]
Interactive disambiguation form proposes methodology defaults (drop magnitude, horizon, regime)
        │
        ▼
[3. DEFINE]
Structured experiment specification card mirrors formal quantitative research parameters
        │
        ▼
[4. TEST]
Client-side backtest engine evaluates triggers against 750 trading sessions of NIFTY daily closes
        │
        ▼
[5. LEARN]
Strict visual separation: "What the data shows" (raw metrics) vs. "What the system concludes" (inference)
```

- **Client State Machine (`src/app/page.js`):** Manages step transitions, parameter overrides, backtest execution, and iterative hypothesis testing.
- **Server API Route (`src/app/api/parse-experiment/route.js`):** Safely houses the `GEMINI_API_KEY`, queries Google Gemini with a quantitative extraction system prompt, and enforces strict JSON output with candidate model fallback (`gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-3.6-flash`).
- **Backtest Module (`src/lib/backtest.js`):** Lightweight, deterministic mathematical evaluator calculating event returns, win rates, and unconditional rolling index baselines.
- **Data Universe (`data/nifty_daily.json`):** 750 trading sessions of synthetic NIFTY daily closes (2022–2024), calibrated to historical NIFTY daily drift and volatility.

---

## 2. Technology Choices (and Why)

- **Next.js (App Router):** Chosen specifically because the Google Gemini API key must remain strictly server-side. The App Router route handler (`/api/parse-experiment`) handles external API interaction securely, preventing any client-side credential exposure.
- **Tailwind CSS:** Enables rapid, zero-runtime styling with fine-grained control over color tokens, borders, and typography. Kept minimal and dark-slate themed without bloated component libraries.
- **Google Gemini API (`gemini-flash-latest` / `gemini-3.8-flash`):** Used for zero-shot natural language understanding and strict JSON extraction. Flash-tier models provide sub-second latency for interactive query parsing.
- **Plain JavaScript Execution Engine:** Backtesting is implemented in plain, transparent JavaScript without heavy scientific libraries or over-engineered abstraction layers, keeping the prototype fast, readable, and verifiable.

---

## 3. Key Assumptions

- **Asset Universe & Scoping:** Scoped specifically to the **NIFTY 50 Index on daily closes**. Restricting to one well-understood broad market index ensures the statistical evaluation is concrete and directly comparable against an unconditional baseline.
- **"Sharp Fall" Definition:** Defined as a single-day close-to-close decline of **$\ge 1.50\%$** ($(Close_t - Close_{t-1}) / Close_{t-1} \le -0.015$). This represents a $\sim 1.75\sigma$ negative return shock in normal market volatility, yielding 27–35 occurrences across a 750-day window. Choosing $\ge 3.0\%$ would cause sample-size starvation ($N < 5$), while $\ge 0.5\%$ would capture everyday market noise.
- **"High Volatility" Filter:** Defined as 20-day rolling annualized volatility **$> 18.0\%$**. Historical NIFTY median volatility hovers around 12–14%; $>18\%$ isolates periods of genuine market stress and macro turbulence.
- **Execution Point:** Market-On-Close ($Close_t$) fill upon signal confirmation.
- **Holding Horizon:** 5 trading days ($t+5$ close exit) as the standard default horizon to evaluate short-term mean reversion.
- **Unconditional Baseline:** Compares strategy returns against all possible 5-day rolling index returns over the exact same 750 sessions.
- **Frictional Costs:** Prototype raw backtest assumes zero execution slippage and brokerage, with real-world drag explicitly analyzed in the LEARN phase.

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm (or yarn / pnpm)
- Google Gemini API Key (free from [Google AI Studio](https://aistudio.google.com/apikey))

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kritagyaaa/ai-native-trading-research-platform.git
   cd ai-native-trading-research-platform
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-flash-latest
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. AI Tools Used

1. **Google Gemini API (`gemini-flash-latest` / `gemini-3.8-flash`):**
   - Integrated directly into the server route `/api/parse-experiment`.
   - Analyzes unstructured natural-language trading hypotheses, extracts the underlying quantitative intent, and detects missing or underspecified fields requiring clarification.
2. **Antigravity AI Agent:**
   - Used for end-to-end project scaffolding, writing quantitative definitions in `thinking-note.md`, developing the Next.js app, synthetic data generation, and git commit orchestration.

---

## 6. What I'd Improve with More Time

1. **Real-Time NSE Bhavcopy Ingestion:** Replace or supplement the synthetic dataset with automated ingestion of official NSE daily historical price data.
2. **Multi-Asset & Sector Universe:** Allow testing hypotheses across BANKNIFTY, NIFTY IT, or single-stock constituents to observe cross-sectional dispersion.
3. **Transaction Cost & Slippage Modeling:** Add a toggleable 0.10%–0.25% round-trip friction deduction (STT, exchange turnover fees, and bid-ask spread) to show true net expectancy.
4. **Visual Return Distribution:** Display a lightweight histogram showing the forward return distribution of condition-triggered trades vs. the baseline index.
5. **Dynamic Walk-Forward Splits:** Allow partitioning the data into in-sample and out-of-sample segments to test for regime stability.
