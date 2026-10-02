import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { simpleGit } from "simple-git";
import {
  computeSaltedHash,
  computeAiWrittenRatio,
  extractGitMetrics,
  estimateCost,
  detectProviderFromCommit,
  formatMarkdownReceipt,
  LocalStateDB,
  scoreFootprint,
  selectPrimaryFootprint,
  harvestAntigravityFootprints,
  harvestClaudeFootprints,
  harvestCursorFootprints,
  AgentFootprint
} from "../src/index.js";
import { ReceiptV1 } from "@qodewk/protocol";

describe("@qodewk/core", () => {
  describe("Git Engine (`git.ts`)", () => {
    it("computeSaltedHash produces deterministic SHA-256 HMAC", () => {
      const hash1 = computeSaltedHash("https://github.com/org/repo.git", "salt1");
      const hash2 = computeSaltedHash("https://github.com/org/repo.git", "salt1");
      const hash3 = computeSaltedHash("https://github.com/org/repo.git", "salt2");

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    describe("computeAiWrittenRatio", () => {
      it("returns undefined when changedFiles or aiEditedFiles is empty", () => {
        expect(computeAiWrittenRatio([], ["src/index.ts"])).toBeUndefined();
        expect(computeAiWrittenRatio(["src/index.ts"], [])).toBeUndefined();
        expect(computeAiWrittenRatio([], [])).toBeUndefined();
      });

      it("calculates exact overlap ratio with normalized backslashes and case", () => {
        const changed = ["src/index.ts", "src/db.ts", "package.json", "README.md"];
        const aiEdited = ["SRC\\INDEX.TS", "./src/db.ts"];

        // 2 of 4 matched = 0.50
        const ratio = computeAiWrittenRatio(changed, aiEdited);
        expect(ratio).toBe(0.5);
      });

      it("matches partial path suffixes correctly", () => {
        const changed = ["packages/core/src/estimator.ts", "apps/web/app/page.tsx"];
        const aiEdited = ["estimator.ts"];

        const ratio = computeAiWrittenRatio(changed, aiEdited);
        expect(ratio).toBe(0.5);
      });
    });

    describe("extractGitMetrics", () => {
      let tempDir: string;

      beforeEach(async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "qodewk-test-repo-"));
        const git = simpleGit(tempDir);
        await git.init();
        await git.addConfig("user.name", "Test User");
        await git.addConfig("user.email", "test@example.com");

        fs.writeFileSync(path.join(tempDir, "file1.ts"), "console.log('hello');\n");
        await git.add("file1.ts");
        await git.commit("Initial commit (claude code)");
      });

      afterEach(() => {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
      });

      it("extracts git metrics from local git repository", async () => {
        const git = simpleGit(tempDir);
        fs.writeFileSync(path.join(tempDir, "file1.ts"), "console.log('hello world');\nconsole.log('line 2');\n");
        await git.add("file1.ts");
        await git.commit("Update file1 (antigravity)");

        const metrics = await extractGitMetrics({ repoPath: tempDir });

        expect(metrics.files).toBeGreaterThanOrEqual(1);
        expect(metrics.insertions).toBeGreaterThanOrEqual(1);
        expect(metrics.changedFiles).toContain("file1.ts");
        expect(metrics.repoHash).toHaveLength(64);
        expect(metrics.languages["TypeScript"]).toBeDefined();
      });

      it("throws error for invalid non-git repository path", async () => {
        const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "qodewk-non-git-"));
        await expect(extractGitMetrics({ repoPath: emptyDir })).rejects.toThrow(/not a valid Git repository/);
        fs.rmSync(emptyDir, { recursive: true, force: true });
      });

      it("resolves symbolic branch names and short commit SHAs to 40-character SHAs", async () => {
        const git = simpleGit(tempDir);
        fs.writeFileSync(path.join(tempDir, "file2.ts"), "export const x = 1;\n");
        await git.add("file2.ts");
        const commitRes = await git.commit("Add file2");
        const shortSha = commitRes.commit.slice(0, 7);

        const branchSummary = await git.branch();
        const currentBranch = branchSummary.current;

        const metrics = await extractGitMetrics({
          repoPath: tempDir,
          baseSha: currentBranch,
          headSha: shortSha
        });

        expect(metrics.headSha).toHaveLength(40);
        expect(metrics.baseSha).toHaveLength(40);
        expect(metrics.headSha).toMatch(/^[0-9a-f]{40}$/);
        expect(metrics.baseSha).toMatch(/^[0-9a-f]{40}$/);
      });
    });
  });

  describe("Cost Estimator (`estimator.ts`)", () => {
    it("aggregates Tier 1/2 deterministic sessions if present", () => {
      const sessions = [
        {
          provider: "anthropic",
          model: "claude-3-7-sonnet",
          tokens: { input: 10000, output: 2000, cached: 5000 },
          cost: 0.12,
          confidence: 0.95,
          mode: "verified" as const
        },
        {
          provider: "anthropic",
          model: "claude-3-7-sonnet",
          tokens: { input: 5000, output: 1000, cached: 2000 },
          cost: 0.06,
          confidence: 0.95,
          mode: "verified" as const
        }
      ];

      const result = estimateCost({
        files: 2,
        insertions: 50,
        deletions: 10,
        sessions
      });

      expect(result.tokens.input).toBe(15000);
      expect(result.tokens.output).toBe(3000);
      expect(result.tokens.cached).toBe(7000);
      expect(result.cost).toBe(0.18);
      expect(result.mode).toBe("verified");
    });

    it("uses Tier 3 heuristic multipliers based on file count", () => {
      // 1 file -> 15x multiplier
      const smallRes = estimateCost({ files: 1, insertions: 100, deletions: 0, provider: "anthropic" });
      // 5 files -> 35x multiplier
      const medRes = estimateCost({ files: 5, insertions: 100, deletions: 0, provider: "anthropic" });
      // 12 files -> 60x multiplier
      const largeRes = estimateCost({ files: 12, insertions: 100, deletions: 0, provider: "anthropic" });

      expect(smallRes.tokens.input).toBeLessThan(medRes.tokens.input);
      expect(medRes.tokens.input).toBeLessThan(largeRes.tokens.input);
      expect(smallRes.mode).toBe("estimated");
      expect(smallRes.confidence).toBe(0.65);
    });

    it("defaults to unknown mode and generic provider when no provider supplied", () => {
      const result = estimateCost({ files: 2, insertions: 20, deletions: 5 });
      expect(result.provider).toBe("generic");
      expect(result.mode).toBe("unknown");
      expect(result.confidence).toBe(0.45);
    });
  });

  describe("Provider Discovery (`discovery.ts`)", () => {
    it("detects AI providers from commit messages", () => {
      expect(detectProviderFromCommit("feat: add core engine (claude code)")?.provider).toBe("anthropic");
      expect(detectProviderFromCommit("fix: sync state via antigravity")?.provider).toBe("antigravity");
      expect(detectProviderFromCommit("refactor: update UI in cursor")?.provider).toBe("cursor");
      expect(detectProviderFromCommit("feat: copilot helper")?.provider).toBe("copilot");
      expect(detectProviderFromCommit("chore: update docs")).toBeNull();
    });
  });

  describe("Scoring & Primary Selection (`scoring.ts`)", () => {
    const baseGitCtx = {
      headSha: "1234567890abcdef1234567890abcdef12345678",
      commitDate: "2025-01-01T12:00:00.000Z",
      changedFiles: ["src/index.ts", "src/db.ts"]
    };

    const mockFootprint: AgentFootprint = {
      id: "fp_1",
      platform: "claude",
      sessionId: "s_1",
      repoPath: "/test/repo",
      taskTitle: "Refactor core",
      model: "claude-3-7-sonnet",
      stepsCount: 5,
      filesEdited: ["src/index.ts"],
      timestamp: "2025-01-01T12:05:00.000Z",
      tokens: { input: 1000, output: 200, cached: 500 },
      cost: 0.05,
      mode: "verified",
      confidence: 0.95
    };

    it("scores footprint high when commit bound match occurs", () => {
      const boundFp: AgentFootprint = {
        ...mockFootprint,
        boundCommitSha: baseGitCtx.headSha
      };

      const score = scoreFootprint(boundFp, baseGitCtx);
      expect(score).toBeGreaterThanOrEqual(1.0);
    });

    it("penalizes footprint when filesEdited has zero overlap with commit changedFiles", () => {
      const noOverlapFp: AgentFootprint = {
        ...mockFootprint,
        filesEdited: ["unrelated/file.txt"]
      };

      const scoreNormal = scoreFootprint(mockFootprint, baseGitCtx);
      const scoreNoOverlap = scoreFootprint(noOverlapFp, baseGitCtx);

      expect(scoreNoOverlap).toBeLessThan(scoreNormal);
    });

    it("selects primary footprint based on score ranking", () => {
      const fpLow: AgentFootprint = { ...mockFootprint, id: "low", filesEdited: ["other.ts"] };
      const fpHigh: AgentFootprint = { ...mockFootprint, id: "high", filesEdited: ["src/index.ts", "src/db.ts"] };

      const selection = selectPrimaryFootprint([fpLow, fpHigh], baseGitCtx);
      expect(selection.primary?.id).toBe("high");
      expect(selection.rankedFootprints[0]?.id).toBe("high");
    });
  });

  describe("Harvesters (`antigravity.ts`, `claude.ts`, `cursor.ts`)", () => {
    it("returns empty footprint array gracefully when directories/dbs do not exist", () => {
      const emptyPath = path.join(os.tmpdir(), "non-existent-repo-path");
      expect(harvestAntigravityFootprints(emptyPath)).toEqual([]);
      expect(harvestClaudeFootprints(emptyPath, "non-existent")).toEqual([]);
      expect(harvestCursorFootprints(emptyPath)).toEqual([]);
    });
  });

  describe("Database (`db.ts`)", () => {
    it("creates in-memory SQLite database and saves/retrieves receipts and footprints", () => {
      const db = new LocalStateDB(true);

      const mockReceipt: ReceiptV1 = {
        version: "1.0",
        receipt: {
          id: "rec_123456789012345678901234",
          createdAt: "2025-01-01T00:00:00.000Z",
          contentHash: "a".repeat(64)
        },
        repository: {
          repoHash: "b".repeat(64),
          projectAlias: "db-test-project",
          branch: "main",
          headSha: "c".repeat(40),
          commitsCount: 1
        },
        mutation: {
          files: 3,
          insertions: 50,
          deletions: 10,
          netLines: 40,
          renames: 0
        },
        ai: {
          provider: "anthropic",
          tokens: { input: 5000, output: 1000, cached: 2000 },
          cost: 0.08,
          mode: "verified",
          confidence: 0.95
        },
        privacy: {
          sourceExcluded: true,
          isPublic: true,
          anonymizeBranch: false
        }
      };

      db.saveReceipt(mockReceipt, "clm_12345");
      const fetched = db.getReceipt("rec_123456789012345678901234");

      expect(fetched).not.toBeNull();
      expect(fetched?.receipt.id).toBe(mockReceipt.receipt.id);
      expect(fetched?.repository.projectAlias).toBe("db-test-project");

      db.close();
    });
  });

  describe("Format Engine (`format.ts`)", () => {
    it("formats PR markdown receipt with provenance labels and public link", () => {
      const mockReceipt: ReceiptV1 = {
        version: "1.0",
        receipt: {
          id: "rec_123456789012345678901234",
          createdAt: "2025-01-01T00:00:00.000Z",
          contentHash: "a".repeat(64)
        },
        repository: {
          repoHash: "b".repeat(64),
          projectAlias: "fmt-project",
          branch: "main",
          headSha: "c".repeat(40),
          commitsCount: 1
        },
        mutation: {
          files: 4,
          insertions: 100,
          deletions: 20,
          netLines: 80,
          renames: 0
        },
        ai: {
          provider: "anthropic",
          model: "claude-3-7-sonnet",
          tokens: { input: 10000, output: 2000, cached: 5000 },
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

      const md = formatMarkdownReceipt(mockReceipt, "https://qodewk.dev/r/rec_123456789012345678901234");

      expect(md).toContain("<!-- QODEWK_RECEIPT_START:rec_123456789012345678901234 -->");
      expect(md).toContain("Qodewk Telemetry Receipt");
      expect(md).toContain("$0.15");
      expect(md).toContain("Verified");
      expect(md).toContain("https://qodewk.dev/r/rec_123456789012345678901234");
    });
  });
});
