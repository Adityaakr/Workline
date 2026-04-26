"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function QuickActions() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="mt-4 grid grid-cols-3 gap-2">
      {[{ href: "/settle", label: "Settle", icon: "💰" }, { href: "/work", label: "Work", icon: "📋" }, { href: "/fx", label: "FX Rates", icon: "📊" }].map((a) => (
        <Link key={a.label} href={a.href}>
          <motion.div whileTap={{ scale: 0.96 }} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-white py-3.5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
            <span className="text-base">{a.icon}</span>
            <span className="text-[10px] font-bold text-[#9094A6]">{a.label}</span>
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
}
