"use client";

import type { PendingSettlement, SettleResponse } from "./minihub-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const PREFIX = "worklinefx:v1:";
const DEMO_ENV = process.env.NEXT_PUBLIC_WORKLINE_DEMO === "1" || process.env.NEXT_PUBLIC_WORKLINE_DEMO === "true";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

type DemoState = {
  verifiedHuman: boolean;
  setVerifiedHuman: (v: boolean) => void;
  preferredCurrency: string;
  setPreferredCurrency: (code: string) => void;
  completedSettlements: SettleResponse[];
  appendSettlement: (s: SettleResponse) => void;
  consumedPayoutIds: string[];
  consumePayout: (id: string) => void;
  lastSettlement: SettleResponse | null;
  setLastSettlement: (s: SettleResponse | null) => void;
  pendingSettlement: PendingSettlement | null;
  setPendingSettlement: (p: PendingSettlement | null) => void;
  isDemoMode: boolean;
  resetDemo: () => void;
};

const Ctx = createContext<DemoState | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [verifiedHuman, _setVerified] = useState(DEMO_ENV);
  const [preferredCurrency, _setPref] = useState("wMXN");
  const [completedSettlements, _setCompleted] = useState<SettleResponse[]>([]);
  const [consumedPayoutIds, _setConsumed] = useState<string[]>([]);
  const [lastSettlement, _setLast] = useState<SettleResponse | null>(null);
  const [pendingSettlement, _setPending] = useState<PendingSettlement | null>(null);

  useEffect(() => {
    _setVerified(load("verifiedHuman", DEMO_ENV));
    _setPref(load("preferredCurrency", "wMXN"));
    _setCompleted(load("completedSettlements", []));
    _setConsumed(load("consumedPayoutIds", []));
    _setLast(load("lastSettlement", null));
    _setPending(load("pendingSettlement", null));
    setReady(true);
  }, []);

  const setVerifiedHuman = useCallback((v: boolean) => { _setVerified(v); save("verifiedHuman", v); }, []);
  const setPreferredCurrency = useCallback((c: string) => { _setPref(c); save("preferredCurrency", c); }, []);
  const appendSettlement = useCallback((s: SettleResponse) => {
    _setCompleted((prev) => { const next = [s, ...prev]; save("completedSettlements", next); return next; });
  }, []);
  const consumePayout = useCallback((id: string) => {
    _setConsumed((prev) => { if (prev.includes(id)) return prev; const next = [...prev, id]; save("consumedPayoutIds", next); return next; });
  }, []);
  const setLastSettlement = useCallback((s: SettleResponse | null) => { _setLast(s); save("lastSettlement", s); }, []);
  const setPendingSettlement = useCallback((p: PendingSettlement | null) => { _setPending(p); save("pendingSettlement", p); }, []);
  const resetDemo = useCallback(() => {
    setVerifiedHuman(DEMO_ENV);
    setPreferredCurrency("wMXN");
    _setCompleted([]); save("completedSettlements", []);
    _setConsumed([]); save("consumedPayoutIds", []);
    setLastSettlement(null);
    setPendingSettlement(null);
  }, [setVerifiedHuman, setPreferredCurrency, setLastSettlement, setPendingSettlement]);

  const value = useMemo(() => ({
    verifiedHuman, setVerifiedHuman,
    preferredCurrency, setPreferredCurrency,
    completedSettlements, appendSettlement,
    consumedPayoutIds, consumePayout,
    lastSettlement, setLastSettlement,
    pendingSettlement, setPendingSettlement,
    isDemoMode: DEMO_ENV,
    resetDemo,
  }), [verifiedHuman, setVerifiedHuman, preferredCurrency, setPreferredCurrency, completedSettlements, appendSettlement, consumedPayoutIds, consumePayout, lastSettlement, setLastSettlement, pendingSettlement, setPendingSettlement, resetDemo]);

  if (!ready) return null;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoState must be used within DemoStateProvider");
  return ctx;
}
