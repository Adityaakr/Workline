import type { SettleResponse } from "./minihub-types";

export type SmartSplitSuggestion = {
  localAmount: number;
  localCurrency: string;
  stableAmount: number;
  reason: string;
  breakdown: { label: string; amount: number }[];
};

// 3-way split visual model used by the SmartSplitCard. The split adds
// up to 100% and is what we render as a stacked allocation bar.
export type SmartSplitAllocation = {
  localPct: number;
  stablePct: number;
  reservePct: number;
  localAmount: number;
  stableAmount: number;
  reserveAmount: number;
  localCurrency: string;
  reason: string;
};

const DEFAULT_LOCAL_RATIO = 0.7;

export function computeSmartSplit(opts: {
  amountUSDC: number;
  preferredCurrency: string;
  settlementHistory: SettleResponse[];
  verifiedHuman: boolean;
}): SmartSplitSuggestion {
  const { amountUSDC, preferredCurrency, settlementHistory, verifiedHuman } = opts;

  if (preferredCurrency === "USDC") {
    return {
      localAmount: 0,
      localCurrency: "USDC",
      stableAmount: amountUSDC,
      reason: "Your preferred currency is USDC. Keeping 100% in stables.",
      breakdown: [{ label: "Savings", amount: amountUSDC }],
    };
  }

  const pastLocal = settlementHistory.filter(
    (s) => s.selectedCurrency !== "USDC",
  );
  const pastStable = settlementHistory.filter(
    (s) => s.selectedCurrency === "USDC",
  );

  let localRatio = DEFAULT_LOCAL_RATIO;
  let reason: string;

  if (pastLocal.length + pastStable.length >= 2) {
    const totalPast = pastLocal.length + pastStable.length;
    localRatio = Math.max(0.3, Math.min(0.9, pastLocal.length / totalPast));
    reason = `Based on your last ${totalPast} settlements`;
  } else if (!verifiedHuman) {
    localRatio = 0.5;
    reason = "Verify with World ID for better FX rates on conversions";
  } else {
    reason = "Recommended split for new users";
  }

  const localAmount = Math.round(amountUSDC * localRatio);
  const stableAmount = amountUSDC - localAmount;

  const rentShare = Math.round(localAmount * 0.55);
  const groceriesShare = localAmount - rentShare;

  return {
    localAmount,
    localCurrency: preferredCurrency,
    stableAmount,
    reason,
    breakdown: [
      { label: "Rent & bills", amount: rentShare },
      { label: "Groceries & daily", amount: groceriesShare },
      { label: "Stable savings", amount: stableAmount },
    ],
  };
}

// Map the rule-based suggestion to a 3-way allocation: spend in local,
// hold in stable, keep an emergency reserve. Reserve is carved out of
// stables (still USDC) but visualized separately to communicate a
// money habit, not just a conversion.
export function computeSmartSplitAllocation(opts: {
  amountUSDC: number;
  preferredCurrency: string;
  settlementHistory: SettleResponse[];
  verifiedHuman: boolean;
}): SmartSplitAllocation {
  const suggestion = computeSmartSplit(opts);
  const total = Math.max(opts.amountUSDC, 1);

  const reserveAmount = Math.round(suggestion.stableAmount * 0.4);
  const stableSavings = suggestion.stableAmount - reserveAmount;

  const localPct = Math.round((suggestion.localAmount / total) * 100);
  const reservePct = Math.round((reserveAmount / total) * 100);
  const stablePct = Math.max(0, 100 - localPct - reservePct);

  return {
    localPct,
    stablePct,
    reservePct,
    localAmount: suggestion.localAmount,
    stableAmount: stableSavings,
    reserveAmount,
    localCurrency: suggestion.localCurrency,
    reason: suggestion.reason,
  };
}
