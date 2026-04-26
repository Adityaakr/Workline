import type { SettleResponse } from "./minihub-types";

export type SmartSplitSuggestion = {
  localAmount: number;
  localCurrency: string;
  stableAmount: number;
  reason: string;
  breakdown: { label: string; amount: number }[];
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
