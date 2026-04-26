"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { ActivityList } from "@/components/minihub/ActivityList";
import { payouts } from "@/data/minihub";
import { useDemoState } from "@/lib/demo-state";
import type { Payout } from "@/lib/minihub-types";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function ActivityPage() {
  const router = useRouter();
  const { completedSettlements, setLastSettlement } = useDemoState();

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

  // Index settlements by id so the list can re-open the right receipt.
  const receiptIds = useMemo(
    () =>
      new Set(
        completedSettlements
          .filter((s) => !!s.receipt)
          .map((s) => s.settlementId),
      ),
    [completedSettlements],
  );

  const handleReceiptClick = (id: string) => {
    const settlement = completedSettlements.find(
      (s) => s.settlementId === id,
    );
    if (!settlement) return;
    setLastSettlement(settlement);
    router.push("/settle/success");
  };

  return (
    <AppShell active="home">
      <div className="mt-2">
        <h2 className="text-xl font-black text-[#1B1F3B]">All Activity</h2>
        <p className="mt-1 text-xs text-[#9094A6]">Your complete transaction history · tap a settled row to re-open its receipt</p>
      </div>
      <div className="mt-4">
        <ActivityList
          payouts={merged}
          hasReceiptIds={receiptIds}
          onReceiptClick={handleReceiptClick}
        />
      </div>
    </AppShell>
  );
}
