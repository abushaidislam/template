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

/**
 * Harvests agent footprints from Cursor IDE:
 * 1. Checks modern ~/.cursor/projects/<project-slug>/agent-transcripts/ for full JSONL transcripts.
 * 2. Checks workspaceStorage/<workspace>/state.vscdb for aiCodeTracking.recentCommit & composer data.
 * 3. Supports legacy aichat chatdata and aiService.generations.
 */
export function harvestCursorFootprints(repoPath: string, sinceDate?: Date): AgentFootprint[] {
  const footprints: AgentFootprint[] = [];
  const normTarget = repoPath.toLowerCase().replace(/\\/g, "/").replace(/\/$/, "");
  const targetBasename = path.basename(repoPath).toLowerCase();

  // ───────────────────────────────────────────────────────────────────────────
  // SOURCE 1: Modern Cursor ~/.cursor/projects/<project-slug>/agent-transcripts
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const cursorProjectsDir = path.join(os.homedir(), ".cursor", "projects");
    if (fs.existsSync(cursorProjectsDir)) {
      const projectDirs = fs.readdirSync(cursorProjectsDir);

      for (const pDir of projectDirs) {
        const cleanPDir = pDir.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanTarget = normTarget.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanBase = targetBasename.replace(/[^a-z0-9]/g, "");

        // Match if directory matches full path slug or project base slug
        if (cleanPDir.includes(cleanTarget) || cleanTarget.includes(cleanPDir) || cleanPDir.endsWith(cleanBase)) {
          const transcriptsDir = path.join(cursorProjectsDir, pDir, "agent-transcripts");
          if (!fs.existsSync(transcriptsDir)) continue;

          const sessionDirs = fs.readdirSync(transcriptsDir);
          for (const sDir of sessionDirs) {
            const sPath = path.join(transcriptsDir, sDir);
            if (!fs.statSync(sPath).isDirectory()) continue;

            const jsonlFile = path.join(sPath, `${sDir}.jsonl`);
            if (!fs.existsSync(jsonlFile)) continue;

            const stat = fs.statSync(jsonlFile);
            if (sinceDate && stat.mtime < sinceDate) continue;

            try {
              const content = fs.readFileSync(jsonlFile, "utf-8");
              const lines = content.split("\n");
              let stepCount = 0;
              let taskTitle = "";
              let model = "claude-3-5-sonnet";
              const filesEditedSet = new Set<string>();

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const entry = JSON.parse(line);

                  // Extract task title from initial user query
                  if (!taskTitle && entry.role === "user" && entry.message?.content) {
                    for (const c of entry.message.content) {
                      if (c.type === "text" && c.text) {
                        const m = c.text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
                        if (m && m[1]) {
                          taskTitle = m[1].replace(/\n/g, " ").trim().slice(0, 60);
                        } else if (!c.text.startsWith("<timestamp>")) {
                          taskTitle = c.text.replace(/\n/g, " ").trim().slice(0, 60);
                        }
                      }
                    }
                  }

                  // Count assistant tool uses and record edited files
                  if (entry.role === "assistant" && entry.message?.content) {
                    for (const c of entry.message.content) {
                      if (c.type === "tool_use") {
                        stepCount++;
                        const name = (c.name || "").toLowerCase();
                        const inp = c.input || {};

                        // Check if this tool is a file mutation tool
                        if (
                          name.includes("replace") ||
                          name.includes("edit") ||
                          name.includes("write") ||
                          name.includes("diff") ||
                          name.includes("apply")
                        ) {
                          const target = inp.path || inp.file_path || inp.target_file || inp.file;
                          if (target && typeof target === "string") {
                            filesEditedSet.add(normalizeFilePath(target, repoPath));
                          }
                        }
                      }
                    }
                  }
                } catch {}
              }

              if (stepCount > 0) {
                const rateCard = getRateCard(model);
                const estInput = stepCount * 3000;
                const estCached = Math.round(estInput * 0.6);
                const estOutput = stepCount * 450;
                const cost = computeCost(estInput, estOutput, estCached, rateCard);

                footprints.push({
                  id: `cursor_transcript_${sDir}`,
                  platform: "cursor",
                  sessionId: sDir,
                  repoPath,
                  taskTitle: taskTitle || "Cursor Agent Session",
                  model,
                  stepsCount: stepCount,
                  filesEdited: Array.from(filesEditedSet),
                  timestamp: stat.mtime.toISOString(),
                  tokens: {
                    input: estInput,
                    output: estOutput,
                    cached: estCached
                  },
                  cost,
                  mode: "imported",
                  confidence: 0.85,
                  rawTranscriptPath: jsonlFile
                });
              }
            } catch {}
          }
        }
      }
    }
  } catch {}

  // ───────────────────────────────────────────────────────────────────────────
  // SOURCE 2: Cursor SQLite workspaceStorage (aiCodeTracking & composer)
  // ───────────────────────────────────────────────────────────────────────────
  const DatabaseSync = getSqliteDatabase();
  if (DatabaseSync) {
    let storageDir = "";
    if (process.platform === "win32") {
      storageDir = path.join(
        process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
        "Cursor",
        "User",
        "workspaceStorage"
      );
    } else if (process.platform === "darwin") {
      storageDir = path.join(os.homedir(), "Library", "Application Support", "Cursor", "User", "workspaceStorage");
    } else {
      storageDir = path.join(os.homedir(), ".config", "Cursor", "User", "workspaceStorage");
    }

    if (fs.existsSync(storageDir)) {
      try {
        const wsDirs = fs.readdirSync(storageDir);

        for (const ws of wsDirs) {
          const wsPath = path.join(storageDir, ws);
          const wsJsonPath = path.join(wsPath, "workspace.json");
          if (!fs.existsSync(wsJsonPath)) continue;

          try {
            const wsJson = JSON.parse(fs.readFileSync(wsJsonPath, "utf-8"));
            let folderUri = wsJson.folder || wsJson.workspace || "";

            // FIX: Safely URI-decode folder URI (e.g. file:///c%3A/Users/... -> c:/users/...)
            try {
              folderUri = decodeURIComponent(folderUri.replace(/^file:\/\/\/?/, ""));
            } catch {}

            const folder = folderUri.toLowerCase().replace(/\\/g, "/");
            if (!folder.includes(normTarget) && !normTarget.includes(folder) && !folder.endsWith(targetBasename)) {
              continue;
            }

            const dbFile = path.join(wsPath, "state.vscdb");
            if (!fs.existsSync(dbFile)) continue;

            const dbStat = fs.statSync(dbFile);
            if (sinceDate && dbStat.mtime < sinceDate) continue;

            const db = new DatabaseSync(dbFile, { readOnly: true });

            // 2A. Inspect aiCodeTracking.recentCommit (direct Git commit binding!)
            try {
              const rowRecent = db
                .prepare("SELECT value FROM ItemTable WHERE key = 'aiCodeTracking.recentCommit' LIMIT 1")
                .get() as { value: string } | undefined;

              if (rowRecent && rowRecent.value) {
                const recent = JSON.parse(rowRecent.value);
                if (recent && recent.commitHash) {
                  const added = Number(recent.linesAdded || recent.composerLinesAdded || 0);
                  const deleted = Number(recent.linesDeleted || recent.composerLinesDeleted || 0);
                  const estOut = Math.max(Math.round(((added + deleted) * 35) / 4), 100);
                  const estIn = estOut * 20;
                  const estCached = Math.round(estIn * 0.6);
                  const rateCard = getRateCard("claude-3-7-sonnet");
                  const cost = computeCost(estIn, estOut, estCached, rateCard);

                  const commitDate = recent.commitDate
                    ? new Date(recent.commitDate).toISOString()
                    : recent.timestamp
                    ? new Date(recent.timestamp).toISOString()
                    : dbStat.mtime.toISOString();

                  footprints.push({
                    id: `cursor_commit_${recent.commitHash.slice(0, 12)}`,
                    platform: "cursor",
                    sessionId: ws,
                    repoPath,
                    taskTitle: recent.commitMessage || "Cursor AI Commit",
                    model: "claude-3-7-sonnet",
                    stepsCount: Math.max(Math.round((added + deleted) / 10), 1),
                    filesEdited: [],
                    timestamp: commitDate,
                    boundCommitSha: recent.commitHash,
                    tokens: {
                      input: estIn,
                      output: estOut,
                      cached: estCached
                    },
                    cost,
                    mode: "verified",
                    confidence: 0.95,
                    rawTranscriptPath: dbFile
                  });
                }
              }
            } catch {}

            // 2B. Inspect legacy chatdata and generations as fallback if no footprints found for this workspace
            const rowLegacy = db
              .prepare(
                "SELECT value FROM ItemTable WHERE key = 'workbench.panel.aichat.chatdata' OR key = 'aiService.generations' LIMIT 1"
              )
              .get() as { value: string } | undefined;

            if (rowLegacy && rowLegacy.value) {
              try {
                const parsed = JSON.parse(rowLegacy.value);
                const tabs = parsed.tabs || (Array.isArray(parsed) ? parsed : []);
                let stepCount = 0;
                let taskTitle = "";
                let model = "claude-3-5-sonnet";

                for (const tab of tabs) {
                  const bubbles = tab.bubbles || [];
                  stepCount += bubbles.length;
                  if (!taskTitle && tab.chatTitle) taskTitle = tab.chatTitle;
                  for (const b of bubbles) {
                    if (b.modelType) model = b.modelType;
                  }
                }

                if (stepCount > 0) {
                  const rateCard = getRateCard(model);
                  const estInput = stepCount * 2500;
                  const estCached = Math.round(estInput * 0.6);
                  const estOutput = stepCount * 250;
                  const cost = computeCost(estInput, estOutput, estCached, rateCard);

                  footprints.push({
                    id: `cursor_chat_${ws}`,
                    platform: "cursor",
                    sessionId: ws,
                    repoPath,
                    taskTitle: taskTitle || "Cursor Chat Session",
                    model,
                    stepsCount: stepCount,
                    filesEdited: [],
                    timestamp: dbStat.mtime.toISOString(),
                    tokens: {
                      input: estInput,
                      output: estOutput,
                      cached: estCached
                    },
                    cost,
                    mode: "imported",
                    confidence: 0.80,
                    rawTranscriptPath: dbFile
                  });
                }
              } catch {}
            }
          } catch {}
        }
      } catch {}
    }
  }

  return footprints;
}
