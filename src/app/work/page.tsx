"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { agreements } from "@/data/minihub";
import type { Agreement } from "@/lib/minihub-types";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AgreementChat = dynamic(
  () => import("@/components/minihub/AgreementChat").then((m) => m.AgreementChat),
  { ssr: false },
);

const statusConfig: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  active: { dot: "bg-[#3B3FE7]", label: "Active", bg: "bg-[#3B3FE7]/8", text: "text-[#3B3FE7]" },
  completed: { dot: "bg-[#22C55E]", label: "Completed", bg: "bg-[#22C55E]/8", text: "text-[#22C55E]" },
};

export default function WorkPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [chatAgreement, setChatAgreement] = useState<Agreement | null>(null);
  const filtered = tab === "active"
    ? agreements.filter((a) => a.status !== "completed")
    : agreements.filter((a) => a.status === "completed");

  return (
    <AppShell active="work">
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1B1F3B]">Work Agreements</h2>
        <p className="mt-1 text-xs text-[#9094A6]">Manage your active projects and payouts</p>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Active", value: agreements.filter((a) => a.status !== "completed").length.toString(), color: "text-[#3B3FE7]" },
          { label: "Total value", value: "$8,300", color: "text-[#1B1F3B]" },
          { label: "Paid out", value: "$2,900", color: "text-[#22C55E]" },
        ].map((s) => (
          <div key={s.label} className="rounded-[14px] bg-white p-3 text-center shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-[9px] text-[#9094A6]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        {(["active", "completed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setExpanded(null); }}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
              tab === t ? "bg-[#1B1F3B] text-white" : "bg-white text-[#9094A6]"
            }`}
          >
            {t} ({t === "active" ? agreements.filter((a) => a.status !== "completed").length : agreements.filter((a) => a.status === "completed").length})
          </button>
        ))}
      </div>

      {/* Agreement cards */}
      <div className="mt-4 grid gap-3">
        {filtered.map((a, i) => {
          const isOpen = expanded === a.id;
          const cfg = statusConfig[a.status] ?? statusConfig.active;
          const paidNum = parseInt(a.paid.replace(/[^0-9]/g, ""), 10);
          const totalNum = parseInt(a.total.replace(/[^0-9]/g, ""), 10);
          const remaining = totalNum - paidNum;

          return (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className="overflow-hidden rounded-[18px] bg-white shadow-[0_2px_10px_rgba(27,31,59,0.04)]"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : a.id)}
                className="w-full p-4 text-left"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1B1F3B]">{a.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#9094A6]">{a.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
                      {a.currency}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      className={`text-[#BCC0CE] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3 h-[4px] w-full rounded-full bg-[#E8EAF0]">
                  <div
                    className="h-full rounded-full bg-[#3B3FE7] transition-all"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[10px] text-[#BCC0CE]">
                    Milestones: <span className="font-bold text-[#1B1F3B]">{a.milestones}</span>
                  </span>
                  <span className="text-[10px] text-[#BCC0CE]">
                    Paid: <span className="font-bold text-[#22C55E]">{a.paid}</span> / {a.total}
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#E8EAF0] px-4 pb-4 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[12px] bg-[#F4F5F9] p-3">
                          <p className="text-[10px] text-[#9094A6]">Remaining</p>
                          <p className="mt-0.5 text-sm font-bold text-[#1B1F3B]">${remaining.toLocaleString()}</p>
                        </div>
                        <div className="rounded-[12px] bg-[#F4F5F9] p-3">
                          <p className="text-[10px] text-[#9094A6]">Settlement</p>
                          <p className="mt-0.5 text-sm font-bold text-[#1B1F3B]">{a.currency}</p>
                        </div>
                        <div className="rounded-[12px] bg-[#F4F5F9] p-3">
                          <p className="text-[10px] text-[#9094A6]">Progress</p>
                          <p className="mt-0.5 text-sm font-bold text-[#3B3FE7]">{a.progress}%</p>
                        </div>
                        <div className="rounded-[12px] bg-[#F4F5F9] p-3">
                          <p className="text-[10px] text-[#9094A6]">Status</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
                          </div>
                        </div>
                      </div>

                      {a.status !== "completed" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); router.push("/settle"); }}
                            className="flex-1 rounded-[12px] bg-[#3B3FE7] py-2.5 text-[11px] font-bold text-white active:scale-[0.98]"
                          >
                            Claim payout
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setChatAgreement(a); }}
                            className="flex-1 rounded-[12px] border border-[#E8EAF0] bg-white py-2.5 text-[11px] font-bold text-[#1B1F3B] active:scale-[0.98]"
                          >
                            Message client
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
      {/* XMTP Chat overlay */}
      <AnimatePresence>
        {chatAgreement && (
          <AgreementChat
            agreement={chatAgreement}
            onClose={() => setChatAgreement(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
