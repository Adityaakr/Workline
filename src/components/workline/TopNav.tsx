"use client";

import { isRunningInWorldApp } from "@/lib/integrations/minikit";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo } from "react";

type TopNavProps = {
  active: "home" | "work" | "payout" | "more";
};

const navItems = [
  { href: "/", label: "Home", value: "home" },
  { href: "/work", label: "Work", value: "work" },
  { href: "/payout", label: "Payout", value: "payout" },
  { href: "/more", label: "More", value: "more" },
] as const;

export function TopNav({ active }: TopNavProps) {
  const { data: session } = useSession();
  const environmentLabel = useMemo(
    () => (isRunningInWorldApp() ? "World App" : "Browser preview"),
    [],
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#222831]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#00ADB5] text-sm font-black text-[#222831] shadow-sm">
              FX
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-[#EEEEEE]">
                Workline FX
              </p>
              <p className="truncate text-xs font-medium text-[#EEEEEE]/55">
                {environmentLabel}
              </p>
            </div>
          </Link>

          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-white/10 bg-[#393E46] px-4 py-2 text-sm font-black text-[#EEEEEE] shadow-sm"
            >
              {session.user.username || "Signed in"}
            </button>
          ) : (
            <Link
              href="/more"
              className="rounded-full bg-[#00ADB5] px-4 py-2 text-sm font-black text-[#222831] shadow-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#222831]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-2 py-3 text-center text-xs font-black transition ${
                active === item.value
                  ? "bg-[#00ADB5] text-[#222831]"
                  : "bg-[#393E46]/75 text-[#EEEEEE]/68"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
