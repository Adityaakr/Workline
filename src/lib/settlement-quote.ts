import type { Currency, SettleRequest } from "./minihub-types";

const FEE_RATE = 0.0015;
const REBATE_RATE = 0.0008;

export function computeSettlementQuote(input: {
  amountUSDC: number;
  currency: Currency;
  verifiedHuman: boolean;
}) {
  const { amountUSDC, currency, verifiedHuman } = input;
  const isSwap = currency.code !== "USDC";
  const receivedAmount = isSwap ? amountUSDC * currency.rate : amountUSDC;
  const fee = isSwap ? amountUSDC * FEE_RATE : 0;
  const rebateAmount = isSwap && verifiedHuman ? amountUSDC * REBATE_RATE : 0;

  return {
    receivedAmount,
    fee,
    rebateAmount,
    route: "Uniswap v4 → World Chain",
  };
}

export function buildSettleRequest(input: {
  payoutId: string;
  amountUSDC: number;
  selectedCurrency: string;
  userAddress?: string;
  verifiedHuman: boolean;
}): SettleRequest {
  return {
    payoutId: input.payoutId,
    amountUSDC: input.amountUSDC,
    selectedCurrency: input.selectedCurrency,
    userAddress: input.userAddress,
    verifiedHuman: input.verifiedHuman,
  };
}

export function formatReceived(amount: number, code: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
}
