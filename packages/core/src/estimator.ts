import { getRateCard, computeCost } from "@qodewk/pricing";
import type { AttributionMode, ProviderSession } from "@qodewk/protocol";

export interface EstimateOptions {
  files: number;
  insertions: number;
  deletions: number;
  provider?: string;
  model?: string;
  sessions?: ProviderSession[];
  mode?: AttributionMode;
  confidence?: number;
}

export interface CostEstimateResult {
  provider: string;
  model: string;
  tokens: {
    input: number;
    output: number;
    cached: number;
  };
  cost: number;
  mode: AttributionMode;
  confidence: number;
  sessions?: ProviderSession[];
}

export function estimateCost(options: EstimateOptions): CostEstimateResult {
  // Tier 1 / 2: Deterministic sessions available
  if (options.sessions && options.sessions.length > 0) {
    const primary = options.sessions[0]!;
    let totalInput = 0;
    let totalOutput = 0;
    let totalCached = 0;
    let totalCost = 0;

    for (const s of options.sessions) {
      totalInput += s.tokens.input;
      totalOutput += s.tokens.output;
      totalCached += s.tokens.cached;
      totalCost += s.cost;
    }

    return {
      provider: options.provider || primary.provider,
      model: options.model || primary.model || "claude-3-7-sonnet",
      tokens: {
        input: totalInput,
        output: totalOutput,
        cached: totalCached
      },
      cost: Number(totalCost.toFixed(4)),
      mode: options.mode || primary.mode,
      confidence: options.confidence !== undefined ? options.confidence : primary.confidence,
      sessions: options.sessions
    };
  }

  // Tier 3: Heuristic Fallback
  const provider = options.provider || "generic";
  const model = options.model || (provider === "antigravity" ? "claude-sonnet-4-6-thinking" : provider === "anthropic" ? "claude-3-7-sonnet" : "standard-frontier");
  const rateCard = getRateCard(model);

  // Approximate changed characters (averaging 35 chars per line)
  const approxChars = (options.insertions + options.deletions) * 35;
  const baseCodeTokens = Math.max(Math.round(approxChars / 4), 50);

  // Context Multiplier Tiers based on scope:
  // 1–2 files: 15x
  // 3–9 files: 35x
  // 10+ files: 60x
  let multiplier = 15;
  if (options.files >= 10) {
    multiplier = 60;
  } else if (options.files >= 3) {
    multiplier = 35;
  }

  // Capped at 200,000 tokens
  const maxContextCap = rateCard.contextWindow || 200_000;
  const estimatedInputTokens = Math.min(baseCodeTokens * multiplier, maxContextCap);
  const estimatedOutputTokens = Math.max(Math.round((options.insertions * 35) / 4), 50);

  // 60% cache read ratio, 40% fresh input
  const cachedTokens = Math.round(estimatedInputTokens * 0.6);
  const cost = computeCost(estimatedInputTokens, estimatedOutputTokens, cachedTokens, rateCard);

  const confidence = options.confidence !== undefined
    ? options.confidence
    : (options.provider ? 0.65 : 0.45);

  const mode = options.mode || (options.provider ? "estimated" : "unknown");

  return {
    provider,
    model,
    tokens: {
      input: estimatedInputTokens,
      output: estimatedOutputTokens,
      cached: cachedTokens
    },
    cost,
    mode,
    confidence,
    sessions: [
      {
        provider,
        model,
        tokens: {
          input: estimatedInputTokens,
          output: estimatedOutputTokens,
          cached: cachedTokens
        },
        cost,
        confidence,
        mode
      }
    ]
  };
}
