"use client";

import type { Payout } from "@/lib/minihub-types";
import { motion } from "framer-motion";
import { StatusChip } from "./StatusChip";

export function ActivityList({ payouts }: { payouts: Payout[] }) {
  return (
    <div className="grid gap-2">
      {payouts.map((p, i) => (
        <motion.article key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }} className="flex items-center justify-between gap-3 rounded-[16px] bg-white p-3.5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F4F5F9]"><span className="text-[10px] font-black text-[#1B1F3B]">{p.sender.slice(0, 2).toUpperCase()}</span></div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#1B1F3B]">{p.purpose}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#9094A6]">{p.direction === "incoming" ? p.sender : p.recipient} · {p.timestamp}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[13px] font-black ${p.status === "settled" ? "text-[#22C55E]" : "text-[#1B1F3B]"}`}>{p.status === "settled" ? "+" : ""}${p.amount.toLocaleString()}</p>
            <div className="mt-1 flex justify-end"><StatusChip status={p.status} /></div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
