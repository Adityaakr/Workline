"use client";

import type { AiSmartSplitResult } from "@/lib/ai-types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Props = {
  result: AiSmartSplitResult | null;
  loading: boolean;
  applied: boolean;
  onApply: () => void;
};

export function SmartSplitCard({ result, loading, applied, onApply }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!loading && !result) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative overflow-hidden rounded-[16px] border border-[#3B3FE7]/15 bg-gradient-to-r from-[#3B3FE7]/[0.05] to-[#8B5CF6]/[0.05] p-4"
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 text-[#BCC0CE] hover:text-[#9094A6]"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Header source={result?.source} loading={loading} />

        <p className="mt-2 text-[12px] font-semibold text-[#1B1F3B]">
          Suggested allocation for this payout
        </p>

        {loading || !result ? (
          <LoadingSkeleton />
        ) : (
          <Body result={result} applied={applied} onApply={onApply} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Header({
  source,
  loading,
}: {
  source?: AiSmartSplitResult["source"];
  loading: boolean;
}) {
  const live = source === "ai";
  const label = loading
    ? "Workline AI · thinking…"
    : live
      ? "Workline AI · live"
      : "Workline AI · offline heuristic";

  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#3B3FE7]/10">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L9.5 5.5L14 4L10.5 7.5L15 10L10 9.5L9 15L7 10L1 11.5L5.5 8L1 5L6.5 5.5L8 1Z"
            fill="#3B3FE7"
          />
        </svg>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B3FE7]">
        {label}
      </p>
      {!loading && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
            live
              ? "bg-[#DCFCE7] text-[#22C55E]"
              : "bg-[#F4F5F9] text-[#9094A6]"
          }`}
        >
          <span
            className={`h-1 w-1 rounded-full ${
              live ? "bg-[#22C55E]" : "bg-[#BCC0CE]"
            }`}
          />
          {live ? "live" : "fallback"}
        </span>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-3">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8EAF0]">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="h-full w-1/2 rounded-full bg-[#3B3FE7]/30"
        />
      </div>
      <div className="mt-3 grid gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-[#E8EAF0]" />
            <div className="h-3 w-12 rounded bg-[#E8EAF0]" />
          </div>
        ))}
      </div>
      <div className="mt-3 h-3 w-3/4 rounded bg-[#E8EAF0]" />
    </div>
  );
}

function Body({
  result,
  applied,
  onApply,
}: {
  result: AiSmartSplitResult;
  applied: boolean;
  onApply: () => void;
}) {
  const segments = [
    {
      key: "local",
      label: result.localCurrency,
      pct: result.localPct,
      amount: result.localAmount,
      hint: "Spend",
      bar: "bg-[#3B3FE7]",
      pill: "bg-[#3B3FE7]/10 text-[#3B3FE7]",
    },
    {
      key: "stable",
      label: "USDC",
      pct: result.stablePct,
      amount: result.stableAmount,
      hint: "Save",
      bar: "bg-[#22C55E]",
      pill: "bg-[#22C55E]/10 text-[#22C55E]",
    },
    {
      key: "reserve",
      label: "Reserve",
      pct: result.reservePct,
      amount: result.reserveAmount,
      hint: "Buffer",
      bar: "bg-[#F0C24A]",
      pill: "bg-[#F0C24A]/15 text-[#A07A1A]",
    },
  ];

  return (
    <>
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#E8EAF0]">
        {segments.map((s) =>
          s.pct > 0 ? (
            <div
              key={s.key}
              style={{ width: `${s.pct}%` }}
              className={`${s.bar} h-full first:rounded-l-full last:rounded-r-full`}
            />
          ) : null,
        )}
      </div>

      <div className="mt-3 grid gap-1.5">
        {segments.map((s) =>
          s.pct > 0 ? (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${s.pill}`}
                >
                  {s.hint}
                </span>
                <span className="text-[11px] font-semibold text-[#1B1F3B]">
                  {s.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1B1F3B]">
                  ${s.amount.toLocaleString()}
                </p>
                <p className="text-[9px] text-[#9094A6]">{s.pct}%</p>
              </div>
            </div>
          ) : null,
        )}
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-[#5A5F75]">
        {result.reason}
      </p>
      {result.tip && (
        <p className="mt-1 text-[10px] italic text-[#9094A6]">{result.tip}</p>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onApply}
        disabled={applied}
        className={`mt-3 rounded-[10px] px-4 py-1.5 text-[10px] font-bold transition ${
          applied
            ? "bg-[#DCFCE7] text-[#22C55E]"
            : "bg-[#3B3FE7] text-white"
        }`}
      >
        {applied ? "Smart Split applied" : "Apply Smart Split"}
      </motion.button>
    </>
  );
}
