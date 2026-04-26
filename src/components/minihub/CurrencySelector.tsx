"use client";

import type { Currency } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function CurrencySelector({ currencies, selected, onSelect }: { currencies: Currency[]; selected: Currency; onSelect: (c: Currency) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {currencies.map((c) => (
        <motion.button key={c.code} type="button" whileTap={{ scale: 0.97 }} onClick={() => onSelect(c)} className={`rounded-[16px] border p-4 text-left transition ${selected.code === c.code ? "border-[#3B3FE7] bg-[#3B3FE7]/5" : "border-[#E8EAF0] bg-white"}`}>
          <p className="text-sm font-bold text-[#1B1F3B]">{c.code}</p>
          <p className="mt-1 text-[10px] text-[#9094A6]">{c.name}</p>
        </motion.button>
      ))}
    </div>
  );
}
