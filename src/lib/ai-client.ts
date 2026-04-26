import { computeSmartSplitAllocation } from "./ai-suggestion";
import type { AiSmartSplitRequest, AiSmartSplitResult } from "./ai-types";
import { isSupportedCurrency } from "./ai-types";
import type { SettleResponse } from "./minihub-types";

const CLIENT_TIMEOUT_MS = 13_000;

export async function fetchAiSmartSplit(
  req: AiSmartSplitRequest,
  history: SettleResponse[],
): Promise<AiSmartSplitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch("/api/ai/smart-split", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      throw new Error(`smart-split ${res.status}`);
    }

    const data = (await res.json()) as AiSmartSplitResult;
    if (
      typeof data?.localPct !== "number" ||
      typeof data?.stablePct !== "number" ||
      typeof data?.reservePct !== "number" ||
      !data?.localCurrency
    ) {
      throw new Error("malformed AI response");
    }
    return data;
  } catch {
    return ruleBasedSmartSplit(req, history);
  } finally {
    clearTimeout(timer);
  }
}

export function ruleBasedSmartSplit(
  req: AiSmartSplitRequest,
  history: SettleResponse[],
): AiSmartSplitResult {
  const allocation = computeSmartSplitAllocation({
    amountUSDC: req.amountUSDC,
    preferredCurrency: req.preferredCurrency,
    settlementHistory: history,
    verifiedHuman: req.verifiedHuman,
  });

  const localCurrency = isSupportedCurrency(allocation.localCurrency)
    ? allocation.localCurrency
    : "USDC";

  return {
    source: "rule",
    localPct: allocation.localPct,
    stablePct: allocation.stablePct,
    reservePct: allocation.reservePct,
    localCurrency,
    localAmount: allocation.localAmount,
    stableAmount: allocation.stableAmount,
    reserveAmount: allocation.reserveAmount,
    reason: allocation.reason,
    tip:
      localCurrency === "USDC"
        ? "Keep this in USDC on World Chain for stable savings."
        : `Convert what you spend to ${localCurrency}, keep the rest in USDC.`,
  };
}
