import { describe, it, expect } from "vitest";
import { ReceiptV1Schema, ProviderSessionSchema, AttributionModeSchema } from "../src/index.js";

describe("@qodewk/protocol", () => {
  describe("AttributionModeSchema", () => {
    it("accepts valid attribution modes", () => {
      const validModes = ["observed", "estimated", "imported", "verified", "unknown"];
      for (const mode of validModes) {
        expect(AttributionModeSchema.parse(mode)).toBe(mode);
      }
    });

    it("rejects invalid attribution modes", () => {
      expect(() => AttributionModeSchema.parse("invalid_mode")).toThrow();
    });
  });

  describe("ProviderSessionSchema", () => {
    it("validates a complete provider session", () => {
      const validSession = {
        provider: "anthropic",
        model: "claude-3-7-sonnet",
        task: "Refactor database engine",
        filesTouched: ["src/db.ts", "src/index.ts"],
        tokens: {
          input: 1000,
          output: 200,
          cached: 500
        },
        cost: 0.05,
        confidence: 0.95,
        mode: "verified"
      };

      const parsed = ProviderSessionSchema.parse(validSession);
      expect(parsed.provider).toBe("anthropic");
      expect(parsed.confidence).toBe(0.95);
    });

    it("defaults token values when omitted or defaults applied", () => {
      const minSession = {
        provider: "openai",
        tokens: {},
        cost: 0,
        confidence: 0.5,
        mode: "estimated"
      };

      const parsed = ProviderSessionSchema.parse(minSession);
      expect(parsed.tokens.input).toBe(0);
      expect(parsed.tokens.output).toBe(0);
      expect(parsed.tokens.cached).toBe(0);
    });

    it("rejects confidence outside 0-1 range", () => {
      const invalidConfidenceLow = {
        provider: "anthropic",
        tokens: { input: 0, output: 0, cached: 0 },
        cost: 0,
        confidence: -0.1,
        mode: "verified"
      };

      const invalidConfidenceHigh = {
        provider: "anthropic",
        tokens: { input: 0, output: 0, cached: 0 },
        cost: 0,
        confidence: 1.5,
        mode: "verified"
      };

      expect(() => ProviderSessionSchema.parse(invalidConfidenceLow)).toThrow();
      expect(() => ProviderSessionSchema.parse(invalidConfidenceHigh)).toThrow();
    });
  });

  describe("ReceiptV1Schema", () => {
    const validReceiptPayload = {
      version: "1.0",
      receipt: {
        id: "rec_123456789012345678901234",
        createdAt: "2025-01-01T00:00:00.000Z",
        contentHash: "a".repeat(64)
      },
      repository: {
        repoHash: "b".repeat(64),
        projectAlias: "test-project",
        branch: "main",
        headSha: "c".repeat(40),
        commitsCount: 1
      },
      mutation: {
        files: 5,
        insertions: 120,
        deletions: 30,
        netLines: 90,
        renames: 0,
        languages: { TypeScript: 100 }
      },
      ai: {
        provider: "anthropic",
        model: "claude-3-7-sonnet",
        tokens: {
          input: 10000,
          output: 2000,
          cached: 5000
        },
        cost: 0.15,
        mode: "verified",
        confidence: 0.95
      },
      privacy: {
        sourceExcluded: true,
        isPublic: true,
        anonymizeBranch: false
      }
    };

    it("successfully parses valid receipt payloads", () => {
      const parsed = ReceiptV1Schema.parse(validReceiptPayload);
      expect(parsed.version).toBe("1.0");
      expect(parsed.receipt.id).toBe("rec_123456789012345678901234");
    });

    it("enforces receipt ID prefix 'rec_'", () => {
      const invalidId = {
        ...validReceiptPayload,
        receipt: {
          ...validReceiptPayload.receipt,
          id: "invalid_id_format"
        }
      };
      expect(() => ReceiptV1Schema.parse(invalidId)).toThrow();
    });

    it("enforces 64-character SHA256 hashes", () => {
      const shortContentHash = {
        ...validReceiptPayload,
        receipt: {
          ...validReceiptPayload.receipt,
          contentHash: "short_hash"
        }
      };
      expect(() => ReceiptV1Schema.parse(shortContentHash)).toThrow();
    });

    it("enforces 40-character commit SHAs", () => {
      const shortHeadSha = {
        ...validReceiptPayload,
        repository: {
          ...validReceiptPayload.repository,
          headSha: "short_sha"
        }
      };
      expect(() => ReceiptV1Schema.parse(shortHeadSha)).toThrow();
    });

    it("enforces non-negative cost and token counts", () => {
      const negativeCost = {
        ...validReceiptPayload,
        ai: {
          ...validReceiptPayload.ai,
          cost: -1.5
        }
      };
      expect(() => ReceiptV1Schema.parse(negativeCost)).toThrow();
    });

    it("enforces privacy sourceExcluded literal true", () => {
      const falseSourceExcluded = {
        ...validReceiptPayload,
        privacy: {
          ...validReceiptPayload.privacy,
          sourceExcluded: false
        }
      };
      expect(() => ReceiptV1Schema.parse(falseSourceExcluded)).toThrow();
    });
  });
});
