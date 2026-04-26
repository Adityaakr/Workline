import type { MinihubTab } from "@/lib/minihub-types";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppShell({ active, children }: { active: MinihubTab; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F4F5F9] text-[#1B1F3B]">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] px-5 pb-28 pt-4">
        <TopBar />
        <div className="animate-screen-in">{children}</div>
      </main>
      <BottomNav active={active} />
    </div>
  );
}
