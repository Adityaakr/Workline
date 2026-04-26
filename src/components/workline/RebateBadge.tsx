type RebateBadgeProps = {
  amount: number;
};

export function RebateBadge({ amount }: RebateBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#00ADB5]/25 bg-[#00ADB5]/10 px-3 py-2 text-xs font-black text-[#00ADB5]">
      <span className="h-2 w-2 rounded-full bg-[#00ADB5]" />
      Verified Human Rebate Active{amount > 0 ? ` · $${amount.toFixed(2)}` : ""}
    </div>
  );
}
