import { describe, it, expect } from "vitest";
import { getRateCard, computeCost, RATE_CARDS } from "../src/index.js";

describe("@qodewk/pricing", () => {
  describe("getRateCard", () => {
    it("returns default rate card when modelId is undefined or empty", () => {
      expect(getRateCard()).toEqual(RATE_CARDS["default"]);
      expect(getRateCard("")).toEqual(RATE_CARDS["default"]);
    });

    it("returns exact model rate card for known keys", () => {
      expect(getRateCard("gpt-4o")).toEqual(RATE_CARDS["gpt-4o"]);
      expect(getRateCard("claude-3-7-sonnet")).toEqual(RATE_CARDS["claude-3-7-sonnet"]);
      expect(getRateCard("deepseek-r1")).toEqual(RATE_CARDS["deepseek-r1"]);
    });

    it("fuzzy matches Claude model strings", () => {
      expect(getRateCard("anthropic/claude-4-opus-latest")).toEqual(RATE_CARDS["claude-opus-4-6-thinking"]);
      expect(getRateCard("claude-sonnet-4-6-thinking-v1")).toEqual(RATE_CARDS["claude-sonnet-4-6-thinking"]);
      expect(getRateCard("claude-3-7-sonnet-20250219")).toEqual(RATE_CARDS["claude-3-7-sonnet"]);
      expect(getRateCard("claude-3-5-sonnet-20241022")).toEqual(RATE_CARDS["claude-3-5-sonnet"]);
    });

    it("fuzzy matches Gemini model strings", () => {
      expect(getRateCard("google/gemini-2.0-flash-exp")).toEqual(RATE_CARDS["gemini-3-8-flash"]);
      expect(getRateCard("gemini-1.5-pro-latest")).toEqual(RATE_CARDS["gemini-2-5-pro"]);
    });

    it("falls back to default rate card for unrecognized model strings", () => {
      expect(getRateCard("unknown-custom-model-x")).toEqual(RATE_CARDS["default"]);
    });
  });

  describe("computeCost", () => {
    it("computes exact cost for standard token amounts without caching", () => {
      const card = RATE_CARDS["claude-3-7-sonnet"]!;
      // 1,000,000 input @ $3.0/M + 1,000,000 output @ $15.0/M = $18.00
      const cost = computeCost(1_000_000, 1_000_000, 0, card);
      expect(cost).toBe(18.0);
    });

    it("applies cache read pricing discount correctly", () => {
      const card = RATE_CARDS["claude-3-7-sonnet"]!;
      // Total input 1,000,000; cached 800,000 (cacheRead @ $0.30/M), fresh input 200,000 (input @ $3.0/M)
      // Fresh cost: 0.2 * 3.0 = 0.60
      // Cache cost: 0.8 * 0.3 = 0.24
      // Total cost: 0.84
      const cost = computeCost(1_000_000, 0, 800_000, card);
      expect(cost).toBe(0.84);
    });

    it("handles zero input, output, and cached tokens", () => {
      const card = RATE_CARDS["default"]!;
      const cost = computeCost(0, 0, 0, card);
      expect(cost).toBe(0);
    });

    it("clamps fresh input when cached exceeds input tokens", () => {
      const card = RATE_CARDS["claude-3-7-sonnet"]!;
      // Input = 100,000, Cached = 150,000 -> fresh input clamped to 0
      // Cache cost: 0.15 * 0.3 = 0.045
      const cost = computeCost(100_000, 0, 150_000, card);
      expect(cost).toBe(0.045);
    });

    it("rounds cost result to 4 decimal places", () => {
      const card = RATE_CARDS["deepseek-v3"]!;
      // 12,345 input tokens, 6,789 output tokens, 1,234 cached tokens
      const cost = computeCost(12_345, 6_789, 1_234, card);
      expect(typeof cost).toBe("number");
      const decs = cost.toString().split(".")[1] || "";
      expect(decs.length).toBeLessThanOrEqual(4);
    });

    it("applies cache write cost when cache write tokens are provided", () => {
      const card = RATE_CARDS["claude-sonnet-4"]!;
      // 500k fresh * $3.0/M = $1.50
      // 500k cache read * $0.30/M = $0.15
      // 200k cache write * $3.75/M = $0.75
      // Total = $2.40
      const cost = computeCost(1_000_000, 0, 500_000, card, 200_000);
      expect(cost).toBe(2.4);
    });

    it("supports newly added models (gpt-4o-mini, o1, claude-sonnet-4)", () => {
      expect(getRateCard("gpt-4o-mini").id).toBe("gpt-4o-mini");
      expect(getRateCard("o1").id).toBe("o1");
      expect(getRateCard("claude-sonnet-4").id).toBe("claude-sonnet-4");
    });
  });
});
