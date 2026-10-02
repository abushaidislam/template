import type { ReceiptV1 } from "@qodewk/protocol";

/**
 * Formats a ReceiptV1 as a GitHub PR-ready Markdown comment.
 */
export function formatMarkdownReceipt(receipt: ReceiptV1, publicUrl?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.QODEWK_APP_URL || "https://qodewk.flinkeo.online";
  const url = publicUrl || `${baseUrl}/r/${receipt.receipt.id}`;
  const totalTokens = (receipt.ai.tokens.input + receipt.ai.tokens.output).toLocaleString();
  const costPrefix = receipt.ai.mode === "verified" ? "$" : "~$";
  const confidencePercent = `${Math.round(receipt.ai.confidence * 100)}%`;
  const confidenceTier =
    receipt.ai.confidence >= 0.8 ? "High" : receipt.ai.confidence >= 0.4 ? "Medium" : "Low";
  const tokenProvenance =
    receipt.ai.mode === "verified" || receipt.ai.mode === "observed" ? "Observed" : "Estimated";
  const costProvenance =
    receipt.ai.mode === "verified" ? "Verified" : receipt.ai.mode === "observed" ? "Observed" : "Estimated";
  const tokenDisplay =
    receipt.ai.mode === "verified" || receipt.ai.mode === "observed"
      ? totalTokens
      : `~${totalTokens}`;

  const lines = [
    `<!-- QODEWK_RECEIPT_START:${receipt.receipt.id} -->`,
    `### Qodewk Telemetry Receipt`,
    ``,
    `| Metric | Measurement | Provenance |`,
    `| :--- | :--- | :--- |`,
    `| **Files Touched** | \`${receipt.mutation.files}\` | Observed |`,
    `| **Lines Inserted** | \`+${receipt.mutation.insertions}\` | Observed |`,
    `| **Lines Deleted** | \`-${receipt.mutation.deletions}\` | Observed |`,
    `| **Net Delta** | \`${receipt.mutation.netLines >= 0 ? "+" : ""}${receipt.mutation.netLines}\` | Observed |`,
    `| **AI Model** | \`${receipt.ai.provider} · ${receipt.ai.model || "Unknown"}\` | ${receipt.ai.mode} |`,
    `| **Tokens Consumed** | \`${tokenDisplay}\` | ${tokenProvenance} |`,
    `| **AI Spend** | \`${costPrefix}${receipt.ai.cost.toFixed(2)}\` | ${costProvenance} |`,
    `| **Confidence** | \`${confidencePercent}\` (${confidenceTier}) | Dual-Engine |`,
    ``,
    `> **Privacy Guarantee:** *Source code was never uploaded to Qodewk. Telemetry computed strictly from cryptographic Git metadata.*`,
    ``,
    `[**View Full Digital Receipt →**](${url})`,
    `<!-- QODEWK_RECEIPT_END -->`
  ];

  return lines.join("\n");
}
