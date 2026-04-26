"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { encodeFunctionData, parseUnits } from "viem";
import {
  ERC20_DEMO_ABI,
  FX_ADDRESSES,
  FX_POOL_ABI,
} from "./fx-contracts";
import { quoteSwap, tokenUnits } from "./fx-public-client";

// Surfaces the underlying MiniKit error_code (e.g. `invalid_contract`,
// `simulation_failed`) when a sendTransaction call throws. Without this
// the UI just sees the generic Error and the user has to dig into the
// Eruda console to know whether to allowlist a contract, fund the
// wallet, or fix calldata.
// Error class that carries the MiniKit error_code so the UI can
// switch on it (e.g. render a Dev Portal allowlist cheat sheet for
// `invalid_contract`).
export class MiniKitError extends Error {
  code?: string;
  details?: unknown;
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "MiniKitError";
    this.code = code;
    this.details = details;
  }
}

function describeMiniKitError(err: unknown, fallback: string): MiniKitError {
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      code?: string;
      error_code?: string;
      details?: unknown;
    };
    const code = e.code ?? e.error_code;
    const base = e.message?.length ? e.message : fallback;
    if (code) {
      const friendly =
        code === "invalid_contract"
          ? "Contract is not allowlisted in the World Dev Portal (Permissions → Contract Entrypoints)."
          : code === "simulation_failed"
            ? "Simulation failed — usually insufficient token balance or wrong calldata."
            : code === "user_rejected"
              ? "You rejected the transaction."
              : code === "disallowed_operation"
                ? "World App refused this operation (check Dev Portal Permissions)."
                : code === "daily_tx_limit_reached"
                  ? "World App daily tx limit reached for this account."
                  : "";
      const detail = friendly ? ` — ${friendly}` : "";
      return new MiniKitError(
        `${base} [${code}]${detail}`,
        code,
        e.details,
      );
    }
    return new MiniKitError(base);
  }
  return new MiniKitError(fallback);
}

// ── World Chain mainnet token addresses ──────────────────────────────
export const WORLD_CHAIN_ID = 480;
export const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1" as const;
export const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003" as const;
export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

const EXPLORER_BASE = "https://worldscan.org";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// 0.01 WLD (18 decimals)
const DEMO_AMOUNT = parseUnits("0.01", 18);

// 50 bps slippage tolerance on demo swaps.
const SLIPPAGE_BPS = BigInt(50);
const BPS_DENOM = BigInt(10_000);

// ── WLD transfer via MiniKit.sendTransaction() ───────────────────────
export async function sendDemoTransfer(to: `0x${string}`) {
  let result;
  try {
    result = await MiniKit.sendTransaction({
      chainId: WORLD_CHAIN_ID,
      transactions: [
        {
          to: WLD_ADDRESS,
          data: encodeFunctionData({
            abi: ERC20_TRANSFER_ABI,
            functionName: "transfer",
            args: [to, DEMO_AMOUNT],
          }),
        },
      ],
    });
  } catch (e) {
    throw describeMiniKitError(e, "WLD transfer failed");
  }

  if (result?.executedWith === "minikit" && result.data?.userOpHash) {
    return {
      userOpHash: result.data.userOpHash,
      from: result.data.from,
      status: result.data.status,
    };
  }

  throw new Error("Transaction was cancelled or failed");
}

// ── Poll Developer Portal for final tx hash ──────────────────────────
export async function pollUserOpReceipt(
  userOpHash: string,
  maxAttempts = 20,
  intervalMs = 3000,
): Promise<{ transactionHash: string; status: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(
        `https://developer.world.org/api/v2/minikit/userop/${userOpHash}`,
      );

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.transaction_hash) {
          return {
            transactionHash: data.transaction_hash,
            status: "success",
          };
        }
      }
    } catch {
      // Retry on network errors
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Transaction confirmation timed out");
}

// ── Real FX swap via the Workline FX pool (USDC → wMXN) ──────────────
//
// Bundles approve(pool, amountIn) + pool.swap(amountIn, USDC, recipient,
// minOut) into a single MiniKit `sendTransaction` so the user only has
// to confirm once.
export async function sendUsdcToWmxnSwap(opts: {
  recipient: `0x${string}`;
  amountUsdc: number;
}) {
  const { recipient, amountUsdc } = opts;
  if (amountUsdc <= 0) {
    throw new Error("Swap amount must be positive");
  }

  const amountIn = tokenUnits(amountUsdc);
  const quotedOut = await quoteSwap(amountIn, FX_ADDRESSES.usdc);
  if (quotedOut === BigInt(0)) {
    throw new Error("Pool has no liquidity for this swap");
  }
  const minOut = (quotedOut * (BPS_DENOM - SLIPPAGE_BPS)) / BPS_DENOM;

  let result;
  try {
    result = await MiniKit.sendTransaction({
      chainId: WORLD_CHAIN_ID,
      transactions: [
        {
          to: FX_ADDRESSES.usdc,
          data: encodeFunctionData({
            abi: ERC20_DEMO_ABI,
            functionName: "approve",
            args: [FX_ADDRESSES.pool, amountIn],
          }),
        },
        {
          to: FX_ADDRESSES.pool,
          data: encodeFunctionData({
            abi: FX_POOL_ABI,
            functionName: "swap",
            args: [amountIn, FX_ADDRESSES.usdc, recipient, minOut],
          }),
        },
      ],
    });
  } catch (e) {
    throw describeMiniKitError(e, "Swap failed");
  }

  if (result?.executedWith === "minikit" && result.data?.userOpHash) {
    return {
      userOpHash: result.data.userOpHash,
      from: result.data.from,
      status: result.data.status,
      amountIn,
      quotedOut,
      minOut,
    };
  }
  throw new Error("Swap was cancelled or failed");
}

