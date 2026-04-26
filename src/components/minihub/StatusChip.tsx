import type { Payout } from "@/lib/minihub-types";

const cfg: Record<Payout["status"], { label: string; bg: string; text: string }> = {
  ready: { label: "Ready", bg: "bg-[#3B3FE7]/8", text: "text-[#3B3FE7]" },
  sent: { label: "Sent", bg: "bg-[#F4F5F9]", text: "text-[#9094A6]" },
  settled: { label: "Settled", bg: "bg-[#22C55E]/8", text: "text-[#22C55E]" },
  pending: { label: "Pending", bg: "bg-[#F59E0B]/8", text: "text-[#F59E0B]" },
};

export function StatusChip({ status }: { status: Payout["status"] }) {
  const { label, bg, text } = cfg[status];
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${bg} ${text}`}>{label}</span>;
}
