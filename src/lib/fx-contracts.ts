// Workline FX on-chain config + typed ABIs for the demo stack
// (MockUSDC + MockWMXN + WorklineFXPool) deployed to World Chain mainnet.
//
// Addresses are sourced from public env first; if they are missing
// (e.g. local dev before deploy) we fall back to the predicted CREATE
// addresses for the deployer at nonce 0/1/2.

const FALLBACK_USDC = "0x3F1b3EEC56F338C73C9f04505bf77C19F28d0c3a" as const;
const FALLBACK_WMXN = "0x745711537dd7Eb449aA526c1203D808AD8AC4a34" as const;
const FALLBACK_POOL = "0x1492Dedc2aC62bbC181Ba938EAb5B000b70D8F6E" as const;
const FALLBACK_RPC = "https://worldchain-mainnet.g.alchemy.com/public" as const;

export const FX_CHAIN_ID = 480;
export const FX_TOKEN_DECIMALS = 6;

function readAddress(envValue: string | undefined, fallback: `0x${string}`): `0x${string}` {
  const v = (envValue ?? "").trim();
  if (!v) return fallback;
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return fallback;
  return v as `0x${string}`;
}

export const FX_ADDRESSES = {
  usdc: readAddress(process.env.NEXT_PUBLIC_FX_USDC_ADDRESS, FALLBACK_USDC),
  wmxn: readAddress(process.env.NEXT_PUBLIC_FX_WMXN_ADDRESS, FALLBACK_WMXN),
  pool: readAddress(process.env.NEXT_PUBLIC_FX_POOL_ADDRESS, FALLBACK_POOL),
} as const;

export const FX_RPC_URL =
  (process.env.NEXT_PUBLIC_WORLDCHAIN_RPC ?? "").trim() || FALLBACK_RPC;

export const FX_EXPLORER_BASE = "https://worldscan.org";

// ── Minimal typed ABIs (only the surface we actually call) ────────────

export const ERC20_DEMO_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "faucet",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lastFaucetAt",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "FAUCET_COOLDOWN",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "faucetAmount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const FX_POOL_ABI = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "uint128" },
      { name: "", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "quote",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "swap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn", type: "address" },
      { name: "to", type: "address" },
      { name: "minOut", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "addLiquidity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
      { name: "to", type: "address" },
      { name: "minShares", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "FEE_BPS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
] as const;
