import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

type AppShellProps = {
  children: ReactNode;
  active?: "home" | "work" | "payout" | "more";
};

export function AppShell({ children, active = "home" }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#222831] text-[#EEEEEE]">
      <TopNav active={active} />
      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-28 pt-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
