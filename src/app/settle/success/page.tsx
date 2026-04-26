"use client";

import { CreditLineTeaser } from "@/components/minihub/CreditLineTeaser";
import { VerifiedIncomeReceiptCard } from "@/components/minihub/VerifiedIncomeReceiptCard";
import { useDemoState } from "@/lib/demo-state";
import { formatReceived } from "@/lib/settlement-quote";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SettleSuccessPage() {
  const { lastSettlement } = useDemoState();

  if (!lastSettlement) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F4F5F9] px-8 text-center">
        <p className="text-sm text-[#9094A6]">No settlement data found.</p>
        <Link
          href="/"
          className="mt-4 rounded-[14px] bg-[#1B1F3B] px-6 py-3 text-sm font-bold text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const {
    sourceAmount,
    convertedUsdc,
    receivedAmount,
    selectedCurrency,
    rebateAmount,
    verifiedHuman,
    payoutPurpose,
    payoutSender,
    txHash,
    userOpHash,
    onchain,
    explorerUrl,
    receipt,
    splitBuckets,
    creditTeaser,
  } = lastSettlement;

  const splitActive = !!splitBuckets;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#F4F5F9] px-6 py-12 text-center">
      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="grid h-20 w-20 place-items-center rounded-full bg-[#DCFCE7] shadow-[0_4px_24px_rgba(34,197,94,0.15)]"
      >
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M9 17L15 23L25 11"
            stroke="#22C55E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-2xl font-black text-[#1B1F3B]"
      >
        Payout Complete
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-sm text-[#9094A6]"
      >
        {splitActive ? (
          <>
            <span className="font-semibold text-[#1B1F3B]">
              ${sourceAmount.toLocaleString()} USDC
            </span>{" "}
            received · ${(convertedUsdc ?? 0).toLocaleString()} →{" "}
            {formatReceived(receivedAmount, selectedCurrency)}
          </>
        ) : (
          <>
            ${sourceAmount.toLocaleString()}.00 →{" "}
            {formatReceived(receivedAmount, selectedCurrency)}
          </>
        )}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-1 text-[10px] text-[#BCC0CE]"
      >
        {payoutPurpose} · {payoutSender}
      </motion.p>

      {/* On-chain badge */}
      {onchain && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.37 }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[10px] font-bold text-[#3B82F6]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
          Settled on World Chain
        </motion.div>
      )}

      {/* Rebate */}
      {verifiedHuman && rebateAmount > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1.5 text-[10px] font-bold text-[#22C55E]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          Verified Human Rebate Applied · ${rebateAmount.toFixed(2)}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F9] px-3 py-1.5 text-[10px] font-bold text-[#9094A6]"
        >
          Verify with World ID to unlock rebates
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-xs text-[#BCC0CE]"
      >
        Funds are now in your World App wallet
      </motion.p>

      {/* Transaction hash with explorer link */}
      {explorerUrl ? (
        <motion.a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="mt-1 max-w-[280px] break-all text-[9px] font-mono text-[#3B82F6] underline"
        >
          tx: {txHash.slice(0, 18)}…{txHash.slice(-6)}
        </motion.a>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="mt-1 max-w-[280px] break-all text-[9px] font-mono text-[#BCC0CE]"
        >
          tx: {txHash.slice(0, 18)}…{txHash.slice(-6)}
        </motion.p>
      )}

      {userOpHash && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.54 }}
          className="mt-0.5 max-w-[280px] break-all text-[8px] font-mono text-[#BCC0CE]"
        >
          userOp: {userOpHash.slice(0, 14)}…{userOpHash.slice(-6)}
        </motion.p>
      )}

      {/* Verified Income Receipt */}
      {receipt && (
        <div className="mt-8 w-full max-w-[360px]">
          <VerifiedIncomeReceiptCard receipt={receipt} />
        </div>
      )}

      {/* Credit Line Teaser */}
      {creditTeaser && (
        <div className="mt-4 w-full max-w-[360px]">
          <CreditLineTeaser teaser={creditTeaser} />
        </div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-8 flex gap-3"
      >
        <Link href="/">
          <div className="rounded-[14px] bg-[#1B1F3B] px-6 py-3 text-sm font-bold text-white">
            Back to Home
          </div>
        </Link>
        <Link href="/settle">
          <div className="rounded-[14px] border border-[#E8EAF0] bg-white px-6 py-3 text-sm font-bold text-[#1B1F3B]">
            Settle Another
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
