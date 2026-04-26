"use client";

import {
  formatFxToken,
  readFxBalances,
  readFxReserves,
  type FxBalances,
  type FxReserves,
} from "@/lib/fx-public-client";
import { sendAddLiquidity } from "@/lib/onchain";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

const QUICK_ADD_OPTIONS = [
  { label: "$25", usdc: 25 },
  { label: "$100", usdc: 100 },
  { label: "$500", usdc: 500 },
];

export function FxLiveHero() {
  const { data: session } = useSession();
  const wallet = session?.user?.walletAddress as `0x${string}` | undefined;

  const [reserves, setReserves] = useState<FxReserves | null>(null);
  const [balances, setBalances] = useState<FxBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pickedUsdc, setPickedUsdc] = useState<number>(100);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await readFxReserves();
      setReserves(r);
      if (wallet) {
        const b = await readFxBalances(wallet as Address);
        setBalances(b);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "read failed");
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Match the pool's existing ratio when seeding.
  const matchedWmxn =
    reserves && reserves.usdcPerWmxn > 0
      ? pickedUsdc / reserves.usdcPerWmxn
      : 0;

  async function handleAdd() {
    if (!wallet) {
      setError("Sign in with World Wallet first");
      return;
    }
    if (!reserves) {
      setError("Pool not loaded yet");
      return;
    }
    // Pre-flight balance check so we surface a clean message instead of
    // the generic "Something went wrong" that World App returns when its
    // pre-sim catches the safeTransferFrom revert.
    if (balances) {
      const haveUsdc = Number(balances.usdc) / 1_000_000;
      const haveWmxn = Number(balances.wmxn) / 1_000_000;
      if (haveUsdc < pickedUsdc || haveWmxn < matchedWmxn) {
        setError(
          `Need ${pickedUsdc} USDC + ${matchedWmxn.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })} wMXN. You hold ${haveUsdc.toFixed(2)} / ${haveWmxn.toFixed(
            2,
          )}. Tap "Get demo balance" on the Account tab first.`,
        );
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await sendAddLiquidity({
        recipient: wallet,
        amountUsdc: pickedUsdc,
        amountWmxn: matchedWmxn,
      });
      setFeedback(
        `Submitted: $${pickedUsdc} USDC + ${matchedWmxn.toLocaleString(
          undefined,
          { maximumFractionDigits: 2 },
        )} wMXN`,
      );
      setTimeout(refresh, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "addLiquidity failed");
    } finally {
      setSubmitting(false);
    }
  }

  const tvlUsdc = reserves
    ? Number(reserves.reserveUsdc) / 1_000_000
    : 0;
  const tvlWmxn = reserves
    ? Number(reserves.reserveWmxn) / 1_000_000
    : 0;
  const usdcPerWmxn = reserves ? reserves.usdcPerWmxn : 0;
  const wmxnPerUsdc = reserves ? reserves.wmxnPerUsdc : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="rounded-[22px] bg-gradient-to-br from-[#1B1F3B] to-[#2A2F54] p-5 text-white shadow-[0_6px_24px_rgba(27,31,59,0.2)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A5A8FF]">
            USDC / wMXN Pool
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight">
            {loading && !reserves
              ? "…"
              : `$${tvlUsdc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            <span className="ml-1 text-xs font-semibold text-white/50">
              TVL · USDC side
            </span>
          </p>
          <p className="mt-1 text-[11px] text-white/55">
            {tvlWmxn.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            wMXN reserve · 1 USDC ={" "}
            {wmxnPerUsdc.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            wMXN
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/20 px-2.5 py-1 text-[10px] font-bold text-[#4ADE80]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
          Live
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[12px] bg-white/10 p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/55">
            Your LP shares
          </p>
          <p className="mt-1 text-sm font-black">
            {balances ? formatFxToken(balances.lpShares) : "—"}
          </p>
        </div>
        <div className="rounded-[12px] bg-white/10 p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/55">
            Mid-price (USDC/wMXN)
          </p>
          <p className="mt-1 text-sm font-black">
            {usdcPerWmxn > 0
              ? `$${usdcPerWmxn.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}`
              : "—"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#A5A8FF]">
        Provide liquidity (matched ratio)
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {QUICK_ADD_OPTIONS.map((o) => {
          const on = pickedUsdc === o.usdc;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => setPickedUsdc(o.usdc)}
              className={`rounded-[12px] py-2 text-[12px] font-bold transition ${
                on
                  ? "bg-white text-[#1B1F3B]"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-white/55">
        You&apos;ll deposit ${pickedUsdc.toLocaleString()} USDC +{" "}
        {matchedWmxn.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
        wMXN
      </p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleAdd}
        disabled={submitting || !reserves}
        className="mt-3 w-full rounded-[14px] bg-[#3B3FE7] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Confirming…" : "Provide liquidity"}
      </motion.button>

      {feedback && (
        <p className="mt-2 text-[10px] font-semibold text-[#4ADE80]">
          {feedback}
        </p>
      )}
      {error && (
        <p className="mt-2 text-[10px] font-semibold text-[#FCA5A5]">
          {error}
        </p>
      )}
    </motion.article>
  );
}
