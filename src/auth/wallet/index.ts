import { MiniKit } from "@worldcoin/minikit-js";
import { signIn } from "next-auth/react";
import { getNewNonces } from "./server-helpers";

/**
 * Carries the MiniKit `error_code` (e.g. `malformed_request`) through to
 * the UI so we can render an actionable hint instead of a silent failure.
 */
export class WalletAuthError extends Error {
  code?: string;
  details?: string;
  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = "WalletAuthError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Authenticates a user via their wallet using a nonce-based challenge-response mechanism.
 *
 * Why the payload is so minimal:
 *   - `notBefore` set to a past time is semantically odd and World App's
 *     newer SIWE validator can reject it as `malformed_request`.
 *   - 7-day `expirationTime` is way more than a sign-in flow needs and
 *     World App enforces stricter freshness on some app modes; 1 hour
 *     is plenty for the user to tap "Sign".
 *   - `statement` is a plain ASCII line. SIWE forbids newlines and is
 *     finicky about quoting; `crypto.randomUUID()` was redundant since
 *     `nonce` already gives us replay protection.
 */
export const walletAuth = async () => {
  if (!MiniKit.isInstalled()) {
    throw new WalletAuthError(
      "Wallet Auth requires World App. Open this Mini App inside World App to sign in.",
    );
  }

  const { nonce, signedNonce } = await getNewNonces();

  let result;
  try {
    result = await MiniKit.walletAuth({
      nonce,
      expirationTime: new Date(Date.now() + 60 * 60 * 1000),
      statement: "Sign in to Workline FX.",
    });
  } catch (err) {
    // MiniKit throws WalletAuthError-shaped objects on failure. Re-wrap so
    // the UI can switch on `code` (especially `malformed_request`).
    const code =
      err && typeof err === "object" && "code" in err
        ? ((err as { code?: string }).code ?? undefined)
        : undefined;
    const details =
      err && typeof err === "object" && "details" in err
        ? ((err as { details?: string }).details ?? undefined)
        : undefined;
    const message =
      err instanceof Error ? err.message : "Wallet auth failed";
    throw new WalletAuthError(message, code, details);
  }

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
