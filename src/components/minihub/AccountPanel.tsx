"use client";

import { walletAuth } from "@/auth/wallet";
import { currencies } from "@/data/minihub";
import { useDemoState } from "@/lib/demo-state";
import { isRunningInWorldApp } from "@/lib/integrations/minikit";
import { requestWorldIdVerification } from "@/lib/integrations/world-id";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { RebateBadge } from "./RebateBadge";

export function AccountPanel() {
  const { data: session } = useSession();
  const { verifiedHuman, setVerifiedHuman, preferredCurrency, setPreferredCurrency, isDemoMode, completedSettlements, resetDemo } = useDemoState();
  const [pending, setPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setAuthError(null);
    try {
      await walletAuth();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      if (isRunningInWorldApp() && process.env.NEXT_PUBLIC_RP_CONFIGURED === "true") {
        await requestWorldIdVerification("workline-fx-verify");
      }
      setVerifiedHuman(true);
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }, [setVerifiedHuman]);

  return (
    <section className="grid gap-4">
      {/* Wallet */}
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[22px] bg-white p-5 shadow-[0_2px_16px_rgba(27,31,59,0.06)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B3FE7]">Account</p>
        <h1 className="mt-3 text-2xl font-black text-[#1B1F3B]">{session?.user?.username || "Connect to Workline FX"}</h1>
        {session?.user?.walletAddress && (
          <p className="mt-1 font-mono text-[10px] text-[#BCC0CE]">
            {session.user.walletAddress.slice(0, 6)}...{session.user.walletAddress.slice(-4)}
          </p>
        )}
        <p className="mt-2 text-xs text-[#9094A6]">Wallet Auth is the primary sign-in for World Mini Apps.</p>
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={session ? () => signOut({ callbackUrl: "/" }) : signIn} disabled={pending} className="mt-5 w-full rounded-[14px] bg-[#1B1F3B] py-3.5 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Connecting…" : session ? "Log out" : "Sign in with wallet"}
        </motion.button>
        {authError && <p className="mt-2 text-[10px] text-[#EF4444]">{authError}</p>}
      </motion.article>

      {/* World ID verification */}
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#1B1F3B]">World ID</p>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${verifiedHuman ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#F4F5F9] text-[#9094A6]"}`}>
            {verifiedHuman ? "Verified" : "Not verified"}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#9094A6]">
          {verifiedHuman
            ? "You are a verified human. Rebate pricing is active on all FX settlements."
            : "Verify your identity to unlock better payout economics and FX rebates."}
        </p>
        {!verifiedHuman && (
          <>
            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={handleVerify} disabled={verifying} className="mt-3 w-full rounded-[14px] bg-[#3B3FE7] py-3 text-sm font-bold text-white disabled:opacity-50">
              {verifying ? "Verifying…" : "Verify with World ID"}
            </motion.button>
            {verifyError && <p className="mt-2 text-[10px] text-[#EF4444]">{verifyError}</p>}
          </>
        )}
      </motion.article>

      {/* Rebate + economics */}
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-[22px] bg-[#1B1F3B] p-5 text-white">
        <RebateBadge eligible={verifiedHuman} />
        <h2 className="mt-4 text-lg font-black">Better payout economics</h2>
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          {verifiedHuman
            ? "Your verified status unlocks reduced swap fees and cashback on every FX payout via the Uniswap v4 rebate hook."
            : "Verify with World ID to unlock recipient rebates. Blockchain stays invisible, you just get better rates."}
        </p>
      </motion.article>

      {/* Preferred currency */}
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
        <p className="text-sm font-bold text-[#1B1F3B]">Preferred settlement</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {currencies.map((c) => (
            <button key={c.code} type="button" onClick={() => setPreferredCurrency(c.code)} className={`rounded-[14px] p-3.5 text-left transition ${preferredCurrency === c.code ? "bg-[#3B3FE7]/5 ring-1 ring-[#3B3FE7]" : "bg-[#F4F5F9]"}`}>
              <p className="text-sm font-bold text-[#1B1F3B]">{c.code}</p>
              <p className="mt-0.5 text-[10px] text-[#9094A6]">{c.name}</p>
            </button>
          ))}
        </div>
      </motion.article>

      {/* Stats */}
      <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(27,31,59,0.04)]">
        <p className="text-sm font-bold text-[#1B1F3B]">Settlement stats</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-[#F4F5F9] p-3">
            <p className="text-lg font-black text-[#1B1F3B]">{completedSettlements.length}</p>
            <p className="text-[10px] text-[#9094A6]">Settlements completed</p>
          </div>
          <div className="rounded-[12px] bg-[#F4F5F9] p-3">
            <p className="text-lg font-black text-[#1B1F3B]">${completedSettlements.reduce((s, c) => s + c.rebateAmount, 0).toFixed(2)}</p>
            <p className="text-[10px] text-[#9094A6]">Total rebates earned</p>
          </div>
        </div>
      </motion.article>

      {/* Environment / demo note */}
      {isDemoMode && (
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-[22px] bg-[#F4F5F9] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#9094A6]">Demo mode</p>
              <p className="mt-1 text-[10px] text-[#BCC0CE]">Mock settlement API · Verification simulated</p>
            </div>
            <button type="button" onClick={resetDemo} className="rounded-[10px] bg-white px-3 py-1.5 text-[10px] font-bold text-[#9094A6] active:scale-95">Reset</button>
          </div>
        </motion.article>
      )}
    </section>
  );
}
