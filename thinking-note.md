# Thinking Note: Quantitative Framing of Natural-Language Trading Hypotheses

## 1. Concrete Interpretation of "Sharp Fall" & "High Volatility"

When a trader asks, *"Does buying NIFTY after a sharp fall work?"*, the colloquial term **"sharp fall"** is fundamentally ambiguous. To test it quantitatively, we define it as:

$$\text{Daily Return} = \frac{\text{Close}_t - \text{Close}_{t-1}}{\text{Close}_{t-1}} \le -1.50\%$$

### The Core Trade-Off: Sample Size Starvation vs. Noise Capture
The choice of $-1.5\%$ is an intentional statistical balance:
- **Why not $\le -3.0\%$?** In a 2- to 3-year trading horizon (~500–750 trading days), drops exceeding $-3.0\%$ occur fewer than 4–6 times. A sample size of $N < 10$ has negligible statistical power, making the resulting win-rate and mean return susceptible to extreme single-event outliers (sample-size starvation).
- **Why not $\le -0.5\%$?** Drops of $0.5\%$ happen every couple of weeks in broad equity indices. Capturing them dilutes the sample with everyday market churn and routine noise, completely abandoning the qualitative intent of buying a "panic dip."
- **Why $-1.5\%$?** Across our ~500–750 trading-day baseline (where synthetic daily return volatility $\sigma_{\text{daily}} \approx 0.85\%$), a $-1.50\%$ move is roughly a $1.75\sigma$ negative shock. This isolates genuine intraday sell-offs while producing an empirically usable event count of 30 to 45 occurrences.

### Definition of "High Volatility" (Regime Filter)
When users condition the trade on market turbulence, we define **High Volatility** as:
- **20-day rolling annualized volatility** $\sigma_{\text{ann}} = \sqrt{252} \times \text{StdDev}(r_{t-19 \dots t}) > 18.0\%$.
- **Why $18\%$?** NIFTY's historical baseline median annualized volatility clusters around $12\% - 14\%$. An $18\%$ annualized volatility threshold isolates genuine regime shifts (macro stress, policy changes, sudden drawdowns) from calm, trending bull regimes.

---

## 2. Categorization of Assumptions

To keep the research pipeline transparent and audit-proof, every premise is explicitly divided into three labeled buckets:

### Bucket 1: What the User Actually Said
- Target asset class: Broad Indian equities index (NIFTY 50).
- Core intent: Mean-reversion / dip-buying strategy ("buying after a fall").
- Directional bias: Long-only entry.

### Bucket 2: What the System Assumed (Defaults)
- **Execution Timing:** The trade enters at Market-On-Close ($\text{Close}_t$) on the day the condition triggers, or Market-On-Open ($\text{Open}_{t+1}$) next session.
- **Fixed Holding Period:** Default exit after $H = 5$ trading days (1 calendar week), testing short-term mean-reversion momentum without unbounded drift.
- **Benchmark Comparison:** Baseline comparison is the unconditional forward return of the same index over equivalent 5-day rolling windows across the same testing period.
- **Data Universe:** Daily closing prices from our synthetic 3-year dataset (2022–2024, ~750 sessions), initialized with realistic drift ($\mu \approx 11.5\%$ annualized) and annualized volatility ($\sigma \approx 13.5\%$).
- **Frictional Costs:** Prototype baseline assumes zero slippage and zero transaction costs for the raw statistical run, with friction addressed in risk analysis.

### Bucket 3: What the System Must Ask the User (Clarifications)
- What specific drop threshold counts as "sharp" ($-1.0\%$, $-1.5\%$, or $-2.5\%$)?
- How long should the position be held ($1, 3, 5, 10,$ or $20$ trading days)?
- Is there a defined stop-loss or profit target exit, or strictly a time-based exit?
- Should this be filtered by regime (e.g., only in bull markets above 200 EMA, or during high volatility)?

---

## 3. Minimum Clarifying Questions

Rather than entering an open-ended conversational loop, the prototype surfaces 4 structured parameters:

1. **Drop Magnitude (Entry Trigger):** *"How severe must the daily drop be to trigger entry?"* (Default: $-1.5\%$).
2. **Holding Horizon (Exit Condition):** *"How long do you intend to hold the position before exiting?"* (Default: 5 trading days).
3. **Exit Strategy:** *"Do you want a pure time-based exit or a stop-loss / take-profit threshold?"* (Default: Time-based exit at close of day $t+H$).
4. **Regime Filter:** *"Do you want to test this across all market environments, or restrict to specific regimes?"* (Default: All market regimes; optional: High Volatility $\sigma > 18\%$).

---

## 4. Formal Experiment Definition

| Parameter | Specification | Default Prototype Value |
| :--- | :--- | :--- |
| **Instrument** | NIFTY 50 Index (Cash/Spot Proxy) | `NIFTY_DAILY` |
| **Entry Condition** | Single-day percentage drop | $(\text{Close}_t - \text{Close}_{t-1}) / \text{Close}_{t-1} \le -1.5\%$ |
| **Execution Point** | Close of trigger session | Signal evaluated at close $t$, fill at close $t$ |
| **Holding Period** | Fixed time horizon | 5 trading days ($t+5$) |
| **Exit Condition** | Time exit | Close at day $t+5$ |
| **Test Period** | Historical daily sessions | 750 trading sessions (~3 calendar years) |
| **Regime Filter** | Market volatility filter | None (unconditional) / High Vol ($\sigma_{20d} > 18\%$) |
| **Cost Assumption** | Frictions | 0.05% round-trip slippage + brokerage (noted in analysis) |

---

## 5. What Could Go Wrong (Specific Prototype Risks)

### 1. Small Sample Size & Event Clustering Bias
In a 750-day window, $-1.5\%$ drops will cluster around 2–3 brief bear-market panic regimes rather than being independent, identically distributed events. A string of 4 consecutive down-days might trigger 4 overlapping trades that all catch the exact same market bounce or all suffer the same cascading breakdown, heavily skewing standard error estimates.

### 2. Execution Timing & Look-Ahead Bias
Evaluating whether a day is down $-1.5\%$ requires knowing the day's `Close`. If a trader executes at the `Close`, they cannot know the official settlement price until after market close. If execution is deferred to the next day's `Open`, overnight gap risk introduces immediate slippage that can wipe out thin mean-reversion edges.

### 3. Frictional Drag & Real-World Slippage
A mean reversion strategy yielding $+0.65\%$ over 5 days appears promising in a raw simulation. However, buying immediately on sudden down-days encounters wide bid-ask spreads, elevated implied volatility in options/futures, and exchange transaction fees + STT (Securities Transaction Tax in India). A 0.15% round-trip drag erodes roughly a quarter of the raw alpha.

### 4. Circularity Risk on Volatility Regimes
In our prototype, "High Volatility" is computed from the same synthetic dataset over which the entry signals are evaluated, using a relative threshold derived from that sample's own historical distribution. While acceptable for an exploratory prototype, this creates a subtle self-referential filter: the regime definitions are endogenous to the historical sample rather than being an ex-ante, independently calibrated macro factor.

### 5. Synthetic Data Realism & Tail Behavior
Because our dataset is synthetic (calibrated via geometric Brownian motion with jump-diffusion), it generates fewer extreme fat tails, liquidity vacuums, and prolonged bear market regimes than real NIFTY history (e.g., March 2020 or 2008). The prototype's findings demonstrate quantitative logic and comparative behavior, but must never be treated as verified production alpha.
