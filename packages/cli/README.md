# Qodewk — Proof of Shipment for the AI Coding Agent Era

> **Universal telemetry, multi-platform agent footprint harvester, and digital receipt generator for autonomous software development.**
> Built for Google Antigravity, Claude Code, Cursor, Copilot, Windsurf, Aider, and multi-agent Git workflows.

[![npm version](https://img.shields.io/npm/v/qodewk.svg?color=cc785c&label=npm%20package)](https://www.npmjs.com/package/qodewk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Turborepo](https://img.shields.io/badge/monorepo-Turborepo-ef4444.svg)](https://turbo.build)
[![Design: Claude Warm Editorial](https://img.shields.io/badge/design-Claude%20Editorial-cc785c.svg)](https://qodewk.dev)

---

## ⚡️ Quickstart (Zero Install)

Run directly from any Git repository without installing any packages globally:

```bash
# Launch interactive terminal control panel (TUI menu)
npx qodewk menu
# or shortcut:
npx qodewk -i

# Generate monospace thermal receipt for latest commit / working tree
npx qodewk

# Harvest agent work for today (Chit-style proof of shipment)
npx qodewk --today

# Harvest agent work from the last 24 hours or 7 days
npx qodewk --since 24h
npx qodewk --since 7d

# Filter to a specific agent platform (antigravity, claude, cursor)
npx qodewk --platform antigravity

# Output machine-readable JSON telemetry
npx qodewk --json

# Publish privacy-safe receipt to web and get shareable URL
npx qodewk share

# Audit a PR branch diff range against base (supports branch names, short SHAs, and HEAD)
npx qodewk audit --base master --head 7076f0a --format markdown --out receipt.md
```

---

## 🎛️ Interactive Terminal Control Panel

Run `npx qodewk menu` (or `qodewk -i`) to open the keyboard-navigable interactive terminal control panel:

```text
  ┌────────────────────────────────────────────────────────────┐
  │                        Q O D E W K                         │
  │                  Telemetry Control Panel                   │
  ├────────────────────────────────────────────────────────────┤
  │    Use ↑ / ↓ to navigate · Enter to select · q to quit     │
  ├────────────────────────────────────────────────────────────┤
  │                                                            │
  │  › [1] Generate Local Receipt                              │
  │        Inspect git diff and print digital receipt          │
  │                                                            │
  │    [2] Audit Branch or Revision Range                      │
  │        Compare against base commit or upstream branch      │
  │                                                            │
  │    [3] Publish Receipt to Cloud                            │
  │        Privacy-safe shareable URL & claim token            │
  │                                                            │
  │    [4] Configure Git Hooks                                 │
  │        Non-blocking background telemetry recording         │
  │                                                            │
  │    [5] Database & Storage Status                           │
  │        Inspect local SQLite (~/.qodewk/state.db) records   │
  │                                                            │
  ├────────────────────────────────────────────────────────────┤
  │    [0] Exit                                                │
  │        Return to shell                                     │
  ├────────────────────────────────────────────────────────────┤
  │        [✓] Source code was never uploaded to Qodewk        │
  └────────────────────────────────────────────────────────────┘
```

### Purposeful Visual Hierarchy
- **Control Panel:** Clean, modern developer CLI box (`┌─┐`, `│`, `├─┤`, `└─┘`) following the Claude Warm Editorial design tokens (`#cc785c` coral accents, `#e8a55a` amber highlights, `#8e8b82` muted hairlines) with **zero cheap emojis**.
- **Tactile Thermal Artifact:** The signature serrated zig-zag edges (`/\/\/\...` and `\/\/\/\...`) and inline Code 128 thermal barcode are preserved **exclusively** for the generated Proof of Shipment digital receipt!

---

### Verified Thermal ASCII Receipt Preview
```text
  /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
  |                     Q O D E W K                      |
  |              *** PROOF OF SHIPMENT ***               |
  |                                                      |
  | ID:   rec_8381ef3792010f9a2cfe      DATE: 2026-09-28 |
  | REPO: qodewk                          BRANCH: master |
  | TASK: Antigravity Model Provider Issues              |
  | ==================================================== |
  | ITEMS CHANGED                                    QTY |
  | ---------------------------------------------------- |
  | Files Touched                                      1 |
  | Lines Inserted                                  + 50 |
  | Lines Deleted                                   - 58 |
  | Net Code Delta                                   - 8 |
  | ---------------------------------------------------- |
  | AI TELEMETRY & ATTRIBUTION                           |
  | Provider: antigravity · gemini-3                     |
  | AI Written Code                     88% (Human: 12%) |
  | Tokens:   935k in (654k cached) / 112k out           |
  | Total Tokens:                              1,046,640 |
  | ==================================================== |
  | VERIFIED AI COST                               $2.72 |
  | CONFIDENCE: 95%                     [Mode: verified] |
  | ==================================================== |
  |                                                      |
  |     █  █ ██ █ ██ █    █ ██   ████    ██  █ █ ███ ██  |
  |     █  █ ██ █ ██ █    █ ██   ████    ██  █ █ ███ ██  |
  |           [ LOCAL RECORD — NOT PUBLISHED ]           |
  |                                                      |
  |   [✓] Source code was never uploaded to Qodewk       |
  \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
```

---

## 🌟 Universal Multi-Platform Footprint Harvester

Unlike single-vendor utilities (like Chit, which only support Claude Code CLI), **Qodewk operates globally across all major AI coding platforms**. It reads your local agent transcripts, matches them with your repository's Git revision graph, and proves what was actually shipped.

| Platform | Local Data Source / Footprint | Captured Telemetry | Status |
|---|---|---|---|
| **Google Antigravity** | `~/.gemini/antigravity/conversation_summaries.db` & `brain/<id>/.../transcript.jsonl` | Shipped task titles, exact models (`Claude Opus 4.6 Thinking`, `Gemini 3.8 Flash`, etc.), tool calls (`replace_file_content`, `write_to_file`), and multi-turn tokens | **Tier A (Verified)** |
| **Claude Code CLI** | `~/.claude/projects/<slug>/sessions/*.jsonl` | User prompts, exact input/output/cached token usage, and `Edit`/`Write` file mutations | **Tier A (Verified)** |
| **Cursor IDE** | `~/.cursor/projects/<slug>/agent-transcripts/*.jsonl` & `workspaceStorage/*/state.vscdb` | Commit hash binding (`aiCodeTracking.recentCommit`), agent transcripts, tool edits, and token expenditures | **Tier A (Verified / Imported)** |
| **GitHub Copilot** | Git commit revision trailers (`Co-authored-by: Copilot`) | Commit-level author attribution | **Heuristic (Observed)** |
| **Aider** | `.aider.chat.history.md` (Repository root) | Session prompts, model IDs, and code file diffs | *Tier B (Experimental Roadmap)* |

### Key Capabilities

1. **Interactive Control Panel (`qodewk menu`):**
   Full TUI control with keyboard navigation (`↑`/`↓`, `1`–`5`, `0`, `Enter`, `q`), status inspection, and action routing.
2. **Smart Git Ref & Short SHA Resolution:**
   Audits accept arbitrary branch names (`master`, `main`), short commit SHAs (`7076f0a`), or relative refs (`HEAD`, `HEAD~1`), automatically resolving them into canonical 40-character SHAs.
3. **Date-wise & Duration Filtering:**
   Analyze agent output over arbitrary time windows (`--today`, `--since 24h`, `--since 7d`, `--since "2026-09-28"`).
4. **AI vs. Human Code Attribution:**
   Cross-references Git diff hunks against agent tool calls to calculate exact contribution percentages (e.g. `AI Written Code: 88% (Human: 12%)`).
5. **Shipped Task Recognition:**
   Extracts high-level task summaries and user prompts directly from session databases, so your receipt doubles as an instant standup or PR summary.
6. **Never Fake Precision (Dual-Engine Provenance):**
   - **`verified` (95% Confidence):** Harvested directly from local agent transcripts & SQLite databases.
   - **`estimated` (45–65% Confidence):** Contextual Git diff & AST complexity fallback when operating in closed/uninstrumented environments.
7. **Modern Frontier Rate Cards:**
   Built-in pricing cards with cache read/write rates for `claude-opus-4-6-thinking`, `claude-sonnet-4-6-thinking`, `gemini-3-8-flash`, `gemini-2-5-pro`, `gpt-4o`, `o3-mini`, `deepseek-v3`, and `deepseek-r1`.

---

## 💻 CLI Command Reference

| Command / Option | Description | Output / Example |
|---|---|---|
| `npx qodewk menu` | Open interactive terminal control panel (TUI menu) | Interactive terminal box |
| `npx qodewk -i` / `--menu` | Flag shortcut to launch interactive menu | Interactive terminal box |
| `npx qodewk` | Harvest local agent footprints and inspect Git commit | Monospace thermal receipt |
| `npx qodewk --today` | Generate receipt for all agent sessions and code written today | Daily shipment receipt |
| `npx qodewk --since <duration>` | Filter agent work by duration (e.g. `24h`, `7d`, `2026-09-28`) | Time-bounded telemetry receipt |
| `npx qodewk --platform <platform>` | Filter telemetry to a specific platform (`antigravity`, `claude`, `cursor`, `all`) | Single-platform audit |
| `npx qodewk --json` | Export machine-readable telemetry conforming to canonical `ReceiptV1` schema | Formatted JSON output |
| `npx qodewk share` | Publish privacy-safe metadata to Qodewk Cloud and generate short link | `https://qodewk.dev/r/rec_...` |
| `npx qodewk share --today` | Share today's harvested footprint window | Public URL + claim token |
| `npx qodewk audit --base <branch>` | Calculate aggregate diff and telemetry across an entire PR branch range | Git revision delta receipt |
| `npx qodewk hook install` / `hooks install` | Install non-blocking `post-commit` + `post-rewrite` hooks (< 5ms background recorder) | Local auto-record |
| `npx qodewk hook uninstall` | Remove Qodewk Git hooks non-destructively | Clean uninstallation |
| `npx qodewk -f markdown -o receipt.md` | Export sticky Markdown receipt directly formatted for GitHub PR comments | File `receipt.md` |
| `npx qodewk -p <provider> -m <model>` | Override detected provider & frontier model pricing rate card | Custom model cost estimate |
| `npx qodewk --anon` | Redact sensitive repository and branch identifiers | Privacy-hardened receipt |
| `npx qodewk --local` | Force local-only mode (no cloud sockets on share) | Local thermal receipt |

---

## 🔒 Privacy Invariant (Zero Source Exfiltration)

1. **No Code Leaves Your Machine:** Source code files and raw Git diff bodies **never** touch the network.
2. **Metadata Only:** Public receipts contain only file counts, line insertions/deletions, language ratios, token counts, task titles, and cryptographic hashes (`HMAC-SHA256`).
3. **Hard 50 KB Request Cap:** The `/api/receipts` endpoint enforces a strict `50 KB` request body ceiling.
4. **Kill Switch:** Set `QODEWK_TELEMETRY=off` to disable all cloud publishing permanently.
5. **Local SQLite Footprint Storage:** Telemetry remains strictly stored in local SQLite (`~/.qodewk/state.db`).

---

## 📄 License

MIT © [Qodewk Contributors](LICENSE)
