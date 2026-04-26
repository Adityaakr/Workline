"use client";

import { isRunningInWorldApp } from "@/lib/integrations/minikit";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo } from "react";

export function TopBar() {
  const { data: session } = useSession();
  const env = useMemo(() => (isRunningInWorldApp() ? "World App" : "Preview"), []);
  const initials = useMemo(() => {
    const name = session?.user?.username || "WF";
    return name.slice(0, 2).toUpperCase();
  }, [session]);

  return (
    <header className="flex items-center justify-between py-2">
      <div>
        <h1 className="text-xl font-black tracking-tight text-[#1B1F3B]">
          Workline <span className="text-[#3B3FE7]">FX</span>
        </h1>
        <p className="text-[11px] font-medium text-[#9094A6]">{session?.user?.username || env}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/settle" className="grid h-10 w-10 place-items-center rounded-full bg-[#3B3FE7] text-white active:scale-95" aria-label="Settle">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </Link>
        <Link href="/account" className="grid h-10 w-10 place-items-center rounded-full bg-[#1B1F3B] text-white active:scale-95" aria-label="Account">
          <span className="text-[11px] font-bold">{initials}</span>
        </Link>
      </div>
    </header>
  );
}
