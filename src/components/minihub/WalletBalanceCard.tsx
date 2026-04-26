"use client";

import {
  formatFxToken,
  readFxBalances,
  type FxBalances,
} from "@/lib/fx-public-client";
import { requestSponsoredFaucet } from "@/lib/onchain";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

type Props = { walletAddress: `0x${string}` | null | undefined };

export function WalletBalanceCard({ walletAddress }: Props) {
  const [balances, setBalances] = useState<FxBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [dripping, setDripping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const b = await readFxBalances(walletAddress as Address);
      setBalances(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "balance read failed");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDrip() {
    if (!walletAddress) return;
    setDripping(true);
    setError(null);
    try {
      await requestSponsoredFaucet(walletAddress);
      // Give the chain ~1 block to settle before refresh.
      setTimeout(refresh, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "faucet failed");
    } finally {
      setDripping(false);
    }
  }

  if (!walletAddress) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.115 }}
      className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#1B1F3B]">On-chain wallet</p>
          <p className="mt-0.5 text-[10px] text-[#9094A6]">
            Live balances from World Chain mainnet
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#3B3FE7]/8 px-2 py-0.5 text-[9px] font-bold text-[#3B3FE7]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3B3FE7]" />
          Mainnet
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <BalanceTile
          label="USDC"
          value={balances ? formatFxToken(balances.usdc) : "—"}
          tone="indigo"
          loading={loading && !balances}
        />
        <BalanceTile
          label="wMXN"
          value={balances ? formatFxToken(balances.wmxn) : "—"}
          tone="green"
          loading={loading && !balances}
        />
        <BalanceTile
          label="LP shares"
          value={balances ? formatFxToken(balances.lpShares) : "—"}
          tone="amber"
          loading={loading && !balances}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleDrip}
          disabled={dripping}
          className="flex-1 rounded-[12px] bg-[#1B1F3B] py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
        >
          {dripping ? "Dripping…" : "Get demo balance"}
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-[12px] bg-[#F4F5F9] px-4 py-2.5 text-[11px] font-bold text-[#1B1F3B] disabled:opacity-50"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      <p className="mt-2 text-[9px] text-[#BCC0CE]">
        Faucet drops 1,000 USDC + 18,000 wMXN per address (6h cooldown).
        Gas is sponsored by the Workline FX deployer.
      </p>
      {error && (
        <p className="mt-1 text-[10px] font-semibold text-[#EF4444]">{error}</p>
      )}
    </motion.article>
  );
}

function BalanceTile({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: string;
  tone: "indigo" | "green" | "amber";
  loading: boolean;
}) {
  const accent =
    tone === "indigo"
      ? "text-[#3B3FE7] bg-[#3B3FE7]/8"
      : tone === "green"
        ? "text-[#22C55E] bg-[#22C55E]/10"
        : "text-[#A07A1A] bg-[#F0C24A]/15";
  return (
    <div className={`rounded-[12px] p-2.5 ${accent}`}>
      <p className="text-[8px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-black text-[#1B1F3B]">
        {loading ? "…" : value}
      </p>
    </div>
  );
}
