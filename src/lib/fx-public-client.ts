// Read-only viem client for the Workline FX stack on World Chain.
// Lives separately from `fx-server.ts` (which holds the deployer signer)
// so that the public client can be safely imported from client components.

import { createPublicClient, defineChain, http, type Address } from "viem";
import {
  ERC20_DEMO_ABI,
  FX_ADDRESSES,
  FX_CHAIN_ID,
  FX_POOL_ABI,
  FX_RPC_URL,
  FX_TOKEN_DECIMALS,
} from "./fx-contracts";

export const worldChain = defineChain({
  id: FX_CHAIN_ID,
  name: "World Chain",
  nativeCurrency: { name: "Worldcoin", symbol: "WLD", decimals: 18 },
  rpcUrls: { default: { http: [FX_RPC_URL] } },
  blockExplorers: {
    default: { name: "Worldscan", url: "https://worldscan.org" },
  },
});

export const fxPublicClient = createPublicClient({
  chain: worldChain,
  transport: http(FX_RPC_URL, { batch: true }),
});

export type FxBalances = {
  usdc: bigint;
  wmxn: bigint;
  lpShares: bigint;
};

export type FxReserves = {
  reserveUsdc: bigint;
  reserveWmxn: bigint;
  // Mid-price expressed as USDC per 1 wMXN (and vice-versa) — convenient
  // for UI display. Both are floats; do not use for accounting.
  usdcPerWmxn: number;
  wmxnPerUsdc: number;
};

export async function readFxReserves(): Promise<FxReserves> {
  const [r0, r1] = (await fxPublicClient.readContract({
    address: FX_ADDRESSES.pool,
    abi: FX_POOL_ABI,
    functionName: "getReserves",
  })) as readonly [bigint, bigint];

  const usdcF = Number(r0) / 10 ** FX_TOKEN_DECIMALS;
  const wmxnF = Number(r1) / 10 ** FX_TOKEN_DECIMALS;
  return {
    reserveUsdc: r0,
    reserveWmxn: r1,
    usdcPerWmxn: wmxnF > 0 ? usdcF / wmxnF : 0,
    wmxnPerUsdc: usdcF > 0 ? wmxnF / usdcF : 0,
  };
}

export async function readFxBalances(owner: Address): Promise<FxBalances> {
  const [usdc, wmxn, lp] = await Promise.all([
    fxPublicClient.readContract({
      address: FX_ADDRESSES.usdc,
      abi: ERC20_DEMO_ABI,
      functionName: "balanceOf",
      args: [owner],
    }) as Promise<bigint>,
    fxPublicClient.readContract({
      address: FX_ADDRESSES.wmxn,
      abi: ERC20_DEMO_ABI,
      functionName: "balanceOf",
      args: [owner],
    }) as Promise<bigint>,
    fxPublicClient.readContract({
      address: FX_ADDRESSES.pool,
      abi: FX_POOL_ABI,
      functionName: "balanceOf",
      args: [owner],
    }) as Promise<bigint>,
  ]);
  return { usdc, wmxn, lpShares: lp };
}

export async function quoteSwap(
  amountIn: bigint,
  tokenIn: Address,
): Promise<bigint> {
  return (await fxPublicClient.readContract({
    address: FX_ADDRESSES.pool,
    abi: FX_POOL_ABI,
    functionName: "quote",
    args: [amountIn, tokenIn],
  })) as bigint;
}

/// Polls the user's token balance until it reaches `minRaw` (raw 6-dec
/// units) or `timeoutMs` elapses. Returns the final balance.
///
/// Used immediately after `/api/faucet` returns so we don't fire a
/// MiniKit swap before our RPC view shows the new balance — without
/// this, World App's pre-confirm simulation can race the mint receipt
/// and report `simulation_failed`.
export async function waitForMinTokenBalance(opts: {
  owner: Address;
  token: Address;
  minRaw: bigint;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<bigint> {
  const { owner, token, minRaw, timeoutMs = 8_000, intervalMs = 500 } = opts;
  const deadline = Date.now() + timeoutMs;
  let balance = BigInt(0);
  while (Date.now() < deadline) {
    balance = (await fxPublicClient.readContract({
      address: token,
      abi: ERC20_DEMO_ABI,
      functionName: "balanceOf",
      args: [owner],
    })) as bigint;
    if (balance >= minRaw) return balance;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return balance;
}

export function formatFxToken(value: bigint): string {
  const base = BigInt(10) ** BigInt(FX_TOKEN_DECIMALS);
  const whole = value / base;
  const frac = value % base;
  if (frac === BigInt(0)) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(FX_TOKEN_DECIMALS, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

export function tokenUnits(value: number): bigint {
  // Convert a human float (e.g. 780.5) to 6-decimal raw units.
  if (!Number.isFinite(value) || value < 0) return BigInt(0);
  const fixed = value.toFixed(FX_TOKEN_DECIMALS);
  const [whole, frac = ""] = fixed.split(".");
  const padded = (frac + "0".repeat(FX_TOKEN_DECIMALS)).slice(
    0,
    FX_TOKEN_DECIMALS,
  );
  const base = BigInt(10) ** BigInt(FX_TOKEN_DECIMALS);
  return BigInt(whole) * base + BigInt(padded);
}
