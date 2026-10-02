export interface ModelRateCard {
  id: string;
  provider: "anthropic" | "openai" | "google" | "deepseek" | "generic";
  name: string;
  inputPerMTok: number; // in USD per million tokens
  outputPerMTok: number;
  cacheReadPerMTok: number;
  cacheWritePerMTok: number;
  contextWindow: number;
}

export const RATE_CARDS: Record<string, ModelRateCard> = {
  // Anthropic
  "claude-opus-4": {
    id: "claude-opus-4",
    provider: "anthropic",
    name: "Claude Opus 4",
    inputPerMTok: 4.0,
    outputPerMTok: 20.0,
    cacheReadPerMTok: 0.2,
    cacheWritePerMTok: 5.0,
    contextWindow: 200_000
  },
  "claude-opus-4-6-thinking": {
    id: "claude-opus-4-6-thinking",
    provider: "anthropic",
    name: "Claude Opus 4.6 Thinking",
    inputPerMTok: 5.0,
    outputPerMTok: 25.0,
    cacheReadPerMTok: 0.25,
    cacheWritePerMTok: 6.25,
    contextWindow: 200_000
  },
  "claude-sonnet-4-6-thinking": {
    id: "claude-sonnet-4-6-thinking",
    provider: "anthropic",
    name: "Claude Sonnet 4.6 Thinking",
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 3.75,
    contextWindow: 200_000
  },
  "claude-sonnet-4": {
    id: "claude-sonnet-4",
    provider: "anthropic",
    name: "Claude Sonnet 4",
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 3.75,
    contextWindow: 200_000
  },
  "claude-3-7-sonnet": {
    id: "claude-3-7-sonnet",
    provider: "anthropic",
    name: "Claude 3.7 Sonnet",
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 3.75,
    contextWindow: 200_000
  },
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    provider: "anthropic",
    name: "Claude 3.5 Sonnet",
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 3.75,
    contextWindow: 200_000
  },
  "claude-3-5-haiku": {
    id: "claude-3-5-haiku",
    provider: "anthropic",
    name: "Claude 3.5 Haiku",
    inputPerMTok: 0.8,
    outputPerMTok: 4.0,
    cacheReadPerMTok: 0.08,
    cacheWritePerMTok: 1.0,
    contextWindow: 200_000
  },

  // OpenAI
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    inputPerMTok: 2.5,
    outputPerMTok: 10.0,
    cacheReadPerMTok: 1.25,
    cacheWritePerMTok: 2.5,
    contextWindow: 128_000
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    inputPerMTok: 0.15,
    outputPerMTok: 0.6,
    cacheReadPerMTok: 0.075,
    cacheWritePerMTok: 0.15,
    contextWindow: 128_000
  },
  "o1": {
    id: "o1",
    provider: "openai",
    name: "o1",
    inputPerMTok: 15.0,
    outputPerMTok: 60.0,
    cacheReadPerMTok: 7.5,
    cacheWritePerMTok: 15.0,
    contextWindow: 200_000
  },
  "o3-mini": {
    id: "o3-mini",
    provider: "openai",
    name: "o3-mini",
    inputPerMTok: 1.1,
    outputPerMTok: 4.4,
    cacheReadPerMTok: 0.55,
    cacheWritePerMTok: 1.1,
    contextWindow: 200_000
  },

  // Google
  "gemini-3-8-flash": {
    id: "gemini-3-8-flash",
    provider: "google",
    name: "Gemini 3.8 Flash",
    inputPerMTok: 0.1,
    outputPerMTok: 0.4,
    cacheReadPerMTok: 0.025,
    cacheWritePerMTok: 0.1,
    contextWindow: 1_000_000
  },
  "gemini-2-5-pro": {
    id: "gemini-2-5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    inputPerMTok: 1.25,
    outputPerMTok: 5.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 1.25,
    contextWindow: 2_000_000
  },
  "gemini-2-0-flash": {
    id: "gemini-2-0-flash",
    provider: "google",
    name: "Gemini 2.0 Flash",
    inputPerMTok: 0.1,
    outputPerMTok: 0.4,
    cacheReadPerMTok: 0.025,
    cacheWritePerMTok: 0.1,
    contextWindow: 1_000_000
  },
  "gemini-1-5-pro": {
    id: "gemini-1-5-pro",
    provider: "google",
    name: "Gemini 1.5 Pro",
    inputPerMTok: 1.25,
    outputPerMTok: 5.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 1.25,
    contextWindow: 2_000_000
  },

  // DeepSeek
  "deepseek-v3": {
    id: "deepseek-v3",
    provider: "deepseek",
    name: "DeepSeek V3",
    inputPerMTok: 0.14,
    outputPerMTok: 0.28,
    cacheReadPerMTok: 0.014,
    cacheWritePerMTok: 0.14,
    contextWindow: 64_000
  },
  "deepseek-r1": {
    id: "deepseek-r1",
    provider: "deepseek",
    name: "DeepSeek R1",
    inputPerMTok: 0.55,
    outputPerMTok: 2.19,
    cacheReadPerMTok: 0.14,
    cacheWritePerMTok: 0.55,
    contextWindow: 64_000
  },

  // Default Fallback
  "default": {
    id: "default",
    provider: "generic",
    name: "Standard Frontier Model",
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheReadPerMTok: 0.3,
    cacheWritePerMTok: 3.75,
    contextWindow: 128_000
  }
};

