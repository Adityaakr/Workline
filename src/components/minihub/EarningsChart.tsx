"use client";

import type { ChartDataPoint } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function EarningsChart({ data }: { data: ChartDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value));
  const bw = 28, gap = 10, h = 120;
  const tw = data.length * (bw + gap) - gap;
  const peak = data.findIndex((d) => d.value === max);

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-4 rounded-[20px] bg-white p-5 shadow-[0_2px_16px_rgba(27,31,59,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#1B1F3B]">Weekly Earnings</p>
        <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#22C55E]">+23% ↑</span>
      </div>
      <div className="mt-4 flex items-end justify-center" style={{ height: h }}>
        <svg width={tw} height={h} viewBox={`0 0 ${tw} ${h}`}>
          {data.map((d, i) => {
            const bh = (d.value / max) * (h - 22);
            const x = i * (bw + gap), y = h - bh;
            const isPeak = i === peak;
            return (
              <g key={d.label}>
                <rect x={x} y={y} width={bw} height={bh} rx={6} fill={isPeak ? "#3B3FE7" : "#E8EAF0"} />
                {isPeak && (<><rect x={x - 4} y={y - 20} width={bw + 8} height={16} rx={5} fill="#3B3FE7" /><text x={x + bw / 2} y={y - 9} textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="Satoshi,sans-serif">${d.value}</text></>)}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between px-0.5">
        {data.map((d, i) => <span key={d.label} className={`text-[10px] font-medium ${i === peak ? "text-[#3B3FE7]" : "text-[#BCC0CE]"}`} style={{ width: bw + gap, textAlign: "center" }}>{d.label}</span>)}
      </div>
    </motion.section>
  );
}
