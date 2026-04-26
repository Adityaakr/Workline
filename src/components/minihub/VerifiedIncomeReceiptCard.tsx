"use client";

import type { VerifiedIncomeReceipt } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function VerifiedIncomeReceiptCard({
  receipt,
}: {
  receipt: VerifiedIncomeReceipt;
}) {
  const issued = new Date(receipt.issuedAt);
  const issuedLabel = issued.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-[360px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_20px_rgba(27,31,59,0.08)]"
    >
      {/* Top */}
      <div className="bg-[#1B1F3B] px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B8FFF]">
            Verified Income Receipt
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/90">
            <span className="h-1 w-1 rounded-full bg-[#22C55E]" />
            On-chain
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-white/40">
          {receipt.receiptId}
        </p>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-black tracking-tight text-[#1B1F3B]">
            ${receipt.amountUSDC.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-[#9094A6]">USDC</span>
        </div>
        <p className="mt-0.5 text-[11px] text-[#9094A6]">
          {receipt.splitBuckets ? (
            <>Allocated via Smart Split</>
          ) : (
            <>
              Received as{" "}
              <span className="font-semibold text-[#1B1F3B]">
                {receipt.receivedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {receipt.receivedCurrency}
              </span>
            </>
          )}
        </p>

        {/* Smart Split breakdown */}
        {receipt.splitBuckets && (
          <div className="mt-3 grid gap-1.5 rounded-[12px] bg-[#F4F5F9] p-3">
            <SplitRow
              label="Spend"
              hint={receipt.splitBuckets.localCurrency}
              usdc={receipt.splitBuckets.localUsdc}
              extra={`= ${receipt.receivedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${receipt.receivedCurrency}`}
              tone="indigo"
            />
            <SplitRow
              label="Save"
              hint="USDC"
              usdc={receipt.splitBuckets.stableUsdc}
              tone="green"
            />
            <SplitRow
              label="Reserve"
              hint="USDC"
              usdc={receipt.splitBuckets.reserveUsdc}
              tone="amber"
            />
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 text-left">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#BCC0CE]">
              From
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1B1F3B]">
              {receipt.payerName}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#BCC0CE]">
              Issued
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1B1F3B]">
              {issuedLabel}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#BCC0CE]">
              Approval
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1B1F3B]">
              World Chat
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#BCC0CE]">
              Identity
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#1B1F3B]">
              {receipt.verifiedHuman ? "Verified human" : "Unverified"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#E8EAF0] pt-3">
          <p className="text-[9px] uppercase tracking-wider text-[#BCC0CE]">
            Tx
          </p>
          {receipt.explorerUrl ? (
            <a
              href={receipt.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-[#3B82F6] underline"
            >
              {receipt.txHash.slice(0, 12)}…{receipt.txHash.slice(-6)}
            </a>
          ) : (
            <span className="font-mono text-[9px] text-[#BCC0CE]">
              {receipt.txHash.slice(0, 12)}…{receipt.txHash.slice(-6)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function SplitRow({
  label,
  hint,
  usdc,
  extra,
  tone,
}: {
  label: string;
  hint: string;
  usdc: number;
  extra?: string;
  tone: "indigo" | "green" | "amber";
}) {
  const dot =
    tone === "indigo"
      ? "bg-[#3B3FE7]"
      : tone === "green"
        ? "bg-[#22C55E]"
        : "bg-[#F0C24A]";
  return (
    <div className="flex items-center justify-between text-left">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[10px] font-bold text-[#1B1F3B]">{label}</span>
        <span className="text-[10px] text-[#9094A6]">· {hint}</span>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-bold text-[#1B1F3B]">
          ${usdc.toLocaleString()}
        </p>
        {extra && (
          <p className="text-[8px] text-[#9094A6]">{extra}</p>
        )}
      </div>
    </div>
  );
}
