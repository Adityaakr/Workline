import type { Agreement } from "@/lib/types";
import Link from "next/link";

type AgreementCardProps = {
  agreement: Agreement;
};

export function AgreementCard({ agreement }: AgreementCardProps) {
  const isApproved = agreement.status === "Approved";

  return (
    <article className="rounded-[22px] border border-white/8 bg-[#393E46] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
            {agreement.id}
          </p>
          <h3 className="mt-3 text-xl font-black tracking-tight text-[#EEEEEE]">
            {agreement.title}
          </h3>
          <p className="mt-2 text-sm font-medium text-[#EEEEEE]/62">
            {agreement.client} to {agreement.worker}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
            isApproved
              ? "bg-[#00ADB5]/12 text-[#00ADB5]"
              : "bg-[#222831]/70 text-[#EEEEEE]/70"
          }`}
        >
          {agreement.status}
        </span>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#EEEEEE]/55">
          <span>Milestone progress</span>
          <span>{agreement.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#222831]/75">
          <div
            className="h-2 rounded-full bg-[#00ADB5]"
            style={{ width: `${agreement.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-[#222831]/75 p-4">
          <p className="text-xs font-bold text-[#EEEEEE]/50">Milestone</p>
          <p className="mt-1 text-sm font-black text-[#EEEEEE]">
            {agreement.milestone}
          </p>
        </div>
        <div className="rounded-[18px] bg-[#222831] p-4 text-[#EEEEEE]">
          <p className="text-xs font-bold text-[#EEEEEE]/65">Approved value</p>
          <p className="mt-1 text-lg font-black">
            ${agreement.amountUsd.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#EEEEEE]/58">
          {agreement.dueLabel}
        </p>
        <Link
          href={isApproved ? "/payout" : "/work"}
          className="rounded-full bg-[#00ADB5] px-4 py-2 text-sm font-black text-[#222831]"
        >
          {isApproved ? "View payout" : "Open"}
        </Link>
      </div>
    </article>
  );
}
