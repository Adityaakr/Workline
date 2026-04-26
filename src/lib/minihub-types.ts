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

// 3-bucket allocation that gets attached to a settlement when the
// worker applies an AI Smart Split. localUsdc is the only portion that
// actually flows through the FX swap; the rest stays as USDC narratively.
export type SplitBuckets = {
  localCurrency: string;
  localUsdc: number;
  stableUsdc: number;
  reserveUsdc: number;
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
  // USDC that was actually converted through the FX swap. Equals
  // sourceAmount when no Smart Split is applied; equals splitBuckets.localUsdc
  // when one is. Lets the success page show "$780 of $1,200 converted".
  convertedUsdc?: number;
  payoutId: string;
  payoutPurpose: string;
  payoutSender: string;
  verifiedHuman: boolean;
  userOpHash?: string;
  onchain?: boolean;
  explorerUrl?: string;
  receipt?: VerifiedIncomeReceipt;
  smartSplitApplied?: boolean;
  splitBuckets?: SplitBuckets;
  creditTeaser?: CreditLineTeaser;
};

// On-chain settlement is gated by a client approval that arrives via
// World Chat (powered by XMTP). The mock surfaces this so the UI can
// show "approved → settle" without waiting for live messaging.
export type WorldChatApproval = {
  payoutId: string;
  clientName: string;
  clientHandle: string;
  approvedAt: string;
  messagePreview: string;
  status: "approved" | "pending";
};

// Receipt minted client-side after a successful settlement. Acts as a
// portable, verifiable record of income tied to a verified human.
export type VerifiedIncomeReceipt = {
  receiptId: string;
  settlementId: string;
  payoutId: string;
  amountUSDC: number;
  receivedAmount: number;
  receivedCurrency: string;
  payerName: string;
  approvalSource: "world-chat";
  verifiedHuman: boolean;
  txHash: string;
  explorerUrl?: string;
  issuedAt: string;
  splitBuckets?: SplitBuckets;
};

// Teaser shown to users about what their settlement history unlocks
// next (credit / earnings advance / trust score). Demo-only.
export type CreditLineTeaser = {
  receiptCount: number;
  totalVerifiedIncome: number;
  estimatedLimit: number;
  trustScore: number;
  nextMilestoneReceipts: number;
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
