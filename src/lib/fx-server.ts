// Server-side viem helpers backed by the deployer wallet. ONLY import
// from server contexts (API routes, server actions). The deployer's
// private key is loaded from `process.env.DEPLOYER_PRIVATE_KEY` and is
// never exposed to the client.

import {
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  ERC20_DEMO_ABI,
  FX_ADDRESSES,
  FX_POOL_ABI,
  FX_RPC_URL,
} from "./fx-contracts";
import { fxPublicClient, worldChain } from "./fx-public-client";

let cachedClient:
  | {
      account: ReturnType<typeof privateKeyToAccount>;
      walletClient: ReturnType<typeof createWalletClient>;
    }
  | null = null;

function getDeployer() {
  if (cachedClient) return cachedClient;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk || !pk.startsWith("0x")) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY is not configured. Run scripts/gen-deployer.mjs.",
    );
  }
  const account = privateKeyToAccount(pk as Hex);
  const walletClient = createWalletClient({
    account,
    chain: worldChain,
    transport: http(FX_RPC_URL),
  });
  cachedClient = { account, walletClient };
  return cachedClient;
}

export type FaucetDripResult = {
  address: Address;
  usdcTxHash: Hex;
  wmxnTxHash: Hex;
};

/// @notice Sponsored faucet drip for a user wallet. The deployer wallet
///         pays gas; the recipient gets demo USDC + wMXN. The contracts
///         enforce a 6h per-recipient cooldown.
export async function sponsoredFaucetDrip(
  to: Address,
): Promise<FaucetDripResult> {
  const { account, walletClient } = getDeployer();

  const usdcTxHash = await walletClient.writeContract({
    account,
    chain: worldChain,
    address: FX_ADDRESSES.usdc,
    abi: ERC20_DEMO_ABI,
    functionName: "faucet",
    args: [to],
  });

  const wmxnTxHash = await walletClient.writeContract({
    account,
    chain: worldChain,
    address: FX_ADDRESSES.wmxn,
    abi: ERC20_DEMO_ABI,
    functionName: "faucet",
    args: [to],
  });

  return { address: to, usdcTxHash, wmxnTxHash };
}

