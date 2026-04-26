export function RebateBadge({ amount, eligible = true }: { amount?: number; eligible?: boolean }) {
  if (!eligible) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F5F9] px-3 py-1.5 text-[11px] font-bold text-[#9094A6]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#BCC0CE]" />
        Verify with World ID to unlock rebates
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#22C55E]/8 px-3 py-1.5 text-[11px] font-bold text-[#22C55E]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
      Verified human rebate{amount ? ` · $${amount.toFixed(2)}` : ""}
    </div>
  );
}
