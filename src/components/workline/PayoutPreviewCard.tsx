"use client";

import { payoutCurrencies } from "@/data/workline";
import type { PayoutQuote } from "@/lib/types";
import { useMemo, useState } from "react";
import { CurrencySelector } from "./CurrencySelector";
import { RebateBadge } from "./RebateBadge";

type PayoutPreviewCardProps = {
  quote: PayoutQuote;
  compact?: boolean;
};

export function PayoutPreviewCard({
  quote,
  compact = false,
}: PayoutPreviewCardProps) {
  const [currency, setCurrency] = useState(quote.selectedCurrency);
  const output = useMemo(
    () =>
      (quote.approvedAmountUsd - quote.networkFeeUsd + quote.rebateUsd) *
      currency.rate,
    [
      currency.rate,
      quote.approvedAmountUsd,
      quote.networkFeeUsd,
      quote.rebateUsd,
    ],
  );

  return (
    <article className="rounded-[24px] border border-white/8 bg-[#393E46] p-5 shadow-sm">
      <div className="grid gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
            Amount available
          </p>
          <p className="mt-3 text-sm font-bold text-[#EEEEEE]/56">
            Milestone approved · {quote.agreementId}
          </p>
          <h3 className="mt-2 text-4xl font-black tracking-tight text-[#EEEEEE]">
            ${quote.approvedAmountUsd.toLocaleString()} USDC
          </h3>
        </div>
        <RebateBadge amount={quote.rebateUsd} />
      </div>

      {!compact ? (
        <div className="mt-7">
          <p className="mb-3 text-sm font-black text-[#EEEEEE]">
            Choose payout currency
          </p>
          <CurrencySelector
            currencies={payoutCurrencies}
            selected={currency}
            onSelect={setCurrency}
          />
        </div>
      ) : null}

      <div className="mt-7 rounded-[22px] bg-[#222831] p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
          Final amount received
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h3 className="text-4xl font-black tracking-tight text-[#EEEEEE]">
            {currency.symbol}
            {output.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            {currency.code}
          </h3>
          <p className="pb-1 text-right text-xs font-bold text-[#EEEEEE]/48">
            {quote.estimatedArrival}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["FX rate", `1 USDC = ${currency.rate.toFixed(2)} ${currency.code}`],
          ["Fee", `$${quote.networkFeeUsd.toFixed(2)}`],
          ["Rebate", `-$${quote.rebateUsd.toFixed(2)}`],
          [
            "Route preview",
            quote.route.join(" → ").replace("EURC", currency.code),
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[18px] bg-[#222831]/72 p-4">
            <p className="text-xs font-bold text-[#EEEEEE]/48">{label}</p>
            <p className="mt-1 text-sm font-black text-[#EEEEEE]">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
