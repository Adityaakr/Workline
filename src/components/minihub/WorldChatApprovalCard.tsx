"use client";

import type { WorldChatApproval } from "@/lib/minihub-types";
import { motion } from "framer-motion";

export function WorldChatApprovalCard({
  approval,
}: {
  approval: WorldChatApproval;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="rounded-[16px] border border-[#E8EAF0] bg-white p-4 shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#3B3FE7]/10">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 4.5C3 3.67 3.67 3 4.5 3h9C14.33 3 15 3.67 15 4.5v6c0 .83-.67 1.5-1.5 1.5H7l-3 3v-3H4.5C3.67 12 3 11.33 3 10.5v-6Z"
              stroke="#3B3FE7"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#3B3FE7]">
              World Chat Approval
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[9px] font-bold text-[#22C55E]">
              <span className="h-1 w-1 rounded-full bg-[#22C55E]" />
              {approval.status === "approved" ? "Approved" : "Pending"}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-bold text-[#1B1F3B]">
            {approval.clientName}
            <span className="ml-1 text-[10px] font-medium text-[#9094A6]">
              @{approval.clientHandle}
            </span>
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#5A5F75]">
            &ldquo;{approval.messagePreview}&rdquo;
          </p>
          <p className="mt-1.5 text-[9px] text-[#BCC0CE]">
            {approval.approvedAt} · payout {approval.payoutId}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
