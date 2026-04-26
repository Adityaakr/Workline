import { NextRequest, NextResponse } from "next/server";
import {
  PLATFORM_SYSTEM_PROMPT,
  buildUserPrompt,
  normalizeAiOutput,
} from "@/lib/ai-prompt";
import type { AiSmartSplitRequest } from "@/lib/ai-types";

export const runtime = "nodejs";
// Always run on the server with the latest env, never statically cached.
export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Free-tier default. We start with gpt-oss-120b because it has the best
// track record on this account for both system-prompt support and JSON
// adherence under the OpenRouter free quota. Override via
// OPENROUTER_MODEL when you have paid credits.
const DEFAULT_MODEL = "openai/gpt-oss-120b:free";
// Free models we walk through if the primary is rate-limited or down.
// Ordered by observed reliability on this account. List sourced from
// OpenRouter /api/v1/models on Apr 2026 - update if a model 404s.
const FREE_FALLBACK_MODELS = [
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];
const PER_CALL_TIMEOUT_MS = 9_000;
const TOTAL_TIMEOUT_MS = 22_000;
const MAX_TOKENS = 220;

type ChatChoice = { message?: { content?: string } };
type ChatBody = { choices?: ChatChoice[] };

export async function POST(req: NextRequest) {
  let body: AiSmartSplitRequest;
  try {
    body = (await req.json()) as AiSmartSplitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body?.amountUSDC !== "number" ||
    !Number.isFinite(body.amountUSDC) ||
    body.amountUSDC <= 0 ||
    typeof body?.preferredCurrency !== "string"
  ) {
    return NextResponse.json(
      { error: "amountUSDC and preferredCurrency are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const primary = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const candidateModels = [
    primary,
    ...FREE_FALLBACK_MODELS.filter((m) => m !== primary),
  ];

  const totalDeadline = Date.now() + TOTAL_TIMEOUT_MS;
  const userPrompt = buildUserPrompt(body);
  const errors: string[] = [];

  for (const model of candidateModels) {
    if (Date.now() > totalDeadline) break;

    const remaining = Math.max(1_500, totalDeadline - Date.now());
    const callBudget = Math.min(PER_CALL_TIMEOUT_MS, remaining);

    const result = await callOpenRouter({
      apiKey,
      model,
      userPrompt,
      timeoutMs: callBudget,
    });

    if (result.ok) {
      const ai = normalizeAiOutput({
        raw: result.parsed,
        amountUSDC: body.amountUSDC,
        preferredCurrency: body.preferredCurrency,
        source: result.parsed ? "ai" : "fallback",
        model,
      });
      return NextResponse.json(ai);
    }

    errors.push(`${model}: ${result.error}`);
    if (!result.retryable) break;
  }

  return NextResponse.json(
    {
      error: "All AI providers failed",
      detail: errors.slice(0, 4).join(" | ").slice(0, 600),
    },
    { status: 502 },
  );
}

type CallResult =
  | { ok: true; parsed: unknown; rawContent: string }
  | { ok: false; error: string; retryable: boolean };

async function callOpenRouter(opts: {
  apiKey: string;
  model: string;
  userPrompt: string;
  timeoutMs: number;
}): Promise<CallResult> {
  const { apiKey, model, userPrompt, timeoutMs } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Adityaakr/Workline",
        "X-Title": "Workline FX",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PLATFORM_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Walk the free-model chain on any failure that is not a hard
      // auth/permission error. Per-model 400s show up when an upstream
      // provider rejects system messages, response_format, etc., so
      // they should fall through to the next model.
      const fatal = res.status === 401 || res.status === 403;
      return {
        ok: false,
        error: `${res.status} ${detail.slice(0, 200)}`,
        retryable: !fatal,
      };
    }

    const json = (await res.json()) as ChatBody;
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return { ok: false, error: "missing content", retryable: true };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
    }
    return { ok: true, parsed, rawContent: content };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      error: aborted ? "timeout" : "network",
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
