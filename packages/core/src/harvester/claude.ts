import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { getRateCard, computeCost } from "@qodewk/pricing";
import type { AgentFootprint } from "./types.js";
import { normalizeFilePath } from "./scoring.js";

export function harvestClaudeFootprints(repoPath: string, projectAlias: string, sinceDate?: Date): AgentFootprint[] {
  const footprints: AgentFootprint[] = [];
  const homedir = os.homedir();
  const claudeProjectsDir = path.join(homedir, ".claude", "projects");

  if (!fs.existsSync(claudeProjectsDir)) {
    return footprints;
  }

  try {
    const projectDirs = fs.readdirSync(claudeProjectsDir);
    const matchedDir = projectDirs.find(d =>
      d.toLowerCase().includes(projectAlias.toLowerCase()) ||
      projectAlias.toLowerCase().includes(d.toLowerCase())
    );

    if (!matchedDir) return footprints;

    const sessionDir = path.join(claudeProjectsDir, matchedDir);
    const files = fs.readdirSync(sessionDir).filter(f => f.endsWith(".jsonl"));

    for (const f of files) {
      const filePath = path.join(sessionDir, f);
      const stat = fs.statSync(filePath);
      if (sinceDate && stat.mtime < sinceDate) continue;

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.trim().split("\n");

      let inputTokens = 0;
      let outputTokens = 0;
      let cachedTokens = 0;
      let taskTitle = "";
      let model = "claude-3-7-sonnet";
      const filesEdited = new Set<string>();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.model) model = data.model;

          if (data.usage) {
            inputTokens += data.usage.input_tokens || 0;
            outputTokens += data.usage.output_tokens || 0;
            cachedTokens += data.usage.cache_read_input_tokens || 0;
          }

          if (!taskTitle && data.type === "user_message" && data.text) {
            taskTitle = data.text.slice(0, 60).replace(/\n/g, " ");
          }

          if (data.tool_name === "Edit" || data.tool_name === "Write") {
            if (data.tool_input?.file_path) {
              filesEdited.add(normalizeFilePath(String(data.tool_input.file_path), repoPath));
            }
          }
        } catch {}
      }

      if (inputTokens > 0 || outputTokens > 0) {
        const rateCard = getRateCard(model);
        const cost = computeCost(inputTokens, outputTokens, cachedTokens, rateCard);

        footprints.push({
          id: `claude_${f.replace(/\.jsonl$/, "")}`,
          platform: "claude",
          sessionId: f.replace(/\.jsonl$/, ""),
          repoPath,
          taskTitle: taskTitle || "Claude Code Task",
          model,
          stepsCount: lines.length,
          filesEdited: Array.from(filesEdited),
          timestamp: stat.mtime.toISOString(),
          tokens: {
            input: inputTokens,
            output: outputTokens,
            cached: cachedTokens
          },
          cost,
          mode: "verified",
          confidence: 0.95,
          rawTranscriptPath: filePath
        });
      }
    }
  } catch {
    // Fail-safe
  }

  return footprints;
}
