"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import {
  Tokens,
  tokenToDecimals,
  type MiniKitPayOptions,
} from "@worldcoin/minikit-js/commands";

export type PreparedPayout = {
  reference: string;
  amountUsd: number;
  recipientAddress: `0x${string}`;
  description: string;
};

export async function preparePayoutReference() {
  const response = await fetch("/api/initiate-payment", { method: "POST" });

  if (!response.ok) {
    throw new Error("Unable to prepare payout reference");
  }

  return (await response.json()) as { id: string };
}

export async function requestDemoPayment(input: PreparedPayout) {
  const payOptions: MiniKitPayOptions = {
    reference: input.reference,
    to: input.recipientAddress,
    tokens: [
      {
        symbol: Tokens.USDC,
        token_amount: tokenToDecimals(input.amountUsd, Tokens.USDC).toString(),
      },
    ],
    description: input.description,
  };

  const result = await MiniKit.pay(payOptions);

  // TODO: Always confirm result.data.transactionId on the backend before
  // marking a real payout as complete.
  return result;
}

export async function sendAllowlistedPayoutTransaction() {
  // TODO(Workline FX): Replace with allowlisted contract address and encoded calldata after
  // the Developer Portal contract and token permissions are configured.
  throw new Error("Payout transaction contract is not configured yet");
}
