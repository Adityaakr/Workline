import { currencies } from "@/data/minihub";
import { payouts } from "@/data/minihub";
import type { SettleRequest, SettleResponse } from "@/lib/minihub-types";
import { computeSettlementQuote } from "@/lib/settlement-quote";
import { NextRequest, NextResponse } from "next/server";

/**
 * Demo settlement endpoint — returns a mock settlement result.
 * In production this would execute an on-chain transaction and
 * verify the result server-side before responding.
 */
export async function POST(req: NextRequest) {
  let body: SettleRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { payoutId, amountUSDC, selectedCurrency, verifiedHuman } = body;
  if (!payoutId || !amountUSDC || !selectedCurrency) {
    return NextResponse.json(
      { error: "payoutId, amountUSDC, and selectedCurrency are required" },
      { status: 400 },
    );
  }

  const currency = currencies.find((c) => c.code === selectedCurrency);
  if (!currency) {
    return NextResponse.json(
      { error: `Unsupported currency: ${selectedCurrency}` },
      { status: 400 },
    );
  }

  const payout = payouts.find((p) => p.id === payoutId);

  const { receivedAmount, fee, rebateAmount, route } = computeSettlementQuote({
    amountUSDC,
    currency,
    verifiedHuman: !!verifiedHuman,
  });

  const now = new Date();
  const settlementId = `STL-${now.getTime().toString(36).toUpperCase()}`;

  const hashInput = `${payoutId}:${amountUSDC}:${selectedCurrency}:${now.toISOString()}`;
  const hashBytes = new TextEncoder().encode(hashInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", hashBytes);
  const txHash = `0x${Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

  const result: SettleResponse = {
    settlementId,
    status: "completed",
    txHash,
    route,
    receivedAmount,
    rebateAmount,
    selectedCurrency,
    timestamp: now.toISOString(),
    fee,
    sourceAmount: amountUSDC,
    payoutId,
    payoutPurpose: payout?.purpose ?? "Payout",
    payoutSender: payout?.sender ?? "Unknown",
    verifiedHuman: !!verifiedHuman,
  };

  return NextResponse.json(result);
}
