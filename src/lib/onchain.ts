"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { encodeFunctionData, parseUnits } from "viem";

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

// ── WLD transfer via MiniKit.sendTransaction() ───────────────────────
export async function sendDemoTransfer(to: `0x${string}`) {
  const result = await MiniKit.sendTransaction({
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
