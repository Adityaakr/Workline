"use client";

import type { CreditLineTeaser as CreditLineTeaserType } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function CreditLineTeaser({
  teaser,
  variant = "card",
}: {
  teaser: CreditLineTeaserType;
  variant?: "card" | "compact";
}) {
  const remaining = Math.max(
    teaser.nextMilestoneReceipts - teaser.receiptCount,
    0,
  );
  const progress = Math.min(
    100,
    Math.round((teaser.receiptCount / teaser.nextMilestoneReceipts) * 100),
  );

  if (variant === "compact") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[16px] border border-[#E8EAF0] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9094A6]">
              Trust score
            </p>
            <p className="mt-0.5 text-lg font-black text-[#1B1F3B]">
              {teaser.trustScore}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9094A6]">
              Est. credit line
            </p>
            <p className="mt-0.5 text-lg font-black text-[#3B3FE7]">
              ${teaser.estimatedLimit.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-[360px] overflow-hidden rounded-[20px] border border-[#3B3FE7]/15 bg-gradient-to-br from-[#3B3FE7]/[0.05] via-white to-[#8B5CF6]/[0.05] p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B3FE7]">
          What this unlocks
        </p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-[#3B3FE7] shadow-sm">
          Coming soon
        </span>
      </div>

      <h3 className="mt-2 text-base font-black text-[#1B1F3B]">
        Earnings advance, powered by your receipts
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#5A5F75]">
        Verified income receipts build a reusable trust profile. The more you
        settle, the more you can draw against future payouts.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[12px] bg-white/80 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9094A6]">
            Receipts
          </p>
          <p className="mt-0.5 text-base font-black text-[#1B1F3B]">
            {teaser.receiptCount}
          </p>
        </div>
        <div className="rounded-[12px] bg-white/80 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9094A6]">
            Verified income
          </p>
          <p className="mt-0.5 text-base font-black text-[#1B1F3B]">
            ${teaser.totalVerifiedIncome.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[12px] bg-white/80 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9094A6]">
            Trust score
          </p>
          <p className="mt-0.5 text-base font-black text-[#1B1F3B]">
            {teaser.trustScore}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-[#5A5F75]">
          <span className="font-bold">Estimated credit line</span>
          <span className="font-black text-[#3B3FE7]">
            ${teaser.estimatedLimit.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E8EAF0]">
          <div
            className="h-full rounded-full bg-[#3B3FE7]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-[#9094A6]">
          {remaining > 0
            ? `${remaining} more receipt${remaining === 1 ? "" : "s"} unlocks the next tier`
            : "You unlocked the next tier — invite to early access"}
        </p>
      </div>
    </motion.article>
  );
}