export function getRateCard(modelId?: string): ModelRateCard {
  if (!modelId) return RATE_CARDS["default"]!;
  const key = modelId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (RATE_CARDS[key]) return RATE_CARDS[key]!;

  if (key.includes("opus")) {
    return RATE_CARDS["claude-opus-4-6-thinking"] ?? RATE_CARDS["claude-opus-4"]!;
  }
  if (key.includes("sonnet")) {
    if (key.includes("4-6") || key.includes("thinking")) {
      return RATE_CARDS["claude-sonnet-4-6-thinking"]!;
    }
    if (key.includes("3-7") || key.includes("sonnet-3-7")) {
      return RATE_CARDS["claude-3-7-sonnet"]!;
    }
    if (key.includes("3-5") || key.includes("sonnet-3-5")) {
      return RATE_CARDS["claude-3-5-sonnet"]!;
    }
    if (key.includes("sonnet-4") || key.includes("claude-4") || key.includes("sonnet-v4")) {
      return RATE_CARDS["claude-sonnet-4"] ?? RATE_CARDS["claude-sonnet-4-6-thinking"]!;
    }
  }
  if (key.includes("o1-mini") || key.includes("o3-mini")) {
    return RATE_CARDS["o3-mini"]!;
  }
  if (key.includes("o1")) {
    return RATE_CARDS["o1"]!;
  }
  if (key.includes("4o-mini")) {
    return RATE_CARDS["gpt-4o-mini"]!;
  }
  if (key.includes("4o")) {
    return RATE_CARDS["gpt-4o"]!;
  }
  if (key.includes("gemini") && key.includes("flash")) {
    return RATE_CARDS["gemini-3-8-flash"] ?? RATE_CARDS["gemini-2-0-flash"]!;
  }
  if (key.includes("gemini") && (key.includes("pro") || key.includes("2-5"))) {
    return RATE_CARDS["gemini-2-5-pro"] ?? RATE_CARDS["gemini-1-5-pro"]!;
  }

  return RATE_CARDS["default"]!;
}

export function computeCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  card: ModelRateCard,
  cacheWriteTokens: number = 0
): number {
  const freshInput = Math.max(0, inputTokens - cachedTokens);
  const freshCost = (freshInput / 1_000_000) * card.inputPerMTok;
  const cacheReadCost = (cachedTokens / 1_000_000) * card.cacheReadPerMTok;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * card.cacheWritePerMTok;
  const outCost = (outputTokens / 1_000_000) * card.outputPerMTok;
  return Number((freshCost + cacheReadCost + cacheWriteCost + outCost).toFixed(4));
}
