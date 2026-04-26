"use client";

import type { Payout } from "@/lib/minihub-types";
import { motion } from "framer-motion";
import Link from "next/link";

export function IncomingPayoutCard({ payout }: { payout: Payout }) {
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="rounded-[20px] bg-[#1B1F3B] p-5 text-white shadow-[0_6px_24px_rgba(27,31,59,0.15)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B8FFF]">Incoming payout ready</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">${payout.amount.toLocaleString()} {payout.sourceCurrency}</h2>
          <p className="mt-1 text-[11px] text-white/40">{payout.sender} · {payout.purpose}</p>
        </div>
        <span className="rounded-full bg-[#3B3FE7]/20 px-2.5 py-1 text-[9px] font-bold text-[#8B8FFF]">Ready</span>
      </div>
      <Link href="/settle"><motion.div whileTap={{ scale: 0.98 }} className="mt-4 flex w-full justify-center rounded-[12px] bg-white py-2.5 text-sm font-bold text-[#1B1F3B]">Choose settlement →</motion.div></Link>
    </motion.article>
  );
}
