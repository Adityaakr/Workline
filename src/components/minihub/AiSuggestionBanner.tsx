"use client";

import type { SmartSplitSuggestion } from "@/lib/ai-suggestion";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function AiSuggestionBanner({
  suggestion,
  onApply,
}: {
  suggestion: SmartSplitSuggestion;
  onApply: (currencyCode: string) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [autoMonthly, setAutoMonthly] = useState(false);

  if (dismissed || suggestion.stableAmount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative overflow-hidden rounded-[16px] border border-[#3B3FE7]/15 bg-gradient-to-r from-[#3B3FE7]/[0.04] to-[#8B5CF6]/[0.04] p-4"
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 text-[#BCC0CE] hover:text-[#9094A6]"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#3B3FE7]/10">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.5 5.5L14 4L10.5 7.5L15 10L10 9.5L9 15L7 10L1 11.5L5.5 8L1 5L6.5 5.5L8 1Z" fill="#3B3FE7" />
            </svg>
          </div>
          <div className="flex-1 pr-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B3FE7]">
              Workline AI
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#1B1F3B]">
              Convert{" "}
              <span className="text-[#3B3FE7]">
                ${suggestion.localAmount} to {suggestion.localCurrency}
              </span>{" "}
              and keep{" "}
              <span className="text-[#3B3FE7]">
                ${suggestion.stableAmount} in USDC
              </span>
            </p>

            {/* Breakdown */}
            <div className="mt-2.5 grid gap-1">
              {suggestion.breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#9094A6]">{item.label}</span>
                  <span className="text-[10px] font-semibold text-[#1B1F3B]">${item.amount}</span>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[10px] text-[#9094A6]">
              {suggestion.reason}
            </p>

            {/* Auto-monthly toggle */}
            <button
              type="button"
              onClick={() => setAutoMonthly(!autoMonthly)}
              className="mt-2.5 flex items-center gap-2"
            >
              <div className={`h-4 w-7 rounded-full transition-colors ${autoMonthly ? "bg-[#3B3FE7]" : "bg-[#E8EAF0]"}`}>
                <div className={`h-3 w-3 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${autoMonthly ? "translate-x-3.5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-[10px] font-medium text-[#9094A6]">
                Auto-convert every month
              </span>
            </button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onApply(suggestion.localCurrency)}
              className="mt-3 rounded-[10px] bg-[#3B3FE7] px-4 py-1.5 text-[10px] font-bold text-white"
            >
              Apply suggestion
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
