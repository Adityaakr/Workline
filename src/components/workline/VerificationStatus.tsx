"use client";

import { requestWorldIdVerification } from "@/lib/integrations/world-id";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { useState } from "react";

export function VerificationStatus() {
  const { isInstalled } = useMiniKit();
  const [status, setStatus] = useState<
    "idle" | "pending" | "verified" | "error"
  >("idle");

  async function verify() {
    setStatus("pending");
    try {
      await requestWorldIdVerification("workline-fx-worker");
      setStatus("verified");
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className="rounded-[22px] border border-white/8 bg-[#393E46] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00ADB5]">
            World ID
          </p>
          <h3 className="mt-2 text-xl font-black text-[#EEEEEE]">
            {status === "verified"
              ? "Verified Human Rebate Active"
              : "Verify to unlock payout rebates"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#EEEEEE]/58">
            Use IDKit to prove a real worker is behind this payout before rebate
            logic is applied.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            status === "verified"
              ? "bg-[#00ADB5]/12 text-[#00ADB5]"
              : "bg-[#222831]/70 text-[#EEEEEE]/70"
          }`}
        >
          {status === "verified"
            ? "Verified"
            : isInstalled
              ? "Ready"
              : "Preview"}
        </span>
      </div>
      <button
        type="button"
        onClick={verify}
        disabled={status === "pending"}
        className="mt-5 w-full rounded-full bg-[#00ADB5] px-5 py-3 text-sm font-black text-[#222831] shadow-sm disabled:opacity-60"
      >
        {status === "pending" ? "Verifying" : "Verify with World ID"}
      </button>
      {status === "error" ? (
        <p className="mt-3 text-sm font-bold text-[#EEEEEE]/58">
          Verification needs valid Developer Portal credentials in `.env.local`.
        </p>
      ) : null}
    </article>
  );
}
