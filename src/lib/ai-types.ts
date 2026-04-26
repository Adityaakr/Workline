// Shared shapes for the Workline AI Smart Split engine.
// The same response shape is returned whether the AI succeeded or
// whether the deterministic rule-based engine was used as a fallback.

export const SUPPORTED_LOCAL_CURRENCIES = [
  "wMXN",
  "wBRL",
  "wINR",
  "USDC",
] as const;

export type AiSupportedCurrency = (typeof SUPPORTED_LOCAL_CURRENCIES)[number];

export type AiSmartSplitRequest = {
  amountUSDC: number;
  preferredCurrency: string;
  verifiedHuman: boolean;
  payerName?: string;
  payoutPurpose?: string;
  recentSettlements?: {
    amountUSDC: number;
    selectedCurrency: string;
    verifiedHuman: boolean;
  }[];
};

export type AiSmartSplitResult = {
  source: "ai" | "rule" | "fallback";
  model?: string;
  localPct: number;
  stablePct: number;
  reservePct: number;
  localCurrency: AiSupportedCurrency;
  localAmount: number;
  stableAmount: number;
  reserveAmount: number;
  reason: string;
  tip: string;
};

export function isSupportedCurrency(s: string): s is AiSupportedCurrency {
  return (SUPPORTED_LOCAL_CURRENCIES as readonly string[]).includes(s);
}
