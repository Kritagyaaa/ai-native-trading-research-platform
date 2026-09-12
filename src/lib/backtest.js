/**
 * Backtest engine for evaluating forward returns following defined market conditions.
 * Simple, transparent control flow with baseline comparison.
 */

export function parseDropThreshold(entryConditionString) {
  if (!entryConditionString) return -0.015;
  const match = entryConditionString.match(/(\d+(\.\d+)?)%/);
  if (match) {
    return -Math.abs(parseFloat(match[1])) / 100;
  }
  return -0.015;
}

export function runBacktest(dataset, params) {
  const {
    entry_condition,
    holding_period_days = 5,
    exit_condition = "Time-based exit after holding period",
    filters = "none",
  } = params;

  const dropThreshold = parseDropThreshold(entry_condition);
  const holdingDays = parseInt(holding_period_days, 10) || 5;
  const hasStopLoss = typeof exit_condition === "string" && exit_condition.toLowerCase().includes("stop-loss");

  const trades = [];

  for (let i = 0; i < dataset.length - holdingDays; i++) {
    const bar = dataset[i];

    // Check entry drop condition
    if (bar.daily_return > dropThreshold) {
      continue;
    }

    // Check regime filter if specified
    if (filters === "high_volatility" && bar.vol_20d <= 0.18) {
      continue;
    }

    const entryPrice = bar.close;
    let exitBar = dataset[i + holdingDays];
    let tradeReturn = (exitBar.close - entryPrice) / entryPrice;

    // Check if stop loss was hit during holding period
    if (hasStopLoss) {
      for (let step = 1; step <= holdingDays; step++) {
        const intermediateBar = dataset[i + step];
        const drawdown = (intermediateBar.close - entryPrice) / entryPrice;
        if (drawdown <= -0.02) {
          tradeReturn = -0.02;
          exitBar = intermediateBar;
          break;
        }
      }
    }

    trades.push({
      entryDate: bar.date,
      entryPrice,
      exitDate: exitBar.date,
      exitPrice: exitBar.close,
      returnPct: tradeReturn,
      vol20d: bar.vol_20d,
    });
  }

  // Calculate baseline: unconditional forward returns across all possible holdingDays windows
  let baselineSum = 0;
  let baselinePositive = 0;
  let totalWindows = 0;

  for (let i = 0; i < dataset.length - holdingDays; i++) {
    const forwardReturn = (dataset[i + holdingDays].close - dataset[i].close) / dataset[i].close;
    baselineSum += forwardReturn;
    if (forwardReturn > 0) baselinePositive++;
    totalWindows++;
  }

  const baselineAvgReturn = totalWindows > 0 ? baselineSum / totalWindows : 0;
  const baselineWinRate = totalWindows > 0 ? baselinePositive / totalWindows : 0;

  // Calculate strategy statistics
  const sampleSize = trades.length;
  if (sampleSize === 0) {
    return {
      sampleSize: 0,
      avgReturn: 0,
      winRate: 0,
      bestTrade: 0,
      worstTrade: 0,
      baselineAvgReturn,
      baselineWinRate,
      excessReturn: 0,
      totalWindows,
      trades: [],
    };
  }

  const totalReturn = trades.reduce((acc, t) => acc + t.returnPct, 0);
  const avgReturn = totalReturn / sampleSize;
  const positiveTrades = trades.filter((t) => t.returnPct > 0).length;
  const winRate = positiveTrades / sampleSize;
  const returns = trades.map((t) => t.returnPct).sort((a, b) => a - b);
  const bestTrade = returns[returns.length - 1];
  const worstTrade = returns[0];
  const excessReturn = avgReturn - baselineAvgReturn;

  return {
    sampleSize,
    avgReturn,
    winRate,
    bestTrade,
    worstTrade,
    baselineAvgReturn,
    baselineWinRate,
    excessReturn,
    totalWindows,
    trades,
  };
}
