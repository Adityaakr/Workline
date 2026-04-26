"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const spark = [20, 35, 28, 45, 38, 55, 48, 68, 60, 75, 65, 82];

function Chart() {
  const max = Math.max(...spark), min = Math.min(...spark), h = 70, w = 260;
  const pts = spark.map((v, i) => `${(i / (spark.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 8) - 4}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3">
      <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B3FE7" stopOpacity="0.10" /><stop offset="100%" stopColor="#3B3FE7" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#cf)" />
      <polyline points={pts} fill="none" stroke="#3B3FE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BalanceHero() {
  const [vis, setVis] = useState(true);
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mt-4">
      <p className="text-lg font-black text-[#1B1F3B]">You are on Top</p>
      <p className="text-lg font-bold text-[#BCC0CE]">of your Finances</p>

      <div className="mt-4 rounded-[22px] bg-white p-5 shadow-[0_2px_16px_rgba(27,31,59,0.06)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#9094A6]">Total Earned</p>
          <button onClick={() => setVis(!vis)} className="text-[#9094A6] active:scale-95">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{vis ? <><ellipse cx="8" cy="8" rx="6" ry="3.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" /></> : <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}</svg>
          </button>
        </div>
        <p className="mt-1"><span className="text-[38px] font-black tracking-tight text-[#1B1F3B]">{vis ? "$4,280" : "••••••"}</span><span className="text-lg font-semibold text-[#BCC0CE]">{vis ? ".50" : ""}</span></p>
        <Chart />
        <p className="mt-2 text-[10px] text-[#9094A6]">Jan &nbsp; Feb &nbsp; <span className="font-bold text-[#3B3FE7]">Mar</span> &nbsp; Apr</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
          <p className="text-[11px] font-semibold text-[#9094A6]">Income</p>
          <p className="mt-1.5 text-xl font-black text-[#1B1F3B]">$1,537.86</p>
        </div>
        <div className="rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
          <p className="text-[11px] font-semibold text-[#9094A6]">Expense</p>
          <p className="mt-1.5 text-xl font-black text-[#1B1F3B]">$937.86</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href="/work">
          <motion.div whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-[12px] bg-[#1B1F3B] px-4 py-2.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1V11M1 6H11" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="text-xs font-bold text-white">New Agreement</span>
          </motion.div>
        </Link>
        <Link href="/settle">
          <motion.div whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-[12px] border border-[#E8EAF0] bg-white px-4 py-2.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6H11M11 6L7 2M11 6L7 10" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-xs font-bold text-[#1B1F3B]">Withdraw</span>
          </motion.div>
        </Link>
      </div>
    </motion.section>
  );
}
