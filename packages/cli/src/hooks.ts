import * as fs from "node:fs";
import * as path from "node:path";

export const HOOK_MARKER_BEGIN = "# --- BEGIN QODEWK HOOK ---";
export const HOOK_MARKER_END = "# --- END QODEWK HOOK ---";

export const HOOK_SNIPPET = `
${HOOK_MARKER_BEGIN}
# Non-blocking Qodewk background recorder (< 5ms)
if command -v qodewk >/dev/null 2>&1 || command -v pnpm >/dev/null 2>&1 || [ -f "./node_modules/.bin/qodewk" ]; then
  ( ( qodewk record || pnpm qodewk record || npx qodewk record ) >/dev/null 2>&1 & )
fi
${HOOK_MARKER_END}
`;

/**
 * Resolve the shared Git hooks directory, including worktrees where `.git` is a file.
 */
export function resolveGitHooksDir(cwd: string = process.cwd()): string | null {
  const gitPath = path.join(cwd, ".git");
  if (!fs.existsSync(gitPath)) return null;

  let gitCommonDir: string;

  const stat = fs.statSync(gitPath);
  if (stat.isDirectory()) {
    gitCommonDir = gitPath;
  } else {
    const content = fs.readFileSync(gitPath, "utf-8");
    const match = content.match(/gitdir:\s*(.+)/i);
    if (!match?.[1]) return null;

    let gitDir = match[1].trim();
    if (!path.isAbsolute(gitDir)) {
      gitDir = path.resolve(cwd, gitDir);
    }

    const commonFile = path.join(gitDir, "commondir");
    if (fs.existsSync(commonFile)) {
      let common = fs.readFileSync(commonFile, "utf-8").trim();
      if (!path.isAbsolute(common)) {
        common = path.resolve(gitDir, common);
      }
      gitCommonDir = common;
    } else if (path.basename(path.dirname(gitDir)) === "worktrees") {
      gitCommonDir = path.dirname(path.dirname(gitDir));
    } else {
      gitCommonDir = gitDir;
    }
  }

  return path.join(gitCommonDir, "hooks");
}

export function checkHookStatus(hooksDir: string | null): {
  isGit: boolean;
  hooksDir: string | null;
  postCommitInstalled: boolean;
  postRewriteInstalled: boolean;
} {
  if (!hooksDir || !fs.existsSync(hooksDir)) {
    return {
      isGit: Boolean(hooksDir),
      hooksDir,
      postCommitInstalled: false,
      postRewriteInstalled: false
    };
  }

  const postCommit = path.join(hooksDir, "post-commit");
  const postRewrite = path.join(hooksDir, "post-rewrite");

  const hasHook = (p: string) => {
    if (!fs.existsSync(p)) return false;
    try {
      const content = fs.readFileSync(p, "utf-8");
      return content.includes(HOOK_MARKER_BEGIN);
    } catch {
      return false;
    }
  };

  return {
    isGit: true,
    hooksDir,
    postCommitInstalled: hasHook(postCommit),
    postRewriteInstalled: hasHook(postRewrite)
  };
}

export function installHookFile(hookFile: string): "installed" | "exists" {
  let content = "";
  if (fs.existsSync(hookFile)) {
    content = fs.readFileSync(hookFile, "utf-8");
  } else {
    content = "#!/bin/sh\n";
  }

  if (content.includes(HOOK_MARKER_BEGIN)) {
    return "exists";
  }

  fs.writeFileSync(hookFile, content + HOOK_SNIPPET, { mode: 0o755 });
  return "installed";
}

export function uninstallHookFile(hookFile: string): "removed" | "missing" | "absent" {
  if (!fs.existsSync(hookFile)) return "absent";

  const content = fs.readFileSync(hookFile, "utf-8");
  if (!content.includes(HOOK_MARKER_BEGIN)) return "missing";

  const regex = new RegExp(`\\n?${HOOK_MARKER_BEGIN}[\\s\\S]*?${HOOK_MARKER_END}\\n?`, "g");
  const updated = content.replace(regex, "");
  fs.writeFileSync(hookFile, updated, { mode: 0o755 });
  return "removed";
}
