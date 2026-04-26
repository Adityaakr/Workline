"use client";

import { useState } from "react";
import { FX_ADDRESSES } from "@/lib/fx-contracts";

// Shown when MiniKit returns `invalid_contract` — gives the user a
// copy-paste cheat-sheet of every contract they need to allowlist
// in the World Developer Portal so they can fix it without leaving
// the Mini App and without guessing.
export function DevPortalAllowlistCard() {
  const [copied, setCopied] = useState<string | null>(null);
  const appId = process.env.NEXT_PUBLIC_APP_ID ?? "";

  // Try both legacy and current Dev Portal hosts so the user lands
  // on a working page regardless of which one their account uses.
  const portalUrl = appId
    ? `https://developer.worldcoin.org/app/${appId}/permissions`
    : "https://developer.worldcoin.org";

  const entrypoints = [
    { label: "USDC token", value: FX_ADDRESSES.usdc },
    { label: "wMXN token", value: FX_ADDRESSES.wmxn },
    { label: "Workline FX Pool", value: FX_ADDRESSES.pool },
  ];
  const permit2 = [
    { label: "USDC token", value: FX_ADDRESSES.usdc },
    { label: "wMXN token", value: FX_ADDRESSES.wmxn },
  ];

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  const allEntrypointsList = entrypoints.map((e) => e.value).join("\n");

  return (
    <div className="rounded-[20px] border border-[#EF4444]/30 bg-white p-4 shadow-[0_8px_24px_rgba(239,68,68,0.08)]">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FEE2E2] text-base">
          ⚠
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1B1F3B]">
            Dev Portal allowlist required
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#1B1F3B]/70">
            World App rejected this transaction with{" "}
            <span className="font-mono text-[11px] text-[#EF4444]">
              invalid_contract
            </span>
            . Add the contracts below to your Mini App&apos;s Permissions in
            the Developer Portal, then reopen the app.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <section>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B1F3B]/60">
              Contract Entrypoints (all 3 required)
            </p>
            <button
              type="button"
              onClick={() => copy(allEntrypointsList, "all")}
              className="text-[10px] font-semibold text-[#3B3FE7] underline-offset-2 hover:underline"
            >
              {copied === "all" ? "Copied ✓" : "Copy all"}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {entrypoints.map((c) => (
              <li
                key={`ep-${c.value}`}
                className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F5F6FB] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#1B1F3B]">
                    {c.label}
                  </p>
                  <p className="truncate font-mono text-[10px] text-[#1B1F3B]/60">
                    {c.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(c.value, `ep-${c.value}`)}
                  className="shrink-0 rounded-full border border-[#1B1F3B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1B1F3B] hover:border-[#3B3FE7] hover:text-[#3B3FE7]"
                >
                  {copied === `ep-${c.value}` ? "Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B1F3B]/60">
            Permit2 Tokens (optional but recommended — ERC-20s only)
          </p>
          <ul className="mt-2 space-y-1.5">
            {permit2.map((c) => (
              <li
                key={`p2-${c.value}`}
                className="flex items-center justify-between gap-2 rounded-[10px] bg-[#F5F6FB] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#1B1F3B]">
                    {c.label}
                  </p>
                  <p className="truncate font-mono text-[10px] text-[#1B1F3B]/60">
                    {c.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(c.value, `p2-${c.value}`)}
                  className="shrink-0 rounded-full border border-[#1B1F3B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1B1F3B] hover:border-[#3B3FE7] hover:text-[#3B3FE7]"
                >
                  {copied === `p2-${c.value}` ? "Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <a
          href={portalUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-[14px] bg-[#1B1F3B] px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Open Dev Portal · Permissions →
        </a>

        <p className="text-[10px] leading-snug text-[#1B1F3B]/55">
          Tip: paste each address on its own line. After saving, force-quit
          and reopen World App so the Mini App picks up the new allowlist.
          If the Portal has a Staging / Production toggle, set it to match
          the mode you&apos;re launching the app in.
        </p>
      </div>
    </div>
  );
}
