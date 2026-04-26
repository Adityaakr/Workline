"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { ActivityList } from "@/components/minihub/ActivityList";
import { payouts } from "@/data/minihub";
import { useDemoState } from "@/lib/demo-state";
import type { Payout } from "@/lib/minihub-types";
import { useMemo } from "react";

export default function ActivityPage() {
  const { completedSettlements } = useDemoState();

  const merged = useMemo(() => {
    const settled: Payout[] = completedSettlements.map((s) => ({
      id: s.settlementId,
      direction: "incoming",
      sender: s.payoutSender,
      recipient: "You",
      purpose: s.payoutPurpose,
      amount: s.sourceAmount,
      sourceCurrency: s.selectedCurrency,
      status: "settled",
      timestamp: new Date(s.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    }));
    return [...settled, ...payouts];
  }, [completedSettlements]);

  return (
    <AppShell active="home">
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1B1F3B]">All Activity</h2>
        <p className="mt-1 text-xs text-[#9094A6]">Your complete transaction history</p>
      </div>
      <div className="mt-4"><ActivityList payouts={merged} /></div>
    </AppShell>
  );
}
