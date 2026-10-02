import * as crypto from "node:crypto";
import { ReceiptV1Schema, type ReceiptV1, type ProviderSession } from "@qodewk/protocol";
import { extractGitMetrics, computeAiWrittenRatio, type GitDiffMetrics } from "./git.js";
import { detectProviderFromCommit } from "./discovery.js";
import { harvestUniversalFootprints } from "./harvester/index.js";
import { estimateCost } from "./estimator.js";

export * from "./git.js";
export * from "./discovery.js";
export * from "./harvester/index.js";
export * from "./estimator.js";
export * from "./db.js";
export * from "./format.js";

export interface GenerateReceiptOptions {
  repoPath?: string;
  baseSha?: string;
  headSha?: string;
  provider?: string;
  model?: string;
  task?: string;
  since?: string | Date;
  platform?: string;
  isPublic?: boolean;
  anonymizeBranch?: boolean;
}

/**
 * Strip path-level session detail before cloud publish.
 * Keeps aggregate telemetry; drops filesTouched (paths).
 */
export function sanitizeReceiptForShare(receipt: ReceiptV1): ReceiptV1 {
  const sessions = receipt.ai.sessions?.map((s) => ({
    provider: s.provider,
    model: s.model,
    task: s.task,
    tokens: s.tokens,
    cost: s.cost,
    confidence: s.confidence,
    mode: s.mode
  }));

  return {
    ...receipt,
    privacy: {
      ...receipt.privacy,
      sourceExcluded: true as const,
      isPublic: true
    },
    ai: {
      ...receipt.ai,
      sessions
    }
  };
}

export async function generateReceipt(options: GenerateReceiptOptions = {}): Promise<ReceiptV1> {
  const metrics: GitDiffMetrics = await extractGitMetrics({
    repoPath: options.repoPath || process.cwd(),
    baseSha: options.baseSha,
    headSha: options.headSha,
    since: options.since
  });

  const repoPath = options.repoPath || process.cwd();
  const harvestResult = await harvestUniversalFootprints({
    repoPath,
    projectAlias: metrics.projectAlias,
    since: options.since,
    platform: options.platform,
    gitContext: {
      headSha: metrics.headSha,
      commitDate: metrics.commitDate,
      changedFiles: metrics.changedFiles,
      branch: metrics.branch
    }
  });

  const primaryFp = harvestResult.primaryFootprint;
  const detected = detectProviderFromCommit(metrics.commitMessage);

  const provider = options.provider || primaryFp?.platform || detected?.provider || "unknown";
  const model = options.model || primaryFp?.model || detected?.model;
  const task =
    options.task ||
    primaryFp?.taskTitle ||
    (harvestResult.tasks.length > 0 ? harvestResult.tasks[0] : undefined);

  const sessions: ProviderSession[] = harvestResult.footprints.map((fp) => ({
    provider: fp.platform,
    model: fp.model,
    task: fp.taskTitle,
    filesTouched: fp.filesEdited,
    tokens: fp.tokens,
    cost: fp.cost,
    confidence: fp.confidence,
    mode: fp.mode
  }));

  const aiWrittenRatio = computeAiWrittenRatio(
    metrics.changedFiles,
    harvestResult.filesEdited
  );

  const costResult = estimateCost({
    files: metrics.files,
    insertions: metrics.insertions,
    deletions: metrics.deletions,
    provider: provider !== "unknown" ? provider : undefined,
    model,
    sessions: sessions.length > 0 ? sessions : undefined,
    confidence: primaryFp?.confidence || detected?.confidence
  });

  const now = new Date().toISOString();

  const payloadToHash = {
    repoHash: metrics.repoHash,
    headSha: metrics.headSha,
    baseSha: metrics.baseSha,
    files: metrics.files,
    insertions: metrics.insertions,
    deletions: metrics.deletions,
    cost: costResult.cost,
    tokens: costResult.tokens,
    mode: costResult.mode,
    provider: costResult.provider,
    model: costResult.model
  };
  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payloadToHash))
    .digest("hex");
  // Idempotent id: same shipment content → same public receipt id
  const receiptId = `rec_${contentHash.slice(0, 24)}`;

  const receipt: ReceiptV1 = {
    version: "1.0",
    receipt: {
      id: receiptId,
      createdAt: now,
      contentHash
    },
    repository: {
      repoHash: metrics.repoHash,
      projectAlias: metrics.projectAlias,
      branch: options.anonymizeBranch ? "anonymized-branch" : metrics.branch,
      headSha: metrics.headSha,
      baseSha: metrics.baseSha,
      commitsCount: metrics.commitsCount || 1
    },
    mutation: {
      files: metrics.files,
      insertions: metrics.insertions,
      deletions: metrics.deletions,
      netLines: metrics.netLines,
      renames: metrics.renames,
      languages: metrics.languages
    },
    ai: {
      provider: costResult.provider,
      model: costResult.model,
      task,
      aiWrittenRatio,
      tokens: costResult.tokens,
      cost: costResult.cost,
      mode: costResult.mode,
      confidence: costResult.confidence,
      sessions: costResult.sessions
    },
    privacy: {
      sourceExcluded: true,
      isPublic: options.isPublic ?? false,
      anonymizeBranch: options.anonymizeBranch ?? false
    }
  };

  return ReceiptV1Schema.parse(receipt);
}
