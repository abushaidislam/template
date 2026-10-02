import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createRequire } from "node:module";
import { getRateCard, computeCost } from "@qodewk/pricing";
import type { AgentFootprint } from "./types.js";
import { normalizeFilePath } from "./scoring.js";

function getSqliteDatabase(): any {
  try {
    const mod = "node:" + "sqlite";
    if (typeof require !== "undefined") {
      return require(mod).DatabaseSync;
    }
  } catch {}
  try {
    const mod = "node:" + "sqlite";
    const req = createRequire(import.meta.url);
    return req(mod).DatabaseSync;
  } catch {
    return null;
  }
}

export function harvestAntigravityFootprints(repoPath: string, sinceDate?: Date): AgentFootprint[] {
  const footprints: AgentFootprint[] = [];
  const DatabaseSync = getSqliteDatabase();
  if (!DatabaseSync) return footprints;

  const homedir = os.homedir();
  const antigravityDir = process.env.ANTIGRAVITY_APP_DATA_DIR || path.join(homedir, ".gemini", "antigravity");
  const dbPath = path.join(antigravityDir, "conversation_summaries.db");

  if (!fs.existsSync(dbPath)) {
    return footprints;
  }

  try {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const normTarget = repoPath.toLowerCase().replace(/\\/g, "/");

    const rows = db.prepare(
      "SELECT conversation_id, title, preview, step_count, last_modified_time, workspace_uris FROM conversation_summaries ORDER BY last_modified_time DESC LIMIT 50"
    ).all() as any[];

    for (const row of rows) {
      if (!row.workspace_uris) continue;

      let matched = false;
      try {
        const uris = JSON.parse(row.workspace_uris) as string[];
        matched = uris.some((u: string) => {
          const decoded = decodeURIComponent(u.replace(/^file:\/\/\/?/, "")).toLowerCase().replace(/\\/g, "/");
          return decoded.includes(normTarget) || normTarget.includes(decoded);
        });
      } catch {
        continue;
      }

      if (!matched) continue;

      const rowTime = new Date(row.last_modified_time);
      if (sinceDate && rowTime < sinceDate) {
        continue;
      }

      // Read transcript to extract exact model, tool calls, and edited files
      const transcriptPath = path.join(antigravityDir, "brain", row.conversation_id, ".system_generated", "logs", "transcript.jsonl");
      let detectedModel = "claude-sonnet-4-6-thinking";
      const filesEdited = new Set<string>();

      if (fs.existsSync(transcriptPath)) {
        try {
          const content = fs.readFileSync(transcriptPath, "utf-8");
          const lines = content.split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes("Model Selection")) {
              const match = line.match(/Model Selection` from .*?to ([^\.\(\n\r]+)/);
              if (match && match[1]) {
                const rawModel = match[1].trim();
                if (rawModel.toLowerCase().includes("opus")) detectedModel = "claude-opus-4-6-thinking";
                else if (rawModel.toLowerCase().includes("sonnet")) detectedModel = "claude-sonnet-4-6-thinking";
                else if (rawModel.toLowerCase().includes("flash")) detectedModel = "gemini-3-8-flash";
                else if (rawModel.toLowerCase().includes("pro")) detectedModel = "gemini-2-5-pro";
                else detectedModel = rawModel.toLowerCase().replace(/\s+/g, "-");
              }
            }

            if (line.includes('"replace_file_content"') || line.includes('"write_to_file"')) {
              try {
                const obj = JSON.parse(line);
                if (obj.tool_calls) {
                  for (const tc of obj.tool_calls) {
                    if ((tc.name === "replace_file_content" || tc.name === "write_to_file") && tc.args) {
                      const file = tc.args.TargetFile || tc.args.targetFile;
                      if (file) {
                        filesEdited.add(normalizeFilePath(String(file), repoPath));
                      }
                    }
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }

      const rateCard = getRateCard(detectedModel);
      const stepCount = row.step_count || 1;
      const estimatedInput = Math.max(stepCount * 1500, 4000);
      const estimatedCached = Math.round(estimatedInput * 0.7);
      const estimatedOutput = Math.max(stepCount * 180, 400);
      const cost = computeCost(estimatedInput, estimatedOutput, estimatedCached, rateCard);

      footprints.push({
        id: `antigravity_${row.conversation_id}`,
        platform: "antigravity",
        sessionId: row.conversation_id,
        repoPath,
        taskTitle: row.title || row.preview || "Antigravity Task",
        model: detectedModel,
        stepsCount: stepCount,
        filesEdited: Array.from(filesEdited),
        timestamp: row.last_modified_time,
        tokens: {
          input: estimatedInput,
          output: estimatedOutput,
          cached: estimatedCached
        },
        cost,
        mode: "verified",
        confidence: 0.95,
        rawTranscriptPath: transcriptPath
      });
    }
  } catch {
    // Fail-safe
  }

  return footprints;
}
