"use client";

import type { Badge } from "@/lib/minihub-types";
import { motion } from "framer-motion";

const badgeIcons: Record<string, React.ReactNode> = {
  "Early Settler": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.09 7.26L18 7.64L13.45 11.39L14.82 17L10 14.27L5.18 17L6.55 11.39L2 7.64L7.91 7.26L10 2Z" fill="#F0C24A" /></svg>
  ),
  "FX Pro": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3V10L14 14" stroke="#3B3FE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="10" r="8" stroke="#3B3FE7" strokeWidth="1.5" /></svg>
  ),
  Verified: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 4.5H16V8L18 10L16 12V15.5H12.5L10 18L7.5 15.5H4V12L2 10L4 8V4.5H7.5L10 2Z" fill="#22C55E" fillOpacity="0.15" stroke="#22C55E" strokeWidth="1.2" /><path d="M7 10L9 12L13 8" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

export function GamificationSection({ badges }: { badges: Badge[] }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="mt-4 rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(27,31,59,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#3B3FE7]/8">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L11 5.5L16 6L12.5 9.5L13.5 14.5L9 12L4.5 14.5L5.5 9.5L2 6L7 5.5L9 1Z" fill="#3B3FE7" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B1F3B]">Level 7</p>
            <p className="text-[11px] text-[#9094A6]">9,450 XP</p>
          </div>
        </div>
        <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#22C55E]">+3%</span>
      </div>

      <div className="mt-3 h-[5px] w-full rounded-full bg-[#E8EAF0]">
        <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 0.8, delay: 0.4 }} className="h-full rounded-full bg-[#3B3FE7]" />
      </div>
      <p className="mt-1.5 text-[10px] text-[#BCC0CE]">550 XP to Level 8</p>

      <div className="mt-4 flex items-center justify-between rounded-[14px] bg-[#F4F5F9] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#3B3FE7]/10">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#3B3FE7" strokeWidth="1.2" /><circle cx="7" cy="7" r="2" fill="#3B3FE7" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1B1F3B]">Today&apos;s Mission</p>
            <p className="text-[10px] text-[#9094A6]">Settle 2 payouts this week</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-[#BCC0CE]">Skip</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-bold text-[#1B1F3B]">Your Badges</p>
        <span className="text-[11px] text-[#9094A6]">Show more</span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {badges.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[#F4F5F9] px-2 py-3">
            <div className="grid h-8 w-8 place-items-center">
              {badgeIcons[b.label] ?? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#9094A6" strokeWidth="1.2" /><path d="M7 10L9 12L13 8" stroke="#9094A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <p className="text-[10px] font-bold text-[#1B1F3B]">{b.label}</p>
            <p className="text-[9px] text-[#9094A6]">{b.sub}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
