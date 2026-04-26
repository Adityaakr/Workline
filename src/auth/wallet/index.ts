import { MiniKit } from "@worldcoin/minikit-js";
import { signIn } from "next-auth/react";
import { getNewNonces } from "./server-helpers";

/**
 * Authenticates a user via their wallet using a nonce-based challenge-response mechanism.
 *
 * This function generates a unique `nonce` and requests the user to sign it with their wallet,
 * producing a `signedNonce`. The `signedNonce` ensures the response we receive from wallet auth
 * is authentic and matches our session creation.
 *
 * @returns {Promise<SignInResponse>} The result of the sign-in attempt.
 * @throws {Error} If wallet authentication fails at any step.
 */
export const walletAuth = async () => {
  if (!MiniKit.isInstalled()) {
    throw new Error("Wallet Auth requires World App. Open this Mini App inside World App to sign in.");
  }

  const { nonce, signedNonce } = await getNewNonces();

  const result = await MiniKit.walletAuth({
    nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: `Sign in to Workline FX (${crypto.randomUUID().replace(/-/g, "")}).`,
  });

  if (result.data.address && typeof window !== "undefined") {
    localStorage.setItem("wl_wallet_address", result.data.address);
  }

  await signIn("credentials", {
    redirectTo: "/",
    nonce,
    signedNonce,
    finalPayloadJson: JSON.stringify({
      status: "success",
      address: result.data.address,
      message: result.data.message,
      signature: result.data.signature,
    }),
  });
};
