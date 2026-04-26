"use client";

import type { PayoutCurrency } from "@/lib/types";

type CurrencySelectorProps = {
  currencies: PayoutCurrency[];
  selected: PayoutCurrency;
  onSelect: (currency: PayoutCurrency) => void;
};

export function CurrencySelector({
  currencies,
  selected,
  onSelect,
}: CurrencySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {currencies.map((currency) => (
        <button
          key={currency.code}
          type="button"
          onClick={() => onSelect(currency)}
          className={`rounded-[20px] border px-4 py-3 text-left transition ${
            selected.code === currency.code
              ? "border-[#00ADB5] bg-[#00ADB5]/12 shadow-sm"
              : "border-white/8 bg-[#393E46]/65 hover:border-[#00ADB5]/60"
          }`}
        >
          <p className="text-sm font-black text-[#EEEEEE]">{currency.code}</p>
          <p className="mt-1 truncate text-xs font-medium text-[#EEEEEE]/55">
            {currency.name}
          </p>
        </button>
      ))}
    </div>
  );
}
