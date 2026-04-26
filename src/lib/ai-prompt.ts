import {
  SUPPORTED_LOCAL_CURRENCIES,
  isSupportedCurrency,
  type AiSmartSplitRequest,
  type AiSmartSplitResult,
  type AiSupportedCurrency,
} from "./ai-types";

// System prompt loaded with Workline FX platform context. The model is
// asked to "read the platform" by giving it the full operating model
// up front so its allocations reflect the actual product.
export const PLATFORM_SYSTEM_PROMPT = `You are Workline AI, the allocation engine inside Workline FX, a payout Mini App that runs inside World App on World Chain.

Workline FX in one paragraph:
Clients approve work in World Chat (powered by XMTP). Approval triggers a USDC payout on World Chain. The worker — typically a global freelancer or contractor — verifies as a human via World ID and chooses how to settle: keep USDC, swap into a local stablecoin (wMXN, wBRL, wINR), or split. Verified humans get a rebate on FX conversions via a Uniswap v4 hook. Each settlement also issues a Verified Income Receipt that builds a portable trust profile used to estimate a future credit line.

Your job:
Given an incoming USDC payout and recent settlement history, recommend a 3-way allocation:
  1. LOCAL spend bucket   - converted into the worker's preferred local stablecoin (wMXN/wBRL/wINR) for everyday spending
  2. STABLE savings       - kept in USDC for stability and dollar-denominated savings
  3. RESERVE              - small USDC emergency buffer (a habit, not a separate token)

Hard rules:
- Percentages MUST be integers and MUST sum to exactly 100.
- localCurrency MUST be one of: ${SUPPORTED_LOCAL_CURRENCIES.join(", ")}.
- If preferredCurrency is "USDC", set localPct = 0; split between stable and reserve only.
- Reserve is between 5 and 25 percent. If amount is small (< 200 USDC), prefer 10 to 20 percent reserve.
- Verified humans can lean 5 to 10 percentage points more LOCAL than unverified workers, because they unlock the FX rebate.
- If recent history is dominated by local conversions, bias LOCAL higher (up to ~75%).
- If recent history is dominated by USDC, bias STABLE higher.
- Never recommend more than 80% LOCAL or more than 90% STABLE, except when preferredCurrency is USDC.

Tone:
- "reason" is ONE plain-English sentence. No jargon. No emojis. No exclamation marks.
- "tip" is ONE short actionable line under 80 characters. No emojis.
- Address the worker as "you".

Respond with JSON ONLY, matching this exact schema:
{
  "localPct":     integer 0..100,
  "stablePct":    integer 0..100,
  "reservePct":   integer 0..100,
  "localCurrency":"wMXN" | "wBRL" | "wINR" | "USDC",
  "reason":       string,
  "tip":          string
}`;

export function buildUserPrompt(req: AiSmartSplitRequest): string {
  const recent = (req.recentSettlements ?? []).slice(0, 5).map((s) => ({
    amountUSDC: s.amountUSDC,
    selectedCurrency: s.selectedCurrency,
    verifiedHuman: s.verifiedHuman,
  }));

  return JSON.stringify(
    {
      payout: {
        amountUSDC: req.amountUSDC,
        payerName: req.payerName ?? null,
        purpose: req.payoutPurpose ?? null,
      },
      worker: {
        preferredCurrency: req.preferredCurrency,
        verifiedHuman: req.verifiedHuman,
      },
      recentSettlements: recent,
    },
    null,
    2,
  );
}

// Defensive normaliser. Coerces whatever the model returned into a
// guaranteed-valid AiSmartSplitResult so a hallucinated response can
// never break the UI.
export function normalizeAiOutput(opts: {
  raw: unknown;
  amountUSDC: number;
  preferredCurrency: string;
  source: AiSmartSplitResult["source"];
  model?: string;
}): AiSmartSplitResult {
  const { raw, amountUSDC, preferredCurrency, source, model } = opts;
  const safe = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const fallbackCurrency: AiSupportedCurrency = isSupportedCurrency(
    preferredCurrency,
  )
    ? preferredCurrency
    : "USDC";

  let local = clampInt(safe.localPct, 0, 100, 0);
  let stable = clampInt(safe.stablePct, 0, 100, 0);
  let reserve = clampInt(safe.reservePct, 0, 100, 0);

  let localCurrency: AiSupportedCurrency =
    typeof safe.localCurrency === "string" &&
    isSupportedCurrency(safe.localCurrency)
      ? safe.localCurrency
      : fallbackCurrency;

  if (preferredCurrency === "USDC") {
    local = 0;
    localCurrency = "USDC";
  }

  // Force the percentages to sum to 100 deterministically.
  const sum = local + stable + reserve;
  if (sum !== 100) {
    if (sum === 0) {
      local = preferredCurrency === "USDC" ? 0 : 65;
      stable = preferredCurrency === "USDC" ? 80 : 25;
      reserve = preferredCurrency === "USDC" ? 20 : 10;
    } else {
      const factor = 100 / sum;
      local = Math.round(local * factor);
      stable = Math.round(stable * factor);
      reserve = 100 - local - stable;
      if (reserve < 0) {
        stable = Math.max(0, stable + reserve);
        reserve = 0;
      }
    }
  }

  const localAmount = Math.round((amountUSDC * local) / 100);
  const reserveAmount = Math.round((amountUSDC * reserve) / 100);
  const stableAmount = Math.max(0, amountUSDC - localAmount - reserveAmount);

  return {
    source,
    model,
    localPct: local,
    stablePct: stable,
    reservePct: reserve,
    localCurrency,
    localAmount,
    stableAmount,
    reserveAmount,
    reason: safeString(safe.reason, "Recommended split for this payout."),
    tip: safeString(
      safe.tip,
      "Convert what you spend, keep the rest in stable.",
    ),
  };
}

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeString(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const trimmed = v.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}…` : trimmed;
}
