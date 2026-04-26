"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { FxLiveHero } from "@/components/minihub/FxLiveHero";
import { pools as fxPools } from "@/data/minihub";
import { FX_ADDRESSES } from "@/lib/fx-contracts";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function shortAddr(addr: `0x${string}`) {
  return `${addr.slice(0, 6)}...${addr.slice(-5)}`;
}

const poolComposition: Record<string, { asset: string; address: string; share: string }[]> = {
  "USDC / wMXN": [
    { asset: "USDC", address: shortAddr(FX_ADDRESSES.usdc), share: "52%" },
    { asset: "wMXN", address: shortAddr(FX_ADDRESSES.wmxn), share: "48%" },
  ],
  "USDC / wBRL": [
    { asset: "USDC", address: shortAddr(FX_ADDRESSES.usdc), share: "54%" },
    { asset: "wBRL", address: "0x7c2D...f1A09", share: "46%" },
  ],
  "USDC / wINR": [
    { asset: "USDC", address: shortAddr(FX_ADDRESSES.usdc), share: "51%" },
    { asset: "wINR", address: "0x5b8E...c4D72", share: "49%" },
  ],
};

export default function FXPage() {
  const [expandedPool, setExpandedPool] = useState<string | null>(null);

  return (
    <AppShell active="fx">
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1B1F3B]">FX & Liquidity</h2>
        <p className="mt-1 text-xs text-[#9094A6]">Uniswap v4 hooks on World Chain</p>
      </div>

      {/* Live USDC/wMXN pool — real reserves + LP add */}
      <div className="mt-5">
        <FxLiveHero />
      </div>

      {/* Active pools with inline expand */}
      <div className="mt-5">
        <p className="mb-3 text-sm font-bold text-[#1B1F3B]">Active Pools</p>
        <div className="grid gap-2.5">
          {fxPools.map((p, i) => {
            const isExpanded = expandedPool === p.pair;
            const composition = poolComposition[p.pair] ?? [];

            return (
              <motion.div
                key={p.pair}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.12 + i * 0.06 }}
                className="overflow-hidden rounded-[16px] bg-white shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
              >
                {/* Pool header row */}
                <button
                  type="button"
                  onClick={() => setExpandedPool(isExpanded ? null : p.pair)}
                  className="flex w-full items-center justify-between p-4 text-left active:bg-[#F4F5F9]/60 transition"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1B1F3B]">{p.pair}</p>
                    <p className="mt-0.5 text-[10px] text-[#9094A6]">
                      TVL: {p.tvl} · Vol: {p.volume}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-[10px] bg-[#3B3FE7]/8 px-3 py-1.5 text-sm font-bold text-[#3B3FE7]">
                      {p.apy}
                    </span>
                    <motion.svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="text-[#BCC0CE]"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </div>
                </button>

                {/* Expanded detail section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#F4F5F9] px-4 pb-4 pt-3">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "TVL", value: p.tvl },
                            { label: "24h Volume", value: p.volume },
                            { label: "APY", value: p.apy },
                          ].map((s) => (
                            <div key={s.label} className="rounded-[10px] bg-[#F4F5F9] py-2 text-center">
                              <p className="text-xs font-bold text-[#1B1F3B]">{s.value}</p>
                              <p className="mt-0.5 text-[8px] text-[#9094A6]">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Asset composition */}
                        <p className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-wider text-[#9094A6]">
                          Composition
                        </p>
                        <div className="grid gap-1.5">
                          {composition.map((asset) => (
                            <div
                              key={asset.asset}
                              className="flex items-center justify-between rounded-[10px] border border-[#F4F5F9] bg-[#FAFBFD] px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="grid h-7 w-7 place-items-center rounded-full bg-[#3B3FE7]/8">
                                  <span className="text-[9px] font-bold text-[#3B3FE7]">
                                    {asset.asset.slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-[#1B1F3B]">{asset.asset}</p>
                                  <p className="text-[8px] font-mono text-[#BCC0CE]">{asset.address}</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#1B1F3B]">{asset.share}</span>
                            </div>
                          ))}
                        </div>

                        {/* Hook details */}
                        <div className="mt-3 rounded-[10px] bg-[#3B3FE7]/5 px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <circle cx="6" cy="6" r="5" fill="#3B3FE7" />
                              <path d="M4 6L5.5 7.5L8 4.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
                            </svg>
                            <p className="text-[9px] font-bold text-[#3B3FE7]">World ID Rebate Hook Active</p>
                          </div>
                          <p className="mt-1 text-[8px] leading-relaxed text-[#3B3FE7]/70">
                            beforeSwap reads World ID proof on-chain · Fee: 30 bps → 5 bps for verified humans
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5"
      >
        <p className="mb-3 text-sm font-bold text-[#1B1F3B]">How Workline FX Works</p>
        <div className="grid gap-2">
          {[
            {
              step: "1",
              title: "Payout arrives in USDC",
              desc: "Employer sends stablecoins on World Chain. Gas-free for verified humans.",
            },
            {
              step: "2",
              title: "Uniswap v4 hook routes the swap",
              desc: "A custom beforeSwap hook checks World ID proof on-chain and applies a fee discount.",
            },
            {
              step: "3",
              title: "Worker receives local stablecoin",
              desc: "USDC is converted to wMXN, wBRL, or wINR at the best rate with reduced slippage.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#3B3FE7]">
                <span className="text-[10px] font-bold text-white">{item.step}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1B1F3B]">{item.title}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[#9094A6]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fee comparison */}
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-5 rounded-[20px] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
      >
        <p className="text-xs font-bold text-[#1B1F3B]">Fee Comparison: $1,000 USDC → wMXN</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-[#E8EAF0] bg-[#F4F5F9] p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9094A6]">Standard</p>
            <p className="mt-1.5 text-lg font-black text-[#1B1F3B]">0.30%</p>
            <p className="mt-0.5 text-[10px] text-[#9094A6]">$3.00 fee</p>
            <p className="mt-1 text-[10px] text-[#BCC0CE]">No rebate</p>
          </div>
          <div className="rounded-[12px] border border-[#3B3FE7]/20 bg-[#3B3FE7]/5 p-3">
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#3B3FE7]">Verified Human</p>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" fill="#3B3FE7" />
                <path d="M3.5 5L4.5 6L6.5 4" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-1.5 text-lg font-black text-[#3B3FE7]">0.05%</p>
            <p className="mt-0.5 text-[10px] text-[#3B3FE7]">$0.50 fee</p>
            <p className="mt-1 text-[10px] font-bold text-[#22C55E]">+$2.50 saved</p>
          </div>
        </div>
        <p className="mt-3 text-[9px] leading-relaxed text-[#BCC0CE]">
          The Uniswap v4 beforeSwap hook reads a World ID Merkle proof on-chain. If the caller is a verified human, the hook reduces the LP fee from 30 bps to 5 bps and emits a RebateApplied event for off-chain tracking.
        </p>
      </motion.article>

      {/* Supported routes */}
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5 rounded-[20px] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
      >
        <p className="text-xs font-bold text-[#1B1F3B]">Supported Payout Routes</p>
        <div className="mt-3 grid gap-1.5">
          {[
            { from: "USDC", to: "wMXN", rate: "17.42", status: "Live" },
            { from: "USDC", to: "wBRL", rate: "5.04", status: "Live" },
            { from: "USDC", to: "wINR", rate: "83.45", status: "Live" },
            { from: "USDC", to: "wNGN", rate: "1,580", status: "Soon" },
            { from: "USDC", to: "wKES", rate: "129.5", status: "Soon" },
          ].map((r) => (
            <div key={r.to} className="flex items-center justify-between rounded-[10px] bg-[#FAFBFD] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#1B1F3B]">{r.from} → {r.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9094A6]">1:{r.rate}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                  r.status === "Live" ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#F4F5F9] text-[#9094A6]"
                }`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.article>
    </AppShell>
  );
}
