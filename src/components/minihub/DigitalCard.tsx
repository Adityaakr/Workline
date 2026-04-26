"use client";

import { motion } from "framer-motion";

export function DigitalCard() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-4">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1B1F3B] via-[#2A2F55] to-[#3B3FE7] p-5 text-white shadow-[0_6px_24px_rgba(27,31,59,0.18)]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">Workline FX</span>
            <svg width="28" height="18" viewBox="0 0 28 18" fill="none"><circle cx="10" cy="9" r="8" fill="white" fillOpacity="0.2" /><circle cx="18" cy="9" r="8" fill="white" fillOpacity="0.12" /></svg>
          </div>
          <p className="mt-4 text-[26px] font-black tracking-tight">$4,280<span className="text-sm font-semibold text-white/40">.50</span></p>
          <p className="mt-0.5 text-[10px] text-white/35">Available balance</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-medium tracking-[0.15em] text-white/50">•••• •••• •••• <span className="text-white/80">4281</span></span>
            <span className="rounded-md bg-white/12 px-2 py-0.5 text-[9px] font-bold text-white/70">WORLD CHAIN</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
