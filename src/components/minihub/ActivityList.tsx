"use client";

import type { Payout } from "@/lib/minihub-types";
import { motion } from "framer-motion";
import { StatusChip } from "./StatusChip";

export function ActivityList({
  payouts,
  hasReceiptIds,
  onReceiptClick,
}: {
  payouts: Payout[];
  // Set of payout/settlement ids that have a receipt available.
  hasReceiptIds?: Set<string>;
  onReceiptClick?: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {payouts.map((p, i) => {
        const hasReceipt = hasReceiptIds?.has(p.id) ?? false;
        const tappable = hasReceipt && p.status === "settled" && !!onReceiptClick;

        const inner = (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F4F5F9]">
                <span className="text-[10px] font-black text-[#1B1F3B]">
                  {p.sender.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#1B1F3B]">
                  {p.purpose}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-[#9094A6]">
                  {p.direction === "incoming" ? p.sender : p.recipient} ·{" "}
                  {p.timestamp}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-[13px] font-black ${
                  p.status === "settled"
                    ? "text-[#22C55E]"
                    : "text-[#1B1F3B]"
                }`}
              >
                {p.status === "settled" ? "+" : ""}${p.amount.toLocaleString()}
              </p>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                {hasReceipt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#3B3FE7]/8 px-1.5 py-0.5 text-[8px] font-bold text-[#3B3FE7]">
                    Receipt
                  </span>
                )}
                <StatusChip status={p.status} />
              </div>
            </div>
          </>
        );

        return (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={tappable ? { scale: 0.985 } : undefined}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            onClick={
              tappable ? () => onReceiptClick!(p.id) : undefined
            }
            className={`flex items-center justify-between gap-3 rounded-[16px] bg-white p-3.5 shadow-[0_2px_10px_rgba(27,31,59,0.04)] ${
              tappable ? "cursor-pointer" : ""
            }`}
          >
            {inner}
          </motion.article>
        );
      })}
    </div>
  );
}
