export type WorklineFeature = {
  title: string;
  description: string;
  label: string;
};

export type WorklineStep = {
  title: string;
  description: string;
};

export type Agreement = {
  id: string;
  title: string;
  client: string;
  worker: string;
  status: "In progress" | "Review" | "Approved" | "Paid";
  amountUsd: number;
  milestone: string;
  dueLabel: string;
  progress: number;
};

export type PayoutCurrency = {
  code: string;
  name: string;
  symbol: string;
  rate: number;
};

export type PayoutQuote = {
  agreementId: string;
  workerName: string;
  approvedAmountUsd: number;
  route: string[];
  liquiditySource: string;
  selectedCurrency: PayoutCurrency;
  networkFeeUsd: number;
  rebateUsd: number;
  fxRate: number;
  estimatedArrival: string;
};
