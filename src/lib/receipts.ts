import type {
  CreditLineTeaser,
  Payout,
  SettleResponse,
  SplitBuckets,
  VerifiedIncomeReceipt,
} from "./minihub-types";

const TIER_RECEIPTS = 5;

export function buildVerifiedIncomeReceipt(opts: {
  settlementId: string;
  payout: Payout;
  receivedAmount: number;
  receivedCurrency: string;
  txHash: string;
  explorerUrl?: string;
  verifiedHuman: boolean;
  splitBuckets?: SplitBuckets;
}): VerifiedIncomeReceipt {
  const {
    settlementId,
    payout,
    receivedAmount,
    receivedCurrency,
    txHash,
    explorerUrl,
    verifiedHuman,
    splitBuckets,
  } = opts;
  return {
    receiptId: `RCT-${settlementId.replace(/^STL-/, "")}`,
    settlementId,
    payoutId: payout.id,
    amountUSDC: payout.amount,
    receivedAmount,
    receivedCurrency,
    payerName: payout.sender,
    approvalSource: "world-chat",
    verifiedHuman,
    txHash,
    explorerUrl,
    issuedAt: new Date().toISOString(),
    splitBuckets,
  };
}

export function buildCreditLineTeaser(history: SettleResponse[]): CreditLineTeaser {
  const receiptCount = history.length;
  const totalVerifiedIncome = history.reduce((sum, s) => sum + s.sourceAmount, 0);
  const verifiedBoost = history.filter((s) => s.verifiedHuman).length * 30;
  const trustScore = Math.min(820, 580 + receiptCount * 18 + verifiedBoost);
  const estimatedLimit = Math.round(totalVerifiedIncome * 0.4);
  const tier = Math.floor(receiptCount / TIER_RECEIPTS) + 1;

  return {
    receiptCount,
    totalVerifiedIncome,
    estimatedLimit,
    trustScore,
    nextMilestoneReceipts: tier * TIER_RECEIPTS,
  };
}
