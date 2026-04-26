"use client";

import type { PayoutMixItem } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function PayoutMix({ items }: { items: PayoutMixItem[] }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="mt-4 rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(27,31,59,0.06)]">
      <p className="text-sm font-bold text-[#1B1F3B]">Payout Mix</p>
      <div className="mt-3 flex h-[5px] gap-0.5 overflow-hidden rounded-full">
        {items.map((it) => <motion.div key={it.label} initial={{ width: 0 }} animate={{ width: `${it.percent}%` }} transition={{ duration: 0.7, delay: 0.35 }} className="h-full rounded-full" style={{ backgroundColor: it.color }} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-y-2.5 gap-x-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: it.color }} /><span className="text-xs text-[#9094A6]">{it.label}</span></div>
            <span className="text-xs font-bold text-[#1B1F3B]">{it.amount}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