// ── Add liquidity to the Workline FX pool ────────────────────────────
//
// Three-leg bundled tx: approve USDC → approve wMXN → addLiquidity. The
// caller is responsible for sizing `amountUsdc`/`amountWmxn` to roughly
// match the existing reserve ratio; excess input is swept into the pool
// and not refunded (this is intentional Uniswap V2-style behavior).
export async function sendAddLiquidity(opts: {
  recipient: `0x${string}`;
  amountUsdc: number;
  amountWmxn: number;
  minShares?: bigint;
}) {
  const { recipient, amountUsdc, amountWmxn, minShares = BigInt(0) } = opts;
  if (amountUsdc <= 0 || amountWmxn <= 0) {
    throw new Error("Both deposit amounts must be positive");
  }

  const amount0 = tokenUnits(amountUsdc);
  const amount1 = tokenUnits(amountWmxn);

  let result;
  try {
    result = await MiniKit.sendTransaction({
      chainId: WORLD_CHAIN_ID,
      transactions: [
        {
          to: FX_ADDRESSES.usdc,
          data: encodeFunctionData({
            abi: ERC20_DEMO_ABI,
            functionName: "approve",
            args: [FX_ADDRESSES.pool, amount0],
          }),
        },
        {
          to: FX_ADDRESSES.wmxn,
          data: encodeFunctionData({
            abi: ERC20_DEMO_ABI,
            functionName: "approve",
            args: [FX_ADDRESSES.pool, amount1],
          }),
        },
        {
          to: FX_ADDRESSES.pool,
          data: encodeFunctionData({
            abi: FX_POOL_ABI,
            functionName: "addLiquidity",
            args: [amount0, amount1, recipient, minShares],
          }),
        },
      ],
    });
  } catch (e) {
    throw describeMiniKitError(e, "Add-liquidity failed");
  }

  if (result?.executedWith === "minikit" && result.data?.userOpHash) {
    return {
      userOpHash: result.data.userOpHash,
      from: result.data.from,
      status: result.data.status,
      amount0,
      amount1,
    };
  }
  throw new Error("Add-liquidity was cancelled or failed");
}

// ── Sponsored faucet trigger (calls /api/faucet) ─────────────────────
//
// Optional `minUsdc` / `minWmxn` (human units, e.g. 500 = 500 USDC) make
// the server-side route owner-mint the deficit so the wallet always
// holds at least that much before the next user-signed tx. This is what
// keeps the World App swap popup populated (insufficient balance => sim
// fails => popup shows "Receive 0 wMXN").
export type SponsoredFaucetResponse = {
  ok: true;
  address: string;
  usdcTxHash?: string;
  wmxnTxHash?: string;
  publicDripSkipped?: string;
  topUp?: {
    usdcBalance: string;
    wmxnBalance: string;
    usdcMinted?: string;
    wmxnMinted?: string;
    usdcTxHash?: string;
    wmxnTxHash?: string;
  } | null;
};

export async function requestSponsoredFaucet(
  address: string,
  opts?: { minUsdc?: number; minWmxn?: number },
): Promise<SponsoredFaucetResponse> {
  const res = await fetch("/api/faucet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address,
      minUsdc: opts?.minUsdc,
      minWmxn: opts?.minWmxn,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Faucet failed (${res.status})`);
  }
  return (await res.json()) as SponsoredFaucetResponse;
}

// ── Sponsored settle swap (USDC → wMXN, signed by deployer) ──────────
//
// Hits `/api/settle/swap` which approves USDC to the pool and executes
// `pool.swap(...)` from the deployer wallet, with `to=recipient` so the
// user's wallet receives the swapped wMXN directly. This bypasses
// MiniKit's contract allowlist entirely and gives the demo a 100%
// reliable on-chain settlement path even when World App's pre-confirm
// rejects the user-signed bundle with `invalid_contract`.
export type SponsoredSwapResponse = {
  ok: true;
  recipient: `0x${string}`;
  swapTxHash: `0x${string}`;
  approveTxHash?: `0x${string}`;
  amountIn: string;
  amountOut: string;
  minOut: string;
  explorerUrl: string;
};

export async function requestSponsoredSettleSwap(opts: {
  recipient: string;
  amountUsdc: number;
  slippageBps?: number;
}): Promise<SponsoredSwapResponse> {
  const res = await fetch("/api/settle/swap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address: opts.recipient,
      amountUsdc: opts.amountUsdc,
      slippageBps: opts.slippageBps,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Sponsored swap failed (${res.status})`);
  }
  return (await res.json()) as SponsoredSwapResponse;
}

// ── Explorer URL builder ─────────────────────────────────────────────
export function explorerTxUrl(txHash: string) {
  return `${EXPLORER_BASE}/tx/${txHash}`;
}

// ── Get user's wallet address ────────────────────────────────────────
export function getUserWalletAddress(): `0x${string}` | null {
  try {
    const mkAddr = MiniKit.user?.walletAddress;
    if (mkAddr?.startsWith("0x")) return mkAddr as `0x${string}`;
  } catch {
    // MiniKit not available
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("wl_wallet_address");
    if (stored?.startsWith("0x")) return stored as `0x${string}`;
  }
  return null;
}

export function setUserWalletAddress(addr: string) {
  if (typeof window !== "undefined" && addr.startsWith("0x")) {
    localStorage.setItem("wl_wallet_address", addr);
  }
}
