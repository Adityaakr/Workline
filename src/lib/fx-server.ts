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

/// @notice Server-sponsored USDC → wMXN swap on the Workline FX pool.
///         The deployer wallet pays in USDC + gas; the recipient gets
///         the swapped wMXN delivered straight to their wallet.
///
///         This exists as a fallback for the settle flow when the user
///         can't sign the swap themselves (e.g. World App rejects the
///         pool entrypoint or the contract isn't yet allowlisted in the
///         Developer Portal). Same pool, same fee, same on-chain effect
///         — only the signer differs. The user wallet still ends up
///         with real wMXN they can spend.
export async function sponsoredSwapUsdcToWmxn(opts: {
  recipient: Address;
  amountIn: bigint;
  slippageBps?: bigint;
}): Promise<SponsoredSwapResult> {
  const { recipient, amountIn } = opts;
  const slippageBps = opts.slippageBps ?? BigInt(50);
  const BPS_DENOM = BigInt(10_000);
  if (amountIn <= BigInt(0)) {
    throw new Error("amountIn must be positive");
  }

  const { account, walletClient } = getDeployer();

  // Quote the swap against current reserves so we can compute a sane
  // minOut. We re-read here (instead of trusting the client-supplied
  // value) so the slippage band always reflects the freshest pool
  // state at the moment the deployer signs.
  const quotedOut = (await fxPublicClient.readContract({
    address: FX_ADDRESSES.pool,
    abi: FX_POOL_ABI,
    functionName: "quote",
    args: [amountIn, FX_ADDRESSES.usdc],
  })) as bigint;
  if (quotedOut === BigInt(0)) {
    throw new Error("Pool has no liquidity for this swap");
  }
  const minOut = (quotedOut * (BPS_DENOM - slippageBps)) / BPS_DENOM;

  // Make sure the pool can pull USDC from the deployer. We approve a
  // very large headroom (~100k USDC at 6 dp = 1e11) once and skip
  // re-approving on subsequent calls — this avoids a race where the
  // approve receipt has been observed by our public RPC but the L2
  // sequencer that picks up the swap hasn't yet seen the updated
  // allowance, which surfaces as `ERC20InsufficientAllowance`.
  const HEADROOM = BigInt("100000000000"); // 100,000 USDC raw
  const currentAllowance = (await fxPublicClient.readContract({
    address: FX_ADDRESSES.usdc,
    abi: ERC20_DEMO_ABI,
    functionName: "allowance",
    args: [account.address, FX_ADDRESSES.pool],
  })) as bigint;

  let approveTxHash: Hex | undefined;
  if (currentAllowance < amountIn) {
    try {
      approveTxHash = await walletClient.writeContract({
        account,
        chain: worldChain,
        address: FX_ADDRESSES.usdc,
        abi: ERC20_DEMO_ABI,
        functionName: "approve",
        args: [FX_ADDRESSES.pool, HEADROOM],
      });
      await fxPublicClient.waitForTransactionReceipt({
        hash: approveTxHash,
        confirmations: 2,
      });
    } catch (err) {
      throw new Error(
        `approve(USDC → pool) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    // Belt-and-suspenders: poll until our public RPC actually sees
    // the elevated allowance before we let the swap go out. World
    // Chain's RPC fanout occasionally returns a confirmed receipt
    // while still serving stale `eth_call` results for ~1 block.
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      const a = (await fxPublicClient.readContract({
        address: FX_ADDRESSES.usdc,
        abi: ERC20_DEMO_ABI,
        functionName: "allowance",
        args: [account.address, FX_ADDRESSES.pool],
      })) as bigint;
      if (a >= amountIn) break;
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // Execute the swap with `to = recipient` so the wMXN lands directly
  // in the user's World App wallet — no extra transfer needed.
  let swapTxHash: Hex;
  try {
    swapTxHash = await walletClient.writeContract({
      account,
      chain: worldChain,
      address: FX_ADDRESSES.pool,
      abi: FX_POOL_ABI,
      functionName: "swap",
      args: [amountIn, FX_ADDRESSES.usdc, recipient, minOut],
    });
    await fxPublicClient.waitForTransactionReceipt({
      hash: swapTxHash,
      confirmations: 1,
    });
  } catch (err) {
    throw new Error(
      `pool.swap failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    swapTxHash,
    approveTxHash,
    amountIn,
    amountOut: quotedOut,
    minOut,
  };
}

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
