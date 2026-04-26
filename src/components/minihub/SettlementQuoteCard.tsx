"use client";

import type { Currency } from "@/lib/minihub-types";
import { computeSettlementQuote, formatReceived } from "@/lib/settlement-quote";
import { motion } from "framer-motion";

export function SettlementQuoteCard({ amount, from, to, verifiedHuman = true }: { amount: number; from: string; to: Currency; verifiedHuman?: boolean }) {
  const { receivedAmount, fee, rebateAmount, route } = computeSettlementQuote({ amountUSDC: amount, currency: to, verifiedHuman });

  const rows: [string, string, string?][] = [
    ["Send", `$${amount.toLocaleString()} ${from}`],
    ["Receive", formatReceived(receivedAmount, to.code)],
    ["Swap fee", fee > 0 ? `$${fee.toFixed(2)}` : "Free"],
    ["Rebate", rebateAmount > 0 ? `-$${rebateAmount.toFixed(2)}` : verifiedHuman ? "-" : "Verify to unlock", rebateAmount > 0 ? "accent" : undefined],
    ["Route", route],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-[18px] bg-[#F4F5F9] p-4">
      {rows.map(([label, val, style], i) => (
        <div key={label} className={`flex items-center justify-between py-2.5 ${i < rows.length - 1 ? "border-b border-[#E8EAF0]" : ""}`}>
          <span className="text-xs text-[#9094A6]">{label}</span>
          <span className={`text-xs font-bold ${style === "accent" ? "text-[#3B3FE7]" : "text-[#1B1F3B]"}`}>{val}</span>
        </div>
      ))}
    </motion.div>
  );
}
