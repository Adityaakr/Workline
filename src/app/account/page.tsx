"use client";

import { AppShell } from "@/components/minihub/AppShell";
import { AccountPanel } from "@/components/minihub/AccountPanel";

export default function AccountPage() {
  return (
    <AppShell active="account">
      <div className="mt-2">
        <AccountPanel />
      </div>
    </AppShell>
  );
}
