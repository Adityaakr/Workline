"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { BalanceHero } from "@/components/minihub/BalanceHero";
import { DigitalCard } from "@/components/minihub/DigitalCard";
import { EarningsChart } from "@/components/minihub/EarningsChart";
import { GamificationSection } from "@/components/minihub/GamificationSection";
import { IncomingPayoutCard } from "@/components/minihub/IncomingPayoutCard";
import { PayoutMix } from "@/components/minihub/PayoutMix";
import { ActivityList } from "@/components/minihub/ActivityList";
import { badges, payoutMix, payouts, weeklyEarnings } from "@/data/minihub";
import { useDemoState } from "@/lib/demo-state";
import type { Payout } from "@/lib/minihub-types";
import { useMemo } from "react";

export default function HomePage() {
  const { consumedPayoutIds, completedSettlements } = useDemoState();

  const incoming = useMemo(
    () => payouts.find((p) => p.status === "ready" && !consumedPayoutIds.includes(p.id)),
    [consumedPayoutIds],
  );

  const recent = useMemo(() => {
    const settled: Payout[] = completedSettlements.slice(0, 2).map((s) => ({
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
    return [...settled, ...payouts.filter((p) => p.status !== "ready").slice(0, 3 - settled.length)];
  }, [completedSettlements]);

  return (
    <AppShell active="home">
      <BalanceHero />

      {incoming && (
        <div className="mt-5"><IncomingPayoutCard payout={incoming} /></div>
      )}

      <EarningsChart data={weeklyEarnings} />

      <DigitalCard />

      <GamificationSection badges={badges} />

      <PayoutMix items={payoutMix} />

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-[#1B1F3B]">Your Activity</h2>
          <span className="text-[11px] text-[#9094A6]">See all</span>
        </div>
        <ActivityList payouts={recent} />
      </div>
    </AppShell>
  );
}
