"use client";

import type { Stat } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function StatCard({ stat, index = 0 }: { stat: Stat; index?: number }) {
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 + index * 0.05 }} className="rounded-[16px] bg-white p-3.5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
      <p className="text-[10px] font-semibold text-[#9094A6]">{stat.label}</p>
      <p className="mt-1.5 text-lg font-black tracking-tight text-[#1B1F3B]">{stat.value}</p>
      <p className="mt-0.5 text-[9px] text-[#BCC0CE]">{stat.detail}</p>
    </motion.article>
  );
}
