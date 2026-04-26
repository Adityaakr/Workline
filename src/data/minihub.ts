import type {
  Agreement,
  Badge,
  ChartDataPoint,
  Currency,
  Feature,
  Payout,
  PayoutMixItem,
  Pool,
  SettlementQuote,
  Stat,
} from "@/lib/minihub-types";

export const currencies: Currency[] = [
  { code: "wMXN", name: "Mexican Peso Stablecoin", symbol: "$", rate: 17.12, fee: "0.15%", rebate: "0.08%" },
  { code: "wBRL", name: "Brazilian Real Stablecoin", symbol: "R$", rate: 5.04, fee: "0.18%", rebate: "0.10%" },
  { code: "wINR", name: "Indian Rupee Stablecoin", symbol: "₹", rate: 83.45, fee: "0.12%", rebate: "0.06%" },
  { code: "USDC", name: "US Dollar Coin", symbol: "$", rate: 1.0, fee: "0.00%", rebate: null },
];

export const payouts: Payout[] = [
  {
    id: "WL-2060",
    direction: "incoming",
    sender: "Acme Corp",
    recipient: "You",
    purpose: "Logo Design — Milestone 3",
    amount: 500,
    sourceCurrency: "USDC",
    status: "ready",
    timestamp: "Just now",
  },
  {
    id: "WL-2048",
    direction: "incoming",
    sender: "Acme Corp",
    recipient: "You",
    purpose: "Logo Design — Milestone 2",
    amount: 350,
    sourceCurrency: "wMXN",
    status: "settled",
    timestamp: "2h ago",
  },
  {
    id: "WL-2051",
    direction: "incoming",
    sender: "TechFlow Inc",
    recipient: "You",
    purpose: "API Integration",
    amount: 1200,
    sourceCurrency: "USDC",
    status: "ready",
    timestamp: "1d ago",
  },
  {
    id: "WL-2054",
    direction: "incoming",
    sender: "Luxe Studio",
    recipient: "You",
    purpose: "Brand Guidelines",
    amount: 800,
    sourceCurrency: "wBRL",
    status: "settled",
    timestamp: "3d ago",
  },
  {
    id: "WL-2057",
    direction: "outgoing",
    sender: "You",
    recipient: "StartupXYZ",
    purpose: "Mobile App UI",
    amount: 1400,
    sourceCurrency: "USDC",
    status: "sent",
    timestamp: "5d ago",
  },
];

export const stats: Stat[] = [
  { label: "Settled this month", value: "$18,420", detail: "Across 12 payouts" },
  { label: "Rebate earned", value: "$86.40", detail: "Verified human pricing" },
  { label: "Active agreements", value: "3", detail: "1 ready for payout" },
];

export const agreements: Agreement[] = [
  { id: 1, title: "Logo Design System", client: "Acme Corp", total: "$1,200", paid: "$700", progress: 58, milestones: "2/4", currency: "wMXN", status: "active" },
  { id: 2, title: "API Integration", client: "TechFlow Inc", total: "$3,500", paid: "$0", progress: 15, milestones: "0/3", currency: "USDC", status: "active" },
  { id: 3, title: "Mobile App UI", client: "StartupXYZ", total: "$2,800", paid: "$1,400", progress: 50, milestones: "2/4", currency: "wBRL", status: "active" },
  { id: 4, title: "Brand Guidelines", client: "Luxe Studio", total: "$800", paid: "$800", progress: 100, milestones: "2/2", currency: "wBRL", status: "completed" },
];

export const pools: Pool[] = [
  { pair: "USDC / wMXN", tvl: "$1.2M", volume: "$340K", apy: "8.2%" },
  { pair: "USDC / wBRL", tvl: "$890K", volume: "$210K", apy: "11.5%" },
  { pair: "USDC / wINR", tvl: "$650K", volume: "$180K", apy: "9.8%" },
];

export const features: Feature[] = [
  { title: "World-Native Mini App", description: "Distributed inside World App to millions of verified users.", icon: "globe" },
  { title: "Verified Human Identity", description: "World ID proof-of-human gates premium FX rebates.", icon: "shield" },
  { title: "Uniswap v4 Rebate Hook", description: "Custom hook applies lower fees for verified workers.", icon: "swap" },
  { title: "Liquidity Vault", description: "LPs earn from bridging, swap, and hook allocations.", icon: "vault" },
  { title: "Local Stablecoin Payouts", description: "Choose wMXN, wBRL, wINR — settled on World Chain.", icon: "card" },
  { title: "Smart Incentive Tiers", description: "Fee credits, boosted rebates, priority limits.", icon: "star" },
];

export const settlementQuote: SettlementQuote = {
  payoutId: "WL-2048",
  amount: 2400,
  sourceCurrency: "USDC",
  selectedCurrency: currencies[0],
  fee: 1.84,
  rebate: 12,
  route: ["USDC", "Uniswap v4", "World Chain"],
  eta: "Under 30 seconds",
};

export const weeklyEarnings: ChartDataPoint[] = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 340 },
  { label: "Wed", value: 280 },
  { label: "Thu", value: 510 },
  { label: "Fri", value: 420 },
  { label: "Sat", value: 180 },
  { label: "Sun", value: 350 },
];

export const badges: Badge[] = [
  { label: "Early Settler", sub: "$100 Saved", emoji: "🏆", color: "#F0C24A" },
  { label: "FX Pro", sub: "10 Swaps", emoji: "⚡", color: "#00ADB5" },
  { label: "Verified", sub: "World ID", emoji: "🛡️", color: "#2ECC71" },
];

export const payoutMix: PayoutMixItem[] = [
  { label: "USDC", amount: "$2,400", color: "#00ADB5", percent: 45 },
  { label: "wMXN", amount: "$1,200", color: "#3B82F6", percent: 25 },
  { label: "wBRL", amount: "$800", color: "#F0C24A", percent: 15 },
  { label: "wINR", amount: "$780", color: "#E74C3C", percent: 15 },
];
