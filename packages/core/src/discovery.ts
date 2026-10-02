import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ProviderSession } from "@qodewk/protocol";

export interface ProviderDiscoveryResult {
  provider: string;
  model?: string;
  sessions?: ProviderSession[];
  confidence: number;
  mode: "observed" | "estimated" | "imported" | "verified" | "unknown";
}

export function detectProviderFromCommit(commitMessage?: string): Partial<ProviderDiscoveryResult> | null {
  if (!commitMessage) return null;

  const msg = commitMessage.toLowerCase();

  // Check Claude Code trailers
  if (msg.includes("claude") || msg.includes("anthropic")) {
    return {
      provider: "anthropic",
      model: "claude-3-7-sonnet",
      confidence: 0.85,
      mode: "observed"
    };
  }

  // Check Antigravity trailers
  if (msg.includes("antigravity")) {
    return {
      provider: "antigravity",
      model: "claude-sonnet-4-6-thinking",
      confidence: 0.85,
      mode: "observed"
    };
  }

  // Check Gemini trailers
  if (msg.includes("gemini")) {
    return {
      provider: "google",
      model: "gemini-3-8-flash",
      confidence: 0.85,
      mode: "observed"
    };
  }

  // Check Cursor trailers
  if (msg.includes("cursor")) {
    return {
      provider: "cursor",
      model: "claude-3-5-sonnet",
      confidence: 0.85,
      mode: "observed"
    };
  }

  // Check Copilot trailers
  if (msg.includes("copilot") || msg.includes("github-actions")) {
    return {
      provider: "copilot",
      model: "gpt-4o",
      confidence: 0.8,
      mode: "observed"
    };
  }

  return null;
}

export function discoverAntigravityEnvironment(): Partial<ProviderDiscoveryResult> | null {
  const isAgent = process.env.ANTIGRAVITY_AGENT === "1" || Boolean(process.env.ANTIGRAVITY_CONVERSATION_ID);
  const homedir = os.homedir();
  const antigravityDir = process.env.ANTIGRAVITY_APP_DATA_DIR || path.join(homedir, ".gemini", "antigravity");

  if (isAgent) {
    return {
      provider: "antigravity",
      model: "claude-sonnet-4-6-thinking",
      confidence: 0.85,
      mode: "observed"
    };
  }

  if (fs.existsSync(antigravityDir)) {
    return {
      provider: "antigravity",
      model: "claude-sonnet-4-6-thinking",
      confidence: 0.65,
      mode: "estimated"
    };
  }

  return null;
}

export function discoverLocalClaudeSessions(projectAlias: string): ProviderSession[] {
  const sessions: ProviderSession[] = [];
  const homedir = os.homedir();
  const claudeProjectsDir = path.join(homedir, ".claude", "projects");

  if (!fs.existsSync(claudeProjectsDir)) {
    return sessions;
  }

  try {
    const projectDirs = fs.readdirSync(claudeProjectsDir);
    const matchedDir = projectDirs.find(d => d.toLowerCase().includes(projectAlias.toLowerCase()));

    if (matchedDir) {
      const sessionPath = path.join(claudeProjectsDir, matchedDir);
      const files = fs.readdirSync(sessionPath).filter(f => f.endsWith(".jsonl"));

      // Read latest session
      if (files.length > 0) {
        const latestFile = path.join(sessionPath, files[files.length - 1]!);
        const content = fs.readFileSync(latestFile, "utf-8");
        const lines = content.trim().split("\n");

        let inputTokens = 0;
        let outputTokens = 0;
        let cachedTokens = 0;

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.usage) {
              inputTokens += data.usage.input_tokens || 0;
              outputTokens += data.usage.output_tokens || 0;
              cachedTokens += data.usage.cache_read_input_tokens || 0;
            }
          } catch {
            // skip unparseable lines
          }
        }

        if (inputTokens > 0 || outputTokens > 0) {
          sessions.push({
            provider: "anthropic",
            model: "claude-3-7-sonnet",
            tokens: {
              input: inputTokens,
              output: outputTokens,
              cached: cachedTokens
            },
            cost: Number((((inputTokens - cachedTokens) * 3.0 + cachedTokens * 0.3 + outputTokens * 15.0) / 1_000_000).toFixed(4)),
            confidence: 0.95,
            mode: "verified"
          });
        }
      }
    }
  } catch {
    // Graceful fallback on permission or file system issues
  }

  return sessions;
}