/// @notice Owner-only mint to guarantee a minimum balance. Used by the
///         settle / FX flows to side-step the 6h public faucet cooldown
///         when the user actually needs a specific amount of USDC or
///         wMXN to push a tx through (otherwise World App's simulation
///         reports `simulation_failed` and the popup goes blank).
///
///         If the recipient already holds at least the requested amount,
///         this is a no-op and returns the on-chain balance unchanged.
export async function ensureMinimumBalance(opts: {
  to: Address;
  minUsdc?: bigint;
  minWmxn?: bigint;
}): Promise<{
  usdcBalance: bigint;
  wmxnBalance: bigint;
  usdcMinted?: bigint;
  wmxnMinted?: bigint;
  usdcTxHash?: Hex;
  wmxnTxHash?: Hex;
}> {
  const { to, minUsdc, minWmxn } = opts;
  const { account, walletClient } = getDeployer();

  const [usdcBalance0, wmxnBalance0] = (await Promise.all([
    fxPublicClient.readContract({
      address: FX_ADDRESSES.usdc,
      abi: ERC20_DEMO_ABI,
      functionName: "balanceOf",
      args: [to],
    }),
    fxPublicClient.readContract({
      address: FX_ADDRESSES.wmxn,
      abi: ERC20_DEMO_ABI,
      functionName: "balanceOf",
      args: [to],
    }),
  ])) as [bigint, bigint];

  let usdcBalance = usdcBalance0;
  let wmxnBalance = wmxnBalance0;
  let usdcMinted: bigint | undefined;
  let wmxnMinted: bigint | undefined;
  let usdcTxHash: Hex | undefined;
  let wmxnTxHash: Hex | undefined;

  if (minUsdc && minUsdc > BigInt(0) && usdcBalance < minUsdc) {
    const deficit = minUsdc - usdcBalance;
    usdcTxHash = await walletClient.writeContract({
      account,
      chain: worldChain,
      address: FX_ADDRESSES.usdc,
      abi: ERC20_DEMO_ABI,
      functionName: "mint",
      args: [to, deficit],
    });
    usdcMinted = deficit;
    // CRITICAL: wait for the mint to be mined before returning. If we
    // skip this, the next user-signed tx (e.g. swap on the settle page)
    // gets simulated by World App against an RPC view that still shows
    // balance = 0 → simulation_failed → blank "Receive 0" popup.
    await fxPublicClient.waitForTransactionReceipt({
      hash: usdcTxHash,
      confirmations: 1,
    });
  }

  if (minWmxn && minWmxn > BigInt(0) && wmxnBalance < minWmxn) {
    const deficit = minWmxn - wmxnBalance;
    wmxnTxHash = await walletClient.writeContract({
      account,
      chain: worldChain,
      address: FX_ADDRESSES.wmxn,
      abi: ERC20_DEMO_ABI,
      functionName: "mint",
      args: [to, deficit],
    });
    wmxnMinted = deficit;
    await fxPublicClient.waitForTransactionReceipt({
      hash: wmxnTxHash,
      confirmations: 1,
    });
  }

  // Re-read balances so the response reflects on-chain truth, not the
  // optimistic in-memory accumulator. World App reads from a different
  // RPC than us, but a confirmed receipt + a fresh read here is the
  // strongest signal we can give the client before it triggers MiniKit.
  if (usdcMinted || wmxnMinted) {
    const [usdcAfter, wmxnAfter] = (await Promise.all([
      fxPublicClient.readContract({
        address: FX_ADDRESSES.usdc,
        abi: ERC20_DEMO_ABI,
        functionName: "balanceOf",
        args: [to],
      }),
      fxPublicClient.readContract({
        address: FX_ADDRESSES.wmxn,
        abi: ERC20_DEMO_ABI,
        functionName: "balanceOf",
        args: [to],
      }),
    ])) as [bigint, bigint];
    usdcBalance = usdcAfter;
    wmxnBalance = wmxnAfter;
  }

  return {
    usdcBalance,
    wmxnBalance,
    usdcMinted,
    wmxnMinted,
    usdcTxHash,
    wmxnTxHash,
  };
}

export type SponsoredSwapResult = {
  swapTxHash: Hex;
  approveTxHash?: Hex;
  amountIn: bigint;
  amountOut: bigint;
  minOut: bigint;
};

/// @notice True when the address is past the 6h faucet cooldown for both
///         tokens. Used by the API route to short-circuit redundant
///         drips and return a stable response.
export async function isFaucetEligible(addr: Address): Promise<{
  usdcEligible: boolean;
  wmxnEligible: boolean;
  usdcLast: bigint;
  wmxnLast: bigint;
}> {
  const [usdcLast, wmxnLast, usdcCooldown] = await Promise.all([
    fxPublicClient.readContract({
      address: FX_ADDRESSES.usdc,
      abi: ERC20_DEMO_ABI,
      functionName: "lastFaucetAt",
      args: [addr],
    }) as Promise<bigint>,
    fxPublicClient.readContract({
      address: FX_ADDRESSES.wmxn,
      abi: ERC20_DEMO_ABI,
      functionName: "lastFaucetAt",
      args: [addr],
    }) as Promise<bigint>,
    fxPublicClient.readContract({
      address: FX_ADDRESSES.usdc,
      abi: ERC20_DEMO_ABI,
      functionName: "FAUCET_COOLDOWN",
    }) as Promise<bigint>,
  ]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const ZERO = BigInt(0);
  const usdcEligible = usdcLast === ZERO || now >= usdcLast + usdcCooldown;
  const wmxnEligible = wmxnLast === ZERO || now >= wmxnLast + usdcCooldown;
  return { usdcEligible, wmxnEligible, usdcLast, wmxnLast };
}
