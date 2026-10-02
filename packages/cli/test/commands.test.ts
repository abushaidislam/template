import { describe, it, expect } from "vitest";
import path from "node:path";
import { execSync } from "node:child_process";
import { ReceiptV1Schema } from "@qodewk/protocol";

const binPath = path.resolve(__dirname, "../dist/index.cjs");

describe("qodewk CLI Command Execution (`commands.test.ts`)", { timeout: 20000 }, () => {
  it("generates valid ReceiptV1 JSON when called with --json", () => {
    const rawOut = execSync(`node "${binPath}" --json`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });

    const parsed = JSON.parse(rawOut);
    const validated = ReceiptV1Schema.safeParse(parsed);

    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data.version).toBe("1.0");
      expect(validated.data.receipt.id).toMatch(/^rec_/);
      expect(validated.data.privacy.sourceExcluded).toBe(true);
      expect(validated.data.repository.projectAlias).toBeDefined();
      expect(validated.data.mutation.files).toBeGreaterThanOrEqual(0);
      expect(validated.data.ai.tokens.input).toBeGreaterThanOrEqual(0);
    }
  });

  it("generates GitHub PR-ready Markdown comment when called with -f markdown", () => {
    const rawOut = execSync(`node "${binPath}" -f markdown`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });

    expect(rawOut).toContain("<!-- QODEWK_RECEIPT_START:");
    expect(rawOut).toContain("<!-- QODEWK_RECEIPT_END -->");
    expect(rawOut).toContain("### Qodewk Telemetry Receipt");
    expect(rawOut).toContain("| **Files Touched** |");
    expect(rawOut).toContain("| **AI Spend** |");
    expect(rawOut).toContain("Privacy Guarantee:");
  });

  it("anonymizes branch name when called with --anon --json", () => {
    const rawOut = execSync(`node "${binPath}" --anon --json`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });

    const parsed = JSON.parse(rawOut);
    expect(parsed.privacy.anonymizeBranch).toBe(true);
    // Branch should either be hashed, masked with asterisks, or anonymized alias
    expect(parsed.repository.branch).toBeDefined();
    expect(parsed.repository.branch).not.toBe("");
  });

  it("executes cleanly in local-only mode with --local flag", () => {
    const rawOut = execSync(`node "${binPath}" --local --json`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });

    const parsed = JSON.parse(rawOut);
    expect(parsed.version).toBe("1.0");
    expect(parsed.receipt.id).toBeDefined();
  });

  it("accepts --since and --today filter options without error", () => {
    const todayOut = execSync(`node "${binPath}" --today --json`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });
    expect(() => JSON.parse(todayOut)).not.toThrow();

    const since24hOut = execSync(`node "${binPath}" --since 24h --json`, {
      encoding: "utf-8",
      cwd: process.cwd()
    });
    expect(() => JSON.parse(since24hOut)).not.toThrow();
  });

  it("allows overriding AI provider and model via CLI options", () => {
    const customOut = execSync(
      `node "${binPath}" -p anthropic -m claude-sonnet-4 --json`,
      {
        encoding: "utf-8",
        cwd: process.cwd()
      }
    );

    const parsed = JSON.parse(customOut);
    expect(parsed.ai.provider).toBe("anthropic");
    expect(parsed.ai.model).toBe("claude-sonnet-4");
  });
});
