"use client";
import { walletAuth, WalletAuthError } from "@/auth/wallet";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Friendly copy for the most common MiniKit wallet-auth error codes.
 * `malformed_request` is what World App returns when the SIWE payload it
 * receives doesn't match what the Mini App registration expects — usually
 * a stale Mini App URL in the Developer Portal vs. the current ngrok host.
 */
const errorCopy = (
  code: string | undefined,
): { title: string; hint?: string } => {
  switch (code) {
    case "malformed_request":
      return {
        title: "World App rejected the sign-in (malformed_request).",
        hint: "Open Developer Portal → your Mini App → set the App URL to this exact ngrok host, save, and reopen the Mini App.",
      };
    case "user_rejected":
      return {
        title: "You cancelled the sign-in.",
        hint: "Tap Continue with Wallet to try again.",
      };
    case "generic_error":
      return {
        title: "Something went wrong with World App sign-in.",
        hint: "Check your connection and try again.",
      };
    default:
      return { title: "Failed to login. Tap Continue with Wallet to retry." };
  }
};

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [errorDetails, setErrorDetails] = useState<string | undefined>();
  const { isInstalled } = useMiniKit();
  const hasAttemptedAuth = useRef(false);

  const runAuth = useCallback(async () => {
    setErrorCode(undefined);
    setErrorDetails(undefined);
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error("Wallet authentication error", error);
      if (error instanceof WalletAuthError) {
        setErrorCode(error.code ?? "generic_error");
        setErrorDetails(error.details ?? error.message);
      } else if (error instanceof Error) {
        setErrorCode("generic_error");
        setErrorDetails(error.message);
      } else {
        setErrorCode("generic_error");
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  const onClick = useCallback(() => {
    if (!isInstalled || isPending) {
      return;
    }
    void runAuth();
  }, [isInstalled, isPending, runAuth]);

  // Auto-authenticate once when MiniKit is ready. We reuse the same code
  // path (incl. error capture) so the UI state stays consistent whether the
  // attempt was kicked off automatically or by tap.
  useEffect(() => {
    if (isInstalled === true && !hasAttemptedAuth.current) {
      hasAttemptedAuth.current = true;
      void runAuth();
    }
  }, [isInstalled, runAuth]);

  const copy = errorCode ? errorCopy(errorCode) : null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <LiveFeedback
        label={{
          failed: "Failed to login",
          pending: "Logging in",
          success: "Logged in",
        }}
        state={isPending ? "pending" : undefined}
      >
        <Button
          onClick={onClick}
          disabled={isPending}
          size="lg"
          variant="primary"
        >
          Continue with Wallet
        </Button>
      </LiveFeedback>

      {copy ? (
        <div className="w-full max-w-sm rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-left text-xs text-rose-100">
          <p className="font-semibold">{copy.title}</p>
          {copy.hint ? (
            <p className="mt-1 text-rose-200/90">{copy.hint}</p>
          ) : null}
          {errorDetails ? (
            <p className="mt-2 break-words font-mono text-[10px] text-rose-200/70">
              {errorDetails}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
