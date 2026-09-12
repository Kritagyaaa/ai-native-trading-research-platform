# AI Usage Note

## 1. Concrete AI Tools Used
- **Antigravity AI Agent:** Autonomous development agent used for scaffolding the Next.js repository, executing shell commands, writing application logic and tests, and managing git commits phase-by-phase.
- **Claude (Anthropic, separate review conversation):** Used as an architectural, design, and QA review layer — drafted the phased master prompt, reviewed statistical definitions, audited system prompts for schema bugs, and reviewed documentation drafts.
- **Google Gemini API (`gemini-3.8-flash` via Google AI Studio):** Embedded inside the `/api/parse-experiment` route for zero-shot natural language understanding and structured JSON extraction, backed by automatic fallback aliases (`gemini-flash-latest`, `gemini-flash-lite-latest`) for capacity resilience.

---

## 2. Summary of Tool Usage Across Phases
- **Phases 0–2 (Setup & ASK):** Claude defined the phased ground rules and master prompt; Antigravity scaffolded Next.js, configured `.gitignore`, and built the minimal question input landing page.
- **Phase 3 (CLARIFY & DEFINE):** Antigravity drafted the Gemini extraction prompt; Claude audited it and caught a key mismatch bug and missing-instrument handling gap; the human chose the NIFTY-only scope cut; Antigravity implemented the server route and disambiguation form.
- **Phases 4–6 (TEST, LEARN & Polish):** Antigravity generated the synthetic NIFTY series, built the backtest math engine, and implemented the visual separation between empirical data and system inferences. Claude reviewed error resilience and attribution.

---

## 3. Human Decisions (vs. AI Contributions)
- **Problem Selection & Workflow Discipline:** Selected Option 2 and enforced strict sequential execution and commit boundaries without skipping ahead.
- **Form-Based Disambiguation Pattern:** Decided to implement CLARIFY as a structured form with sensible defaults rather than an open-ended conversational chat loop, prioritizing evaluation speed and clean UI interaction.
- **Acting on Review Findings:** When Claude flagged the prompt schema gap and missing instrument handling, the human made the executive call to scope the prototype strictly to NIFTY daily closes rather than bloating scope with dynamic asset resolution.
- **Epistemic Separation Mandate:** Enforced the strict visual and conceptual boundary between raw empirical numbers and qualitative system conclusions.
- **Key & Model Provisioning:** Sourced and configured `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.8-flash` in `.env.local`.

---

## 4. AI Suggestions Rejected or Changed
- **Schema Key Discrepancy:** Antigravity initially generated a prompt schema using `holding_period_days` alongside `missing_fields: ["holding_period"]`. Claude identified the silent mismatch bug during review, and the human directed Antigravity to align both to `holding_period_days`.
- **Dynamic Multi-Asset Disambiguation:** Prompting Claude's observation on the unhandled `instrument` field, the human rejected adding multi-asset resolution in favor of an explicit NIFTY-only scope cut.
- **Endogenous Volatility Framing:** The initial definition treated volatility regimes without caveats; following Claude's review of circularity risks, the human mandated that the circularity of computing volatility from the same synthetic test dataset be explicitly disclosed in the Thinking Note.
- **External Charting Bloat:** Suggestions to introduce charting libraries were rejected to preserve lightweight readability.

---

## 5. What I'm Most Proud Of
The **multi-agent review discipline and epistemic honesty**. Leveraging one AI model (Claude) as an adversarial reviewer over another (Antigravity) caught subtle prompt bugs before runtime. More importantly, the prototype avoids the temptation of building an overfitted "AI trading oracle," instead functioning as a transparent research workbench that honestly reveals that unconditional dip-buying underperforms a passive market hold.
