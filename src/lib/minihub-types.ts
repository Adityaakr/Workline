export type MinihubTab = "home" | "work" | "settle" | "fx" | "account";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  fee: string;
  rebate: string | null;
};

export type Payout = {
  id: string;
  direction: "incoming" | "outgoing";
  sender: string;
  recipient: string;
  purpose: string;
  amount: number;
  sourceCurrency: string;
  status: "ready" | "sent" | "settled" | "pending";
  timestamp: string;
};

export type SettlementQuote = {
  payoutId: string;
  amount: number;
  sourceCurrency: string;
  selectedCurrency: Currency;
  fee: number;
  rebate: number;
  route: string[];
  eta: string;
};

export type Stat = {
  label: string;
  value: string;
  detail: string;
};

export type Agreement = {
  id: number;
  title: string;
  client: string;
  total: string;
  paid: string;
  progress: number;
  milestones: string;
  currency: string;
  status: "active" | "completed";
};

export type Pool = {
  pair: string;
  tvl: string;
  volume: string;
  apy: string;
};

export type Feature = {
  title: string;
  description: string;
  icon: "globe" | "shield" | "swap" | "vault" | "card" | "star";
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type Badge = {
  label: string;
  sub: string;
  emoji: string;
  color: string;
};

export type PayoutMixItem = {
  label: string;
  amount: string;
  color: string;
  percent: number;
};

export type SettleRequest = {
  payoutId: string;
  amountUSDC: number;
  selectedCurrency: string;
  userAddress?: string;
  verifiedHuman: boolean;
};

export type SettleResponse = {
  settlementId: string;
  status: "completed";
  txHash: string;
  route: string;
  receivedAmount: number;
  rebateAmount: number;
  selectedCurrency: string;
  timestamp: string;
  fee: number;
  sourceAmount: number;
  payoutId: string;
  payoutPurpose: string;
  payoutSender: string;
  verifiedHuman: boolean;
  userOpHash?: string;
  onchain?: boolean;
  explorerUrl?: string;
};

export type PendingSettlement = {
  payoutId: string;
  sourceAmount: number;
  selectedCurrency: string;
  payoutPurpose: string;
  payoutSender: string;
  verifiedHuman: boolean;
  timestamp: string;
};
