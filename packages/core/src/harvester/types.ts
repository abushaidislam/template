import type { AttributionMode } from "@qodewk/protocol";

export interface AgentFootprint {
  id: string;
  platform: "antigravity" | "claude" | "cursor" | "aider" | "copilot";
  sessionId: string;
  repoPath: string;
  taskTitle: string;
  model: string;
  stepsCount: number;
  filesEdited: string[];
  timestamp: string; // ISO string
  tokens: {
    input: number;
    output: number;
    cached: number;
  };
  cost: number;
  mode: AttributionMode;
  confidence: number;
  rawTranscriptPath?: string;
  /** Explicit Git commit SHA recorded by the agent (e.g. Cursor recentCommit). */
  boundCommitSha?: string;
  /** Scored confidence that this footprint produced the inspected Git mutation. */
  attributionScore?: number;
}

export interface GitAttributionContext {
  headSha?: string;
  commitDate?: string | Date;
  changedFiles?: string[];
  branch?: string;
}

export interface HarvestOptions {
  repoPath: string;
  since?: string | Date;
  platform?: string;
  projectAlias?: string;
  gitContext?: GitAttributionContext;
}
