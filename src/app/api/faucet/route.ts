import { NextResponse } from "next/server";
import type { Address } from "viem";
import { isAddress } from "viem";
import {
  ensureMinimumBalance,
  isFaucetEligible,
  sponsoredFaucetDrip,
} from "@/lib/fx-server";
import { FX_TOKEN_DECIMALS } from "@/lib/fx-contracts";

export const runtime = "nodejs";

const TOKEN_UNIT = BigInt(10) ** BigInt(FX_TOKEN_DECIMALS);

function toUnits(human: number): bigint {
  if (!Number.isFinite(human) || human <= 0) return BigInt(0);
  // Round up to the next whole token unit so the swap simulation always
  // sees enough headroom (slippage + tiny rounding inside the AMM).
  const scaled = Math.ceil(human * Number(TOKEN_UNIT));
  return BigInt(scaled);
}

/// Sponsored faucet endpoint — drips demo USDC + wMXN to the requested
/// wallet. Gas is paid by the Workline FX deployer.
///
/// Behavior:
///   - First, attempts the public `faucet()` drip. The contract enforces
///     a 6h per-recipient cooldown.
///   - If the caller passes `minUsdc` / `minWmxn`, then AFTER the public
///     drip we call the owner-only `mint()` to top the wallet up to the
///     requested minimum. This bypasses the cooldown and is what makes
///     the settle / addLiquidity flows show a populated balance change
///     in the World App popup (simulation needs sufficient balance to
///     succeed; if it fails, World App renders a blank "Receive 0").
export async function POST(req: Request) {
  let body: {
    address?: string;
    minUsdc?: number;
    minWmxn?: number;
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
  const address = raw as Address;
  const minUsdc = toUnits(Number(body.minUsdc ?? 0));
  const minWmxn = toUnits(Number(body.minWmxn ?? 0));

  let usdcTxHash: string | undefined;
  let wmxnTxHash: string | undefined;
  let publicDripSkipped: string | undefined;

  try {
    const eligibility = await isFaucetEligible(address);
    if (eligibility.usdcEligible || eligibility.wmxnEligible) {
      const drip = await sponsoredFaucetDrip(address);
      usdcTxHash = drip.usdcTxHash;
      wmxnTxHash = drip.wmxnTxHash;
    } else {
      publicDripSkipped = "cooldown";
    }
  } catch (err) {
    publicDripSkipped =
      err instanceof Error ? err.message : "public drip failed";
  }

  // If the caller asked for a minimum balance, guarantee it via owner
  // mint(). This sidesteps the public faucet cooldown and makes the
  // subsequent swap / addLiquidity simulation succeed every time.
  let topUp: Awaited<ReturnType<typeof ensureMinimumBalance>> | null = null;
  if (minUsdc > BigInt(0) || minWmxn > BigInt(0)) {
    try {
      topUp = await ensureMinimumBalance({
        to: address,
        minUsdc: minUsdc > BigInt(0) ? minUsdc : undefined,
        minWmxn: minWmxn > BigInt(0) ? minWmxn : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "top-up failed";
      return NextResponse.json(
        { error: msg, publicDripSkipped, usdcTxHash, wmxnTxHash },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    address,
    usdcTxHash,
    wmxnTxHash,
    publicDripSkipped,
    topUp: topUp
      ? {
          usdcBalance: topUp.usdcBalance.toString(),
          wmxnBalance: topUp.wmxnBalance.toString(),
          usdcMinted: topUp.usdcMinted?.toString(),
          wmxnMinted: topUp.wmxnMinted?.toString(),
          usdcTxHash: topUp.usdcTxHash,
          wmxnTxHash: topUp.wmxnTxHash,
        }
      : null,
  });
}
