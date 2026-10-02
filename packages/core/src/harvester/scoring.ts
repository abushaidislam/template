import type { AgentFootprint, GitAttributionContext } from "./types.js";

/**
 * Normalizes a file path for safe cross-platform set comparison.
 * Handles Windows drive letters, backslashes, leading ./ and casing.
 */
export function normalizeFilePath(filePath: string, repoPath?: string): string {
  let p = filePath.replace(/\\/g, "/").trim();

  // Strip file:// prefix if present
  p = p.replace(/^file:\/\/\/?/, "");

  // If repoPath is provided and path is absolute within repoPath, make relative
  if (repoPath) {
    const normRepo = repoPath.replace(/\\/g, "/").replace(/\/$/, "");
    if (p.toLowerCase().startsWith(normRepo.toLowerCase())) {
      p = p.slice(normRepo.length);
    }
  }

  // Strip leading slash or dot-slash
  p = p.replace(/^\.?\//, "");

  return p.toLowerCase();
}

/**
 * Calculates a commit-bound attribution score for an agent footprint.
 * Implements the architecture from Section 5 of docs/12-production-roadmap.md:
 * - Commit hash bind: +1.00 (direct proven commit link)
 * - File overlap ratio: 0.00 – 0.40 (ratio of changed files edited by agent)
 * - Empty overlap penalty: -0.15 (agent touched files, but none in this commit)
 * - Time proximity: 0.00 – 0.25 (closeness to commit timestamp)
 * - Stale penalty: -0.10 (> 24 hours separation)
 * - Provenance mode weight: 0.00 – 0.10 (verified > observed > imported > estimated)
 */
export function scoreFootprint(
  fp: AgentFootprint,
  gitCtx?: GitAttributionContext
): number {
  if (!gitCtx) {
    return 0.5;
  }

  let score = 0.10; // Base score

  // 1. Commit Hash Bind (+1.00 match, -0.50 mismatch)
  if (fp.boundCommitSha && gitCtx.headSha) {
    const bound = fp.boundCommitSha.toLowerCase().trim();
    const head = gitCtx.headSha.toLowerCase().trim();

    if (bound === head || bound.startsWith(head.slice(0, 7)) || head.startsWith(bound.slice(0, 7))) {
      score += 1.00;
    } else {
      // Explicitly bound to a different commit
      score -= 0.50;
    }
  }

  // 2. File Overlap Ratio (0.00 to 0.40)
  if (gitCtx.changedFiles && gitCtx.changedFiles.length > 0) {
    const normChanged = gitCtx.changedFiles.map((f) => normalizeFilePath(f, fp.repoPath));
    const normEdited = (fp.filesEdited || []).map((f) => normalizeFilePath(f, fp.repoPath));

    if (normEdited.length > 0) {
      let matches = 0;
      for (const cf of normChanged) {
        const found = normEdited.some(
          (ef) =>
            ef === cf ||
            cf.endsWith("/" + ef) ||
            ef.endsWith("/" + cf) ||
            cf.endsWith(ef) ||
            ef.endsWith(cf)
        );
        if (found) matches++;
      }

      const ratio = matches / normChanged.length;
      if (matches > 0) {
        score += ratio * 0.40;
      } else {
        // Agent touched files in this repo, but zero overlap with this commit
        score -= 0.15;
      }
    }
  }

  // 3. Time Proximity (up to +0.25, or -0.10 penalty if stale)
  if (gitCtx.commitDate && fp.timestamp) {
    try {
      const commitTime = new Date(gitCtx.commitDate).getTime();
      const fpTime = new Date(fp.timestamp).getTime();

      if (!isNaN(commitTime) && !isNaN(fpTime)) {
        const diffMinutes = Math.abs(commitTime - fpTime) / (60 * 1000);

        if (diffMinutes <= 15) {
          score += 0.25;
        } else if (diffMinutes <= 60) {
          score += 0.20;
        } else if (diffMinutes <= 180) {
          score += 0.15;
        } else if (diffMinutes <= 720) {
          score += 0.08;
        } else if (diffMinutes <= 1440) {
          score += 0.03;
        } else {
          // Stale session (> 24 hours from commit)
          score -= 0.10;
        }
      }
    } catch {}
  }

  // 4. Provenance Mode Weight
  switch (fp.mode) {
    case "verified":
      score += 0.10;
      break;
    case "observed":
      score += 0.08;
      break;
    case "imported":
      score += 0.05;
      break;
    case "estimated":
      score += 0.02;
      break;
    default:
      break;
  }

  return Math.max(0, Math.round(score * 100) / 100);
}

/**
 * Selects the ranked primary footprint and ordered runners-up using commit-bound scoring.
 */
export function selectPrimaryFootprint(
  footprints: AgentFootprint[],
  gitCtx?: GitAttributionContext
): { primary?: AgentFootprint; rankedFootprints: AgentFootprint[] } {
  if (footprints.length === 0) {
    return { primary: undefined, rankedFootprints: [] };
  }

  // If no Git context provided, fallback to timestamp descending
  if (!gitCtx || (!gitCtx.headSha && !gitCtx.commitDate && (!gitCtx.changedFiles || gitCtx.changedFiles.length === 0))) {
    const sorted = [...footprints].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return { primary: sorted[0], rankedFootprints: sorted };
  }

  // Score each footprint
  const scored = footprints.map((fp) => {
    const score = scoreFootprint(fp, gitCtx);
    return {
      ...fp,
      attributionScore: score
    };
  });

  // Sort by score descending, with timestamp as tie-breaker
  scored.sort((a, b) => {
    const scoreDiff = (b.attributionScore || 0) - (a.attributionScore || 0);
    if (Math.abs(scoreDiff) > 0.001) {
      return scoreDiff;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return {
    primary: scored[0],
    rankedFootprints: scored
  };
}
