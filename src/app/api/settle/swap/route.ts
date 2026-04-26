import { NextResponse } from "next/server";
import type { Address } from "viem";
import { isAddress } from "viem";
import { tokenUnits } from "@/lib/fx-public-client";

export const runtime = "nodejs";

/// Server-sponsored settle swap.
///
/// Why this exists: World App's MiniKit `sendTransaction` enforces a
/// per-app contract allowlist that occasionally rejects pool calls with
/// `invalid_contract` even when every contract is correctly registered
/// in the Developer Portal (most reproducibly for the swap entrypoint
/// after addLiquidity has already worked). To keep the demo end-to-end
/// reliable, we sign the swap on the server with the deployer wallet
/// and deliver the wMXN directly to the user's address. Same pool,
/// same on-chain semantics, no allowlist friction.
export async function POST(req: Request) {
  let body: {
    address?: string;
    amountUsdc?: number;
    slippageBps?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const raw = (body.address ?? "").trim();
  if (!isAddress(raw)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  const recipient = raw as Address;

  const amountHuman = Number(body.amountUsdc ?? 0);
  if (!Number.isFinite(amountHuman) || amountHuman <= 0) {
    return NextResponse.json(
      { error: "amountUsdc must be > 0" },
      { status: 400 },
    );
  }

  const amountIn = tokenUnits(amountHuman);
  const slippageBpsNum = Number(body.slippageBps ?? 50);
  const slippageBps =
    Number.isFinite(slippageBpsNum) && slippageBpsNum > 0 && slippageBpsNum < 5_000
      ? BigInt(Math.round(slippageBpsNum))
      : BigInt(50);

  // sponsored swap wired up in the next commit
  void recipient;
  void amountIn;
  void slippageBps;
  return NextResponse.json(
    { error: "sponsored swap not yet wired" },
    { status: 501 },
  );
}
