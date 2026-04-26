import type {
  Agreement,
  PayoutCurrency,
  PayoutQuote,
  WorklineFeature,
  WorklineStep,
} from "@/lib/types";

export const heroStats = [
  { label: "Earned", value: "$4,430" },
  { label: "Ready", value: "$2,400" },
  { label: "Rebate", value: "Active" },
];

export const summaryFeatures: WorklineFeature[] = [
  {
    title: "Verified Agreements",
    label: "Agreement",
    description:
      "Define scope, participants, payout currency, and milestone terms before work starts.",
  },
  {
    title: "Milestone Approval",
    label: "Approval",
    description:
      "Approved work becomes the trigger for payout routing, rebates, and settlement.",
  },
  {
    title: "Instant Payouts",
    label: "Payout",
    description:
      "Workers see the local stablecoin output before confirming the final payout route.",
  },
];

export const coreFeatures: WorklineFeature[] = [
  {
    title: "Local Stablecoin Settlement",
    label: "Stable",
    description:
      "Route approved work value into the currency users actually want to receive.",
  },
  {
    title: "Uniswap-Powered FX Routing",
    label: "FX",
    description:
      "Onchain liquidity powers conversion into local stablecoins without manual treasury operations.",
  },
  {
    title: "Verified-Human Rebate Hook",
    label: "Rebate",
    description:
      "World ID verification can unlock payout rebates for real, unique workers.",
  },
  {
    title: "World App Native UX",
    label: "World",
    description:
      "Wallet Auth, MiniKit commands, and World App distribution keep the flow familiar on mobile.",
  },
];

export const howItWorksSteps: WorklineStep[] = [
  {
    title: "Create the agreement",
    description:
      "Set worker, client, milestone, payout amount, and preferred local stablecoin.",
  },
  {
    title: "Approve the milestone",
    description:
      "The client approves completed work and unlocks the payout quote.",
  },
  {
    title: "Route the payout",
    description:
      "Workline FX previews liquidity, output, fees, and verified-human rebate.",
  },
  {
    title: "Settle instantly",
    description:
      "The worker confirms and receives local stablecoin settlement through World App.",
  },
];

export const payoutCurrencies: PayoutCurrency[] = [
  { code: "USDC", name: "USD Coin", symbol: "$", rate: 1 },
  { code: "EURC", name: "Euro Coin", symbol: "€", rate: 0.92 },
  { code: "BRLA", name: "Brazil Real Stable", symbol: "R$", rate: 5.12 },
  { code: "MXNB", name: "Mexican Peso Stable", symbol: "$", rate: 17.05 },
];

export const agreements: Agreement[] = [
  {
    id: "WLX-2048",
    title: "Market launch design system",
    client: "Northstar Labs",
    worker: "Maya Chen",
    status: "Approved",
    amountUsd: 2400,
    milestone: "Final mobile screens approved",
    dueLabel: "Ready for payout",
    progress: 100,
  },
  {
    id: "WLX-2051",
    title: "Sales ops automation sprint",
    client: "Atlas Works",
    worker: "Rafael Costa",
    status: "Review",
    amountUsd: 1250,
    milestone: "CRM workflow QA",
    dueLabel: "Client review",
    progress: 72,
  },
  {
    id: "WLX-2054",
    title: "Data room translation",
    client: "Meridian Fund",
    worker: "Sofia Alvarez",
    status: "In progress",
    amountUsd: 780,
    milestone: "Agreement setup",
    dueLabel: "In progress",
    progress: 34,
  },
];

export const payoutQuote: PayoutQuote = {
  agreementId: "WLX-2048",
  workerName: "Maya Chen",
  approvedAmountUsd: 2400,
  route: ["USDC", "World Chain liquidity", "EURC"],
  liquiditySource: "Uniswap-style onchain liquidity",
  selectedCurrency: payoutCurrencies[1],
  networkFeeUsd: 1.84,
  rebateUsd: 12,
  fxRate: 0.92,
  estimatedArrival: "Under 30 seconds",
};
