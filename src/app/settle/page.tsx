"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { DevPortalAllowlistCard } from "@/components/minihub/DevPortalAllowlistCard";
import { RebateBadge } from "@/components/minihub/RebateBadge";
import { SettlementQuoteCard } from "@/components/minihub/SettlementQuoteCard";
import { SmartSplitCard } from "@/components/minihub/SmartSplitCard";
import { WorldChatApprovalCard } from "@/components/minihub/WorldChatApprovalCard";
import {
  currencies,
  getWorldChatApprovalByPayoutId,
  payouts,
} from "@/data/minihub";
import { fetchAiSmartSplit, ruleBasedSmartSplit } from "@/lib/ai-client";
import type { AiSmartSplitResult } from "@/lib/ai-types";
import { useDemoState } from "@/lib/demo-state";
import { isRunningInWorldApp } from "@/lib/integrations/minikit";
import type {
  Currency,
  SettleResponse,
  SplitBuckets,
} from "@/lib/minihub-types";
import {
  explorerTxUrl,
  getUserWalletAddress,
  pollUserOpReceipt,
  requestSponsoredFaucet,
  requestSponsoredSettleSwap,
  sendDemoTransfer,
  sendUsdcToWmxnSwap,
} from "@/lib/onchain";
import { tokenUnits, waitForMinTokenBalance } from "@/lib/fx-public-client";
import { FX_ADDRESSES } from "@/lib/fx-contracts";
import {
  buildCreditLineTeaser,
  buildVerifiedIncomeReceipt,
} from "@/lib/receipts";
import { computeSettlementQuote } from "@/lib/settlement-quote";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [smartSplitApplied, setSmartSplitApplied] = useState(false);
  const [smartSplit, setSmartSplit] = useState<AiSmartSplitResult | null>(null);
  const [smartSplitLoading, setSmartSplitLoading] = useState(false);

  const inWorldApp = useMemo(() => {
    try {
      return isRunningInWorldApp();
    } catch {
      return false;
    }
  }, []);

  // Ask the live AI for a Smart Split whenever the ready payout changes.
  // The endpoint is server-side and falls back to a rule-based engine
  // if OpenRouter is unreachable, so this UI is never blocked.
  useEffect(() => {
    if (!readyPayout) {
      setSmartSplit(null);
      return;
    }

    let cancelled = false;
    const seedHistory = completedSettlements;
    const req = {
      amountUSDC: readyPayout.amount,
      preferredCurrency,
      verifiedHuman,
      payerName: readyPayout.sender,
      payoutPurpose: readyPayout.purpose,
      recentSettlements: seedHistory.slice(0, 5).map((s) => ({
        amountUSDC: s.sourceAmount,
        selectedCurrency: s.selectedCurrency,
        verifiedHuman: s.verifiedHuman,
      })),
    };

    setSmartSplit(ruleBasedSmartSplit(req, seedHistory));
    setSmartSplitLoading(true);
    setSmartSplitApplied(false);

    fetchAiSmartSplit(req, seedHistory)
      .then((res) => {
        if (cancelled) return;
        setSmartSplit(res);
      })
      .finally(() => {
        if (!cancelled) setSmartSplitLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readyPayout, preferredCurrency, verifiedHuman, completedSettlements]);

  const approval = useMemo(
    () => (readyPayout ? getWorldChatApprovalByPayoutId(readyPayout.id) : null),
    [readyPayout],
  );

  // When a Smart Split is applied, only the local-spend bucket flows
  // through the FX swap; the rest stays as USDC narratively.
  const splitActive =
    smartSplitApplied && !!smartSplit && smartSplit.localPct > 0;

  const splitBuckets: SplitBuckets | undefined = splitActive
    ? {
        localCurrency: smartSplit!.localCurrency,
        localUsdc: smartSplit!.localAmount,
        stableUsdc: smartSplit!.stableAmount,
        reserveUsdc: smartSplit!.reserveAmount,
      }
    : undefined;

  const effectiveAmount = splitActive
    ? smartSplit!.localAmount
    : (readyPayout?.amount ?? 0);

  const quote = computeSettlementQuote({
    amountUSDC: effectiveAmount,
    currency: selected,
    verifiedHuman,
  });

  const idleLabel = splitActive
    ? "Confirm Smart Split"
    : `Confirm Payout in ${selected.code}`;

  const stepLabel: Record<SettleStep, string> = {
    idle: idleLabel,
    submitting: "Submitting transaction…",
    confirming: "Confirming on-chain…",
    done: "Settlement complete",
  };

  // ── On-chain payment via MiniKit.sendTransaction() ──────────────────
  //
  // Two paths:
  //   - If the user is settling into wMXN, we run a REAL swap on the
  //     Workline FX pool (USDC → wMXN). The user signs one bundled tx
  //     containing approve(pool) + pool.swap(...).
  //   - Otherwise (USDC, USD, etc.) we fall back to a tiny WLD self-
  //     transfer so the demo always produces a real on-chain tx hash.
  async function handleOnchainSettle() {
    if (!readyPayout) return;
    setStep("submitting");
    let wallet = getUserWalletAddress();
    if (!wallet && session?.user?.walletAddress) {
      wallet = session.user.walletAddress as `0x${string}`;
    }
    if (!wallet) throw new Error("Wallet address not available. Sign in first.");

    const swapToWmxn = selected.code === "MXN" && effectiveAmount > 0;

    let userOpHash: string | undefined;
    let directTxHash: `0x${string}` | undefined;
    let sponsored = false;
    if (swapToWmxn) {
      // Guarantee the wallet holds enough USDC for the swap BEFORE we
      // open the World App popup. The faucet route owner-mints any
      // deficit and waits for the receipt, but World App reads from
      // its own RPC node — so we ALSO poll our public client until the
      // balance is visible here. Without this double-check, MiniKit's
      // pre-confirm simulation can race the mint receipt and the popup
      // shows "something went wrong" instead of "Receive X wMXN".
      const minUsdcWithSlippage = effectiveAmount * 1.01;
      try {
        await requestSponsoredFaucet(wallet, {
          minUsdc: minUsdcWithSlippage,
        });
      } catch (e) {
        console.warn("faucet top-up failed", e);
      }
      const finalBalance = await waitForMinTokenBalance({
        owner: wallet,
        token: FX_ADDRESSES.usdc,
        minRaw: tokenUnits(minUsdcWithSlippage),
        timeoutMs: 12_000,
      });
      if (finalBalance < tokenUnits(effectiveAmount)) {
        throw new Error(
          `Wallet does not yet hold ${effectiveAmount} USDC after top-up — please retry in a few seconds.`,
        );
      }

      // Try the user-signed bundled swap first. If World App rejects
      // it (invalid_contract / disallowed_operation / simulation_failed
      // — usually a Dev Portal allowlist edge case), gracefully fall
      // back to the server-sponsored path so the demo still settles
      // end-to-end with real on-chain wMXN landing in the user's
      // wallet from the same Workline FX pool.
      try {
        const swap = await sendUsdcToWmxnSwap({
          recipient: wallet,
          amountUsdc: effectiveAmount,
        });
        userOpHash = swap.userOpHash;
      } catch (e) {
        const code =
          e && typeof e === "object" && "code" in e
            ? ((e as { code?: string }).code ?? null)
            : null;
        const recoverable =
          code === "invalid_contract" ||
          code === "disallowed_operation" ||
          code === "simulation_failed";
        if (!recoverable) throw e;
        const sponsoredResult = await requestSponsoredSettleSwap({
          recipient: wallet,
          amountUsdc: effectiveAmount,
        });
        directTxHash = sponsoredResult.swapTxHash;
        sponsored = true;
      }
    } else {
      const tx = await sendDemoTransfer(wallet);
      userOpHash = tx.userOpHash;
    }

    setStep("confirming");

    let transactionHash = directTxHash ?? userOpHash ?? "";
    if (!sponsored && userOpHash) {
      try {
        const receipt = await pollUserOpReceipt(userOpHash);
        transactionHash = receipt.transactionHash;
      } catch {
        // Pay API may return final tx directly; use the transactionId
      }
    }

    const settlementId = `STL-${Date.now().toString(36).toUpperCase()}`;
    const explorerUrl = explorerTxUrl(transactionHash);
    const receipt = buildVerifiedIncomeReceipt({
      settlementId,
      payout: readyPayout,
      receivedAmount: quote.receivedAmount,
      receivedCurrency: selected.code,
      txHash: transactionHash,
      explorerUrl,
      verifiedHuman,
      splitBuckets,
    });
    const creditTeaser = buildCreditLineTeaser([
      ...completedSettlements,
      { sourceAmount: readyPayout.amount, verifiedHuman } as SettleResponse,
    ]);

    const result: SettleResponse = {
      settlementId,
      status: "completed",
      txHash: transactionHash,
      userOpHash,
      onchain: true,
      explorerUrl,
      route: selected.code === "USDC"
        ? "USDC → World Chain"
        : sponsored
          ? `USDC → ${selected.code} (Workline FX pool, sponsored)`
          : `USDC → ${selected.code} (World Chain)`,
      receivedAmount: quote.receivedAmount,
      rebateAmount: quote.rebateAmount,
      selectedCurrency: selected.code,
      timestamp: new Date().toISOString(),
      fee: quote.fee,
      sourceAmount: readyPayout.amount,
      convertedUsdc: effectiveAmount,
      payoutId: readyPayout.id,
      payoutPurpose: readyPayout.purpose,
      payoutSender: readyPayout.sender,
      verifiedHuman,
      receipt,
      smartSplitApplied,
      splitBuckets,
      creditTeaser,
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
        amountUSDC: effectiveAmount,
        selectedCurrency: selected.code,
        verifiedHuman,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Settlement failed" }));
      throw new Error(err.error || "Settlement failed");
    }
    const base: SettleResponse = await res.json();
    const receipt = buildVerifiedIncomeReceipt({
      settlementId: base.settlementId,
      payout: readyPayout,
      receivedAmount: base.receivedAmount,
      receivedCurrency: base.selectedCurrency,
      txHash: base.txHash,
      explorerUrl: base.explorerUrl,
      verifiedHuman,
      splitBuckets,
    });
    const creditTeaser = buildCreditLineTeaser([
      ...completedSettlements,
      { sourceAmount: readyPayout.amount, verifiedHuman } as SettleResponse,
    ]);
    const result: SettleResponse = {
      ...base,
      // Override the API's sourceAmount so the receipt/success page
      // shows the FULL payout, not just the converted leg.
      sourceAmount: readyPayout.amount,
      convertedUsdc: effectiveAmount,
      receipt,
      smartSplitApplied,
      splitBuckets,
      creditTeaser,
    };
    setLastSettlement(result);
    appendSettlement(result);
    consumePayout(readyPayout.id);
    router.push("/settle/success");
  }

  // ── Main handler: routes to the right path ──────────────────────────
  async function handleSettle() {
    setError(null);
    setErrorCode(null);
    try {
      if (inWorldApp) {
        await handleOnchainSettle();
      } else {
        await handleMockSettle();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settlement failed");
      const code =
        e && typeof e === "object" && "code" in e
          ? ((e as { code?: string }).code ?? null)
          : null;
      setErrorCode(code);
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

        {/* World Chat approval (settlement trigger) */}
        {approval && <WorldChatApprovalCard approval={approval} />}

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

        {/* AI Smart Split (live via OpenRouter, falls back to rule-based) */}
        {(smartSplitLoading || smartSplit) && (
          <SmartSplitCard
            result={smartSplit}
            loading={smartSplitLoading}
            applied={smartSplitApplied}
            onApply={() => {
              if (!smartSplit) return;
              const match = currencies.find(
                (c) => c.code === smartSplit.localCurrency,
              );
              if (match) setSelected(match);
              setSmartSplitApplied(true);
            }}
          />
        )}

        {/* Split summary strip — explains exactly what will be settled */}
        {splitActive && smartSplit && readyPayout && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[14px] border border-[#3B3FE7]/20 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B3FE7]">
                You&apos;re settling
              </p>
              <button
                type="button"
                onClick={() => setSmartSplitApplied(false)}
                className="text-[10px] font-bold text-[#9094A6] underline"
              >
                Undo split
              </button>
            </div>
            <p className="mt-1.5 text-[12px] font-bold text-[#1B1F3B]">
              ${smartSplit.localAmount.toLocaleString()} of $
              {readyPayout.amount.toLocaleString()} into{" "}
              {smartSplit.localCurrency}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Bucket
                label="Spend"
                amount={smartSplit.localAmount}
                hint={smartSplit.localCurrency}
                tone="indigo"
                active
              />
              <Bucket
                label="Save"
                amount={smartSplit.stableAmount}
                hint="USDC"
                tone="green"
              />
              <Bucket
                label="Reserve"
                amount={smartSplit.reserveAmount}
                hint="USDC"
                tone="amber"
              />
            </div>
            <p className="mt-2 text-[9px] text-[#9094A6]">
              Only the spend bucket is converted now. Save + Reserve stay as
              USDC in your wallet.
            </p>
          </motion.div>
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
            amount={effectiveAmount}
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

        {/* Destination amount callout — visible right above the CTA so
            the user knows EXACTLY what's about to land in their wallet,
            even if the World App popup chrome is sparse. */}
        {effectiveAmount > 0 && quote.receivedAmount > 0 && (
          <div className="rounded-[16px] border border-[#3B3FE7]/15 bg-[#EEF0FF] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B3FE7]/80">
              You will receive
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="text-2xl font-bold leading-none text-[#1B1F3B]">
                {quote.receivedAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-base font-semibold text-[#1B1F3B]/70">
                  {selected.code === "MXN" ? "wMXN" : selected.code}
                </span>
              </p>
              <p className="text-[11px] font-medium text-[#1B1F3B]/60">
                from ${effectiveAmount.toLocaleString()} USDC
              </p>
            </div>
            {selected.code === "MXN" && inWorldApp && (
              <p className="mt-2 text-[11px] leading-snug text-[#1B1F3B]/55">
                World App will show this as the balance change after you
                confirm — sign once to approve + swap on the Workline FX
                pool.
              </p>
            )}
          </div>
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

type BucketTone = "indigo" | "green" | "amber";

function Bucket({
  label,
  amount,
  hint,
  tone,
  active = false,
}: {
  label: string;
  amount: number;
  hint: string;
  tone: BucketTone;
  active?: boolean;
}) {
  const bg =
    tone === "indigo"
      ? "bg-[#3B3FE7]/8"
      : tone === "green"
        ? "bg-[#22C55E]/10"
        : "bg-[#F0C24A]/15";
  const text =
    tone === "indigo"
      ? "text-[#3B3FE7]"
      : tone === "green"
        ? "text-[#22C55E]"
        : "text-[#A07A1A]";
  return (
    <div
      className={`rounded-[10px] p-2 text-left ${bg} ${active ? "ring-1 ring-[#3B3FE7]/40" : ""}`}
    >
      <p
        className={`text-[8px] font-bold uppercase tracking-wider ${text}`}
      >
        {label}
      </p>
      <p className="mt-0.5 text-[12px] font-black text-[#1B1F3B]">
        ${amount.toLocaleString()}
      </p>
      <p className="text-[8px] text-[#9094A6]">{hint}</p>
    </div>
  );
}
