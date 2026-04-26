import Link from "next/link";

export function CTASection() {
  return (
    <section className="rounded-2xl bg-[#222831] p-6 text-[#EEEEEE] shadow-sm sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00ADB5]">
            Ready for approved work
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Turn the next milestone into local money.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#EEEEEE]/72">
            Create a verified agreement, approve the work, and preview the
            stablecoin payout route in one World-native flow.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/agreement/new"
            className="rounded-full bg-[#00ADB5] px-5 py-3 text-center text-sm font-black text-[#EEEEEE]"
          >
            Create Agreement
          </Link>
          <Link
            href="/payout/preview"
            className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-[#EEEEEE]"
          >
            See Payout Flow
          </Link>
        </div>
      </div>
    </section>
  );
}
