"use client";

import { AiSuggestionBanner } from "@/components/minihub/AiSuggestionBanner";
import { AppShell } from "@/components/minihub/AppShell";
import { RebateBadge } from "@/components/minihub/RebateBadge";
import { SettlementQuoteCard } from "@/components/minihub/SettlementQuoteCard";
import { currencies, payouts } from "@/data/minihub";
import { computeSmartSplit } from "@/lib/ai-suggestion";
import { useDemoState } from "@/lib/demo-state";
import { isRunningInWorldApp } from "@/lib/integrations/minikit";
import type { Currency, SettleResponse } from "@/lib/minihub-types";
import {
  explorerTxUrl,
  getUserWalletAddress,
  pollUserOpReceipt,
  sendDemoTransfer,
} from "@/lib/onchain";
import { computeSettlementQuote } from "@/lib/settlement-quote";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SettleStep = "idle" | "submitting" | "confirming" | "done";

export default function SettlePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    verifiedHuman,
    preferredCurrency,
    completedSettlements,
    consumedPayoutIds,
    consumePayout,
    appendSettlement,
    setLastSettlement,
  } = useDemoState();

  const readyPayout = useMemo(
    () =>
      payouts.find(
        (p) => p.status === "ready" && !consumedPayoutIds.includes(p.id),
      ) ?? null,
    [consumedPayoutIds],
  );

  const [selected, setSelected] = useState<Currency>(currencies[0]);
  const [step, setStep] = useState<SettleStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const inWorldApp = useMemo(() => {
    try {
      return isRunningInWorldApp();
    } catch {
      return false;
    }
  }, []);

  const smartSplit = useMemo(
    () =>
      readyPayout
        ? computeSmartSplit({
            amountUSDC: readyPayout.amount,
            preferredCurrency,
            settlementHistory: completedSettlements,
            verifiedHuman,
          })
        : null,
    [readyPayout, preferredCurrency, completedSettlements, verifiedHuman],
  );

  const quote = computeSettlementQuote({
    amountUSDC: readyPayout?.amount ?? 0,
    currency: selected,
    verifiedHuman,
  });

  const stepLabel: Record<SettleStep, string> = {
    idle: `Confirm Payout in ${selected.code}`,
    submitting: "Submitting transaction…",
    confirming: "Confirming on-chain…",
    done: "Settlement complete",
  };

  // ── On-chain payment via MiniKit.sendTransaction() ──────────────────
  async function handleOnchainSettle() {
    if (!readyPayout) return;
    setStep("submitting");
    let wallet = getUserWalletAddress();
    if (!wallet && session?.user?.walletAddress) {
      wallet = session.user.walletAddress as `0x${string}`;
    }
    if (!wallet) throw new Error("Wallet address not available. Sign in first.");

    const { userOpHash } = await sendDemoTransfer(wallet);

    setStep("confirming");

    let transactionHash = userOpHash;
    try {
      const receipt = await pollUserOpReceipt(userOpHash);
      transactionHash = receipt.transactionHash;
    } catch {
      // Pay API may return final tx directly; use the transactionId
    }

    const result: SettleResponse = {
      settlementId: `STL-${Date.now().toString(36).toUpperCase()}`,
      status: "completed",
      txHash: transactionHash,
      userOpHash,
      onchain: true,
      explorerUrl: explorerTxUrl(transactionHash),
      route: selected.code === "USDC"
        ? "USDC → World Chain"
        : `USDC → ${selected.code} (World Chain)`,
      receivedAmount: quote.receivedAmount,
      rebateAmount: quote.rebateAmount,
      selectedCurrency: selected.code,
      timestamp: new Date().toISOString(),
      fee: quote.fee,
      sourceAmount: readyPayout.amount,
      payoutId: readyPayout.id,
      payoutPurpose: readyPayout.purpose,
      payoutSender: readyPayout.sender,
      verifiedHuman,
    };

    setLastSettlement(result);
    appendSettlement(result);
    consumePayout(readyPayout.id);
    router.push("/settle/success");
  }

  // ── Mock fallback (when outside World App) ──────────────────────────
  async function handleMockSettle() {
    if (!readyPayout) return;
    setStep("submitting");
    const res = await fetch("/api/settle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payoutId: readyPayout.id,
        amountUSDC: readyPayout.amount,
        selectedCurrency: selected.code,
        verifiedHuman,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Settlement failed" }));
      throw new Error(err.error || "Settlement failed");
    }
    const result: SettleResponse = await res.json();
    setLastSettlement(result);
    appendSettlement(result);
    consumePayout(readyPayout.id);
    router.push("/settle/success");
  }

  // ── Main handler: routes to the right path ──────────────────────────
  async function handleSettle() {
    setError(null);
    try {
      if (inWorldApp) {
        await handleOnchainSettle();
      } else {
        await handleMockSettle();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settlement failed");
      setStep("idle");
    }
  }

  if (!readyPayout) {
    return (
      <AppShell active="settle">
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#DCFCE7]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 19L21 9" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-black text-[#1B1F3B]">All caught up</h2>
          <p className="mt-2 text-sm text-[#9094A6]">No payouts waiting to be settled.</p>
          <p className="mt-1 text-xs text-[#BCC0CE]">
            {completedSettlements.length} settlement{completedSettlements.length !== 1 ? "s" : ""} completed
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
            className="mt-8 rounded-[14px] bg-[#1B1F3B] px-8 py-3 text-sm font-bold text-white"
          >
            Back to Home
          </motion.button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="settle">
      <section className="mt-2 space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1B1F3B]">
              Receive Payout
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                inWorldApp
                  ? "bg-[#DCFCE7] text-[#22C55E]"
                  : "bg-[#F4F5F9] text-[#9094A6]"
              }`}
            >
              {inWorldApp ? "Live on World Chain" : "Demo mode"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9094A6]">
            {readyPayout.purpose} · {readyPayout.sender}
          </p>
        </motion.div>

        {/* Amount hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[22px] bg-white p-6 text-center shadow-[0_2px_16px_rgba(27,31,59,0.06)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9094A6]">
            Amount Available
          </p>
          <p className="mt-2">
            <span className="text-[42px] font-black tracking-tight text-[#1B1F3B]">
              ${readyPayout.amount.toLocaleString()}
            </span>
            <span className="text-lg font-semibold text-[#BCC0CE]">.00</span>
          </p>
          <p className="mt-1 text-[10px] text-[#BCC0CE]">
            USDC on World Chain
          </p>
        </motion.div>

        {/* AI suggestion */}
        {smartSplit && (
          <AiSuggestionBanner
            suggestion={smartSplit}
            onApply={(code) => {
              const match = currencies.find((c) => c.code === code);
              if (match) setSelected(match);
            }}
          />
        )}

        {/* Currency selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <p className="mb-3 text-sm font-bold text-[#1B1F3B]">
            Choose settlement currency
          </p>
          <div className="grid gap-2">
            {currencies.map((c) => {
              const on = selected.code === c.code;
              return (
                <motion.button
                  key={c.code}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(c)}
                  className={`flex items-center justify-between rounded-[16px] border p-4 text-left transition ${
                    on
                      ? "border-[#3B3FE7] bg-[#3B3FE7]/5"
                      : "border-[#E8EAF0] bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-[#1B1F3B]">{c.code}</p>
                    <p className="mt-0.5 text-[10px] text-[#9094A6]">
                      {c.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#1B1F3B]">
                      1 USDC = {c.rate}
                    </p>
                    {c.code !== "USDC" && (
                      <p
                        className={`mt-0.5 text-[10px] font-semibold ${
                          verifiedHuman
                            ? "text-[#3B3FE7]"
                            : "text-[#9094A6]"
                        }`}
                      >
                        {verifiedHuman ? "Rebate: 0.08%" : "Verify for rebate"}
                      </p>
                    )}
                    {c.code !== "USDC" && inWorldApp && (
                      <p className="mt-0.5 text-[8px] text-[#BCC0CE]">
                        via Uniswap Swap
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="mb-3 text-sm font-bold text-[#1B1F3B]">
            Payout Summary
          </p>
          <SettlementQuoteCard
            amount={readyPayout.amount}
            from="USDC"
            to={selected}
            verifiedHuman={verifiedHuman}
          />
          <div className="mt-3">
            <RebateBadge
              amount={
                quote.rebateAmount > 0 ? quote.rebateAmount : undefined
              }
              eligible={verifiedHuman}
            />
          </div>
        </motion.div>

        {error && (
          <p className="text-center text-xs font-semibold text-[#EF4444]">
            {error}
          </p>
        )}

        {/* CTA */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleSettle}
          disabled={step !== "idle"}
          className="w-full rounded-[16px] bg-[#3B3FE7] py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(59,63,231,0.25)] disabled:opacity-60"
        >
          {stepLabel[step]}
        </motion.button>
      </section>
    </AppShell>
  );
}
