import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import {
  normalizeFilePath,
  scoreFootprint,
  selectPrimaryFootprint,
  computeAiWrittenRatio,
  sanitizeReceiptForShare
} from "../src/index.js";
import { ReceiptV1 } from "@qodewk/protocol";

describe("attribution legacy test suite", () => {
  describe("normalizeFilePath", () => {
    it("normalizes Windows backslashes and case", () => {
      expect(normalizeFilePath("src\\git.ts")).toBe("src/git.ts");
      expect(normalizeFilePath("SRC\\Git.TS")).toBe("src/git.ts");
    });

    it("strips repoPath prefix and leading dot-slash", () => {
      const repoPath = "/Users/dev/Qodewk";
      expect(normalizeFilePath("/Users/dev/Qodewk/packages/core/src/git.ts", repoPath)).toBe("packages/core/src/git.ts");
      expect(normalizeFilePath("./packages/core/src/git.ts", repoPath)).toBe("packages/core/src/git.ts");
    });
  });

  describe("scoreFootprint (P0 Commit-Bound Attribution)", () => {
    it("gives maximum +1.00 score to commit-bound footprint", () => {
      const fp = {
        id: "fp_1",
        platform: "cursor" as const,
        sessionId: "s_1",
        repoPath: "/app",
        taskTitle: "Test",
        model: "claude-3-7-sonnet",
        stepsCount: 1,
        filesEdited: ["src/index.ts"],
        timestamp: new Date().toISOString(),
        boundCommitSha: "a1b2c3d4e5f67890123456789012345678901234",
        tokens: { input: 100, output: 100, cached: 0 },
        cost: 0.01,
        mode: "verified" as const,
        confidence: 0.95
      };

      const gitCtx = {
        headSha: "a1b2c3d4e5f67890123456789012345678901234",
        commitDate: new Date().toISOString(),
        changedFiles: ["src/index.ts"]
      };

      const score = scoreFootprint(fp, gitCtx);
      expect(score).toBeGreaterThan(1.0);
    });

    it("penalizes footprint with zero file overlap", () => {
      const fp = {
        id: "fp_1",
        platform: "cursor" as const,
        sessionId: "s_1",
        repoPath: "/app",
        taskTitle: "Test",
        model: "claude-3-7-sonnet",
        stepsCount: 1,
        filesEdited: ["unrelated.ts"],
        timestamp: new Date().toISOString(),
        tokens: { input: 100, output: 100, cached: 0 },
        cost: 0.01,
        mode: "verified" as const,
        confidence: 0.95
      };

      const gitCtx = {
        headSha: "a1b2c3d4e5f67890123456789012345678901234",
        commitDate: new Date().toISOString(),
        changedFiles: ["src/index.ts"]
      };

      const score = scoreFootprint(fp, gitCtx);
      expect(score).toBeLessThan(0.35);
    });
  });

  describe("selectPrimaryFootprint (Disambiguation Engine)", () => {
    it("selects Cursor when Cursor matches commit even if Antigravity timestamp is newer", () => {
      const now = new Date();
      const cursorFp = {
        id: "fp_cursor",
        platform: "cursor" as const,
        sessionId: "s_cursor",
        repoPath: "/app",
        taskTitle: "Cursor task",
        model: "claude-3-7-sonnet",
        stepsCount: 1,
        filesEdited: ["src/index.ts"],
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        boundCommitSha: "a1b2c3d4e5f67890123456789012345678901234",
        tokens: { input: 100, output: 100, cached: 0 },
        cost: 0.01,
        mode: "verified" as const,
        confidence: 0.95
      };

      const antigravityFp = {
        id: "fp_ag",
        platform: "antigravity" as const,
        sessionId: "s_ag",
        repoPath: "/app",
        taskTitle: "Antigravity task",
        model: "claude-sonnet-4-6-thinking",
        stepsCount: 1,
        filesEdited: ["unrelated.ts"],
        timestamp: now.toISOString(),
        tokens: { input: 100, output: 100, cached: 0 },
        cost: 0.01,
        mode: "verified" as const,
        confidence: 0.95
      };

      const gitCtx = {
        headSha: "a1b2c3d4e5f67890123456789012345678901234",
        commitDate: now.toISOString(),
        changedFiles: ["src/index.ts"]
      };

      const { primary } = selectPrimaryFootprint([antigravityFp, cursorFp], gitCtx);
      expect(primary?.id).toBe("fp_cursor");
    });
  });

  describe("computeAiWrittenRatio", () => {
    it("returns undefined when either side is empty", () => {
      expect(computeAiWrittenRatio([], ["src/index.ts"])).toBeUndefined();
      expect(computeAiWrittenRatio(["src/index.ts"], [])).toBeUndefined();
    });

    it("computes overlap without inventing coverage", () => {
      expect(computeAiWrittenRatio(["src/a.ts", "src/b.ts"], ["src/a.ts"])).toBe(0.5);
    });

    it("matches path suffix forms", () => {
      expect(computeAiWrittenRatio(["packages/core/src/git.ts"], ["git.ts"])).toBe(1);
    });
  });

  describe("sanitizeReceiptForShare", () => {
    it("strips filesTouched and forces isPublic", () => {
      const receipt: ReceiptV1 = {
        version: "1.0",
        receipt: {
          id: "rec_123456789012345678901234",
          createdAt: "2025-01-01T00:00:00.000Z",
          contentHash: "a".repeat(64)
        },
        repository: {
          repoHash: "b".repeat(64),
          projectAlias: "test",
          branch: "main",
          headSha: "c".repeat(40),
          commitsCount: 1
        },
        mutation: {
          files: 1,
          insertions: 10,
          deletions: 0,
          netLines: 10,
          renames: 0
        },
        ai: {
          provider: "anthropic",
          tokens: { input: 100, output: 100, cached: 0 },
          cost: 0.01,
          mode: "verified",
          confidence: 0.95,
          sessions: [
            {
              provider: "anthropic",
              model: "claude-3-7-sonnet",
              filesTouched: ["src/secret.ts"],
              tokens: { input: 100, output: 100, cached: 0 },
              cost: 0.01,
              confidence: 0.95,
              mode: "verified"
            }
          ]
        },
        privacy: {
          sourceExcluded: true,
          isPublic: false,
          anonymizeBranch: false
        }
      };

      const sanitized = sanitizeReceiptForShare(receipt);
      expect(sanitized.privacy.isPublic).toBe(true);
      expect(sanitized.ai.sessions?.[0] && ("filesTouched" in sanitized.ai.sessions[0])).toBe(false);
    });
  });
});
