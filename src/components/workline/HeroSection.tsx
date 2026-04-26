import { heroStats, payoutQuote } from "@/data/workline";
import Link from "next/link";
import { PayoutPreviewCard } from "./PayoutPreviewCard";

export function HeroSection() {
  return (
    <section className="grid gap-5 py-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <div className="flex min-h-[560px] flex-col justify-between rounded-2xl bg-[#222831] p-6 text-[#EEEEEE] shadow-sm sm:p-8 lg:p-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00ADB5]">
            Verified global work
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            Get paid in your local stablecoin the moment work is approved
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#EEEEEE]/75 sm:text-lg">
            Workline FX turns approved work into instant local-stablecoin
            payouts with onchain liquidity, verified-human rebates, and native
            distribution through World App.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/agreement/new"
              className="rounded-full bg-[#00ADB5] px-6 py-3 text-center text-sm font-black text-[#EEEEEE] shadow-sm shadow-[#00ADB5]/30"
            >
              Create Agreement
            </Link>
            <Link
              href="/payout/preview"
              className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-black text-[#EEEEEE]"
            >
              See Payout Flow
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-xs font-bold text-[#EEEEEE]/55">
                {stat.label}
              </p>
              <p className="mt-2 text-lg font-black">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-[#222831]/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
            Live route preview
          </p>
          <div className="mt-5 rounded-2xl bg-[#EEEEEE] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#222831]">
                  Approved milestone
                </p>
                <p className="mt-1 text-xs font-medium text-[#393E46]/70">
                  Final mobile screens approved
                </p>
              </div>
              <p className="text-xl font-black text-[#222831]">$2,400</p>
            </div>
          </div>
        </div>
        <PayoutPreviewCard quote={payoutQuote} compact />
      </div>
    </section>
  );
}
