import { z } from "zod";

export const AttributionModeSchema = z.enum([
  "observed",
  "estimated",
  "imported",
  "verified",
  "unknown"
]);
export type AttributionMode = z.infer<typeof AttributionModeSchema>;

export const ProviderSessionSchema = z.object({
  provider: z.string(), // e.g. "anthropic", "openai", "cursor", "copilot", "gemini", "antigravity"
  model: z.string().optional(),
  task: z.string().optional(),
  filesTouched: z.array(z.string()).optional(),
  tokens: z.object({
    input: z.number().int().nonnegative().default(0),
    output: z.number().int().nonnegative().default(0),
    cached: z.number().int().nonnegative().default(0)
  }),
  cost: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  mode: AttributionModeSchema
});
export type ProviderSession = z.infer<typeof ProviderSessionSchema>;

export const ReceiptV1Schema = z.object({
  version: z.literal("1.0"),
  receipt: z.object({
    id: z.string().startsWith("rec_"),
    createdAt: z.string().datetime(),
    sessionStartedAt: z.string().datetime().optional(),
    sessionEndedAt: z.string().datetime().optional(),
    contentHash: z.string().length(64) // SHA-256 of canonical payload
  }),
  repository: z.object({
    repoHash: z.string().length(64), // Salted SHA-256 of remote URL/path
    projectAlias: z.string().min(1).max(100),
    branch: z.string(),
    branchHash: z.string().length(64).optional(),
    headSha: z.string().length(40),
    baseSha: z.string().length(40).optional(),
    commitsCount: z.number().int().nonnegative().default(1)
  }),
  mutation: z.object({
    files: z.number().int().nonnegative(),
    insertions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    netLines: z.number().int(),
    renames: z.number().int().nonnegative().default(0),
    languages: z.record(z.string(), z.number()).optional() // e.g. { "TypeScript": 85, "Markdown": 15 }
  }),
  ai: z.object({
    provider: z.string(),
    model: z.string().optional(),
    task: z.string().optional(),
    aiWrittenRatio: z.number().min(0).max(1).optional(),
    tokens: z.object({
      input: z.number().int().nonnegative(),
      output: z.number().int().nonnegative(),
      cached: z.number().int().nonnegative().default(0)
    }),
    cost: z.number().nonnegative(),
    mode: AttributionModeSchema,
    confidence: z.number().min(0).max(1),
    sessions: z.array(ProviderSessionSchema).optional()
  }),
  privacy: z.object({
    sourceExcluded: z.literal(true), // Cryptographic assertion that code is omitted
    isPublic: z.boolean().default(true),
    anonymizeBranch: z.boolean().default(false)
  })
});
export type ReceiptV1 = z.infer<typeof ReceiptV1Schema>;

export const CreateReceiptResponseSchema = z.object({
  publicId: z.string(),
  url: z.string().url(),
  claimToken: z.string(),
  expiresAt: z.string().datetime().optional()
});
export type CreateReceiptResponse = z.infer<typeof CreateReceiptResponseSchema>;
