import { harvestAntigravityFootprints } from "./antigravity.js";
import { harvestClaudeFootprints } from "./claude.js";
import { harvestCursorFootprints } from "./cursor.js";
import { selectPrimaryFootprint } from "./scoring.js";
import type { AgentFootprint, HarvestOptions } from "./types.js";
import { LocalStateDB } from "../db.js";

export * from "./types.js";
export * from "./scoring.js";
export * from "./antigravity.js";
export * from "./claude.js";
export * from "./cursor.js";

export function parseSinceOption(since?: string | Date): Date | undefined {
  if (!since) return undefined;
  if (since instanceof Date) return since;

  const s = since.trim().toLowerCase();
  const now = new Date();

  if (s === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  }

  const hoursMatch = s.match(/^(\d+)\s*h(?:ours?)?$/);
  if (hoursMatch && hoursMatch[1]) {
    const hours = parseInt(hoursMatch[1], 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  const daysMatch = s.match(/^(\d+)\s*d(?:ays?)?$/);
  if (daysMatch && daysMatch[1]) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(since);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return undefined;
}

export interface UniversalHarvestResult {
  footprints: AgentFootprint[];
  primaryFootprint?: AgentFootprint;
  platforms: string[];
  models: string[];
  tasks: string[];
  filesEdited: string[];
  totalTokens: {
    input: number;
    output: number;
    cached: number;
  };
  totalCost: number;
  mode: "verified" | "imported" | "observed" | "estimated" | "unknown";
  confidence: number;
}

export async function harvestUniversalFootprints(
  options: HarvestOptions
): Promise<UniversalHarvestResult> {
  const sinceDate = parseSinceOption(options.since);
  const alias = options.projectAlias || "";
  let allFootprints: AgentFootprint[] = [];

  // 1. Harvest Google Antigravity
  if (!options.platform || options.platform === "all" || options.platform === "antigravity") {
    const agFootprints = harvestAntigravityFootprints(options.repoPath, sinceDate);
    allFootprints.push(...agFootprints);
  }

  // 2. Harvest Claude Code CLI
  if (!options.platform || options.platform === "all" || options.platform === "claude") {
    const claudeFootprints = harvestClaudeFootprints(options.repoPath, alias, sinceDate);
    allFootprints.push(...claudeFootprints);
  }

  // 3. Harvest Cursor IDE
  if (!options.platform || options.platform === "all" || options.platform === "cursor") {
    const cursorFootprints = harvestCursorFootprints(options.repoPath, sinceDate);
    allFootprints.push(...cursorFootprints);
  }

  // 4. Score and rank footprints using commit-bound attribution
  const { primary, rankedFootprints } = selectPrimaryFootprint(allFootprints, options.gitContext);
  allFootprints = rankedFootprints;

  // Save footprints to local state DB
  try {
    const db = new LocalStateDB();
    for (const fp of allFootprints) {
      db.saveFootprint(fp);
    }
    db.close();
  } catch {}

  const platforms = Array.from(new Set(allFootprints.map((f) => f.platform)));
  const models = Array.from(new Set(allFootprints.map((f) => f.model)));
  const tasks = Array.from(new Set(allFootprints.map((f) => f.taskTitle).filter(Boolean)));
  const filesSet = new Set<string>();
  for (const fp of allFootprints) {
    for (const f of fp.filesEdited) filesSet.add(f);
  }

  let totalInput = 0;
  let totalOutput = 0;
  let totalCached = 0;
  let totalCost = 0;

  for (const fp of allFootprints) {
    totalInput += fp.tokens.input;
    totalOutput += fp.tokens.output;
    totalCached += fp.tokens.cached;
    totalCost += fp.cost;
  }

  return {
    footprints: allFootprints,
    primaryFootprint: primary,
    platforms,
    models,
    tasks,
    filesEdited: Array.from(filesSet),
    totalTokens: {
      input: totalInput,
      output: totalOutput,
      cached: totalCached
    },
    totalCost: Number(totalCost.toFixed(4)),
    mode: primary ? primary.mode : "unknown",
    confidence: primary ? primary.confidence : 0.45
  };
}
