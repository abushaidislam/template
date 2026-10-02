import * as readline from "node:readline";
import pc from "picocolors";
import {
  generateReceipt,
  LocalStateDB,
  sanitizeReceiptForShare,
  detectDefaultBaseBranch
} from "@qodewk/core";
import { ReceiptV1 } from "@qodewk/protocol";
import { colors, visibleWidth, stripAnsi } from "./theme.js";
import { buildTerminalReceipt, renderTerminalReceipt } from "./receipt-view.js";
import {
  resolveGitHooksDir,
  checkHookStatus,
  installHookFile,
  uninstallHookFile
} from "./hooks.js";

const INNER_WIDTH = 58;
const SHARE_PAYLOAD_MAX_BYTES = 50_000;

export interface MenuItem {
  id: string;
  key: string;
  label: string;
  description: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "receipt",
    key: "1",
    label: "Generate Local Receipt",
    description: "Inspect git diff and print digital receipt"
  },
  {
    id: "audit",
    key: "2",
    label: "Audit Branch or Revision Range",
    description: "Compare against base commit or upstream branch"
  },
  {
    id: "share",
    key: "3",
    label: "Publish Receipt to Cloud",
    description: "Privacy-safe shareable URL & claim token"
  },
  {
    id: "hooks",
    key: "4",
    label: "Configure Git Hooks",
    description: "Non-blocking background telemetry recording"
  },
  {
    id: "storage",
    key: "5",
    label: "Database & Storage Status",
    description: "Inspect local SQLite (~/.qodewk/state.db) records"
  },
  {
    id: "exit",
    key: "0",
    label: "Exit",
    description: "Return to shell"
  }
];

export function buildMenuFrame(selectedIndex: number, items: MenuItem[] = MENU_ITEMS): string {
  const lines: string[] = [];
  const coral = colors.coral;
  const mutedSoft = colors.mutedSoft;
  const amber = colors.amber;
  const border = colors.mutedSoft;

  const push = (line: string) => lines.push(line);

  const printRow = (content: string, width = INNER_WIDTH) => {
    const visLen = visibleWidth(content);
    const pad = Math.max(0, width - visLen);
    push(`  ${border("│")} ${content}${" ".repeat(pad)} ${border("│")}`);
  };

  const printCenteredRow = (content: string, width = INNER_WIDTH) => {
    const visLen = visibleWidth(content);
    const totalPad = Math.max(0, width - visLen);
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;
    push(`  ${border("│")} ${" ".repeat(leftPad)}${content}${" ".repeat(rightPad)} ${border("│")}`);
  };

  const printDivider = (width = INNER_WIDTH) => {
    push(`  ${border("├" + "─".repeat(width + 2) + "┤")}`);
  };

  push("");
  push(`  ${border("┌" + "─".repeat(INNER_WIDTH + 2) + "┐")}`);
  printCenteredRow(pc.bold(pc.white("Q O D E W K")));
  printCenteredRow(coral("Telemetry Control Panel"));
  printDivider();
  printCenteredRow(mutedSoft("Use ↑ / ↓ to navigate · Enter to select · q to quit"));
  printDivider();
  printRow("");

  const mainItems = items.filter((item) => item.id !== "exit");
  const exitItem = items.find((item) => item.id === "exit");

  for (let i = 0; i < mainItems.length; i++) {
    const item = mainItems[i];
    const itemIndex = items.indexOf(item);
    const isSelected = itemIndex === selectedIndex;

    if (isSelected) {
      const pointer = pc.bold(coral("›"));
      const keyTag = pc.bold(coral(`[${item.key}]`));
      const label = pc.bold(pc.white(item.label));
      printRow(` ${pointer} ${keyTag} ${label}`);
      printRow(`       ${amber(item.description)}`);
    } else {
      const keyTag = mutedSoft(`[${item.key}]`);
      const label = pc.dim(pc.white(item.label));
      printRow(`   ${keyTag} ${label}`);
      printRow(`       ${pc.dim(item.description)}`);
    }

    if (i < mainItems.length - 1) {
      printRow("");
    }
  }

  printRow("");

  if (exitItem) {
    printDivider();
    const exitIndex = items.indexOf(exitItem);
    const isSelected = exitIndex === selectedIndex;
    if (isSelected) {
      const pointer = pc.bold(coral("›"));
      const keyTag = pc.bold(coral(`[${exitItem.key}]`));
      const label = pc.bold(pc.white(exitItem.label));
      printRow(` ${pointer} ${keyTag} ${label}`);
      printRow(`       ${amber(exitItem.description)}`);
    } else {
      const keyTag = mutedSoft(`[${exitItem.key}]`);
      const label = pc.dim(pc.white(exitItem.label));
      printRow(`   ${keyTag} ${label}`);
      printRow(`       ${pc.dim(exitItem.description)}`);
    }
  }

  printDivider();
  printCenteredRow(pc.dim("[✓] Source code was never uploaded to Qodewk"));
  push(`  ${border("└" + "─".repeat(INNER_WIDTH + 2) + "┘")}`);
  push("");

  return lines.join("\n");
}

function askLine(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function waitForKeyToReturn(): Promise<void> {
  return new Promise((resolve) => {
    console.log(pc.dim("\n  Press any key or Enter to return to menu..."));
    if (!process.stdin.isTTY) {
      resolve();
      return;
    }
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onKey = () => {
      process.stdin.removeListener("data", onKey);
      if (wasRaw !== undefined) process.stdin.setRawMode(wasRaw);
      resolve();
    };
    process.stdin.once("data", onKey);
  });
}

export async function runInteractiveMenu(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.log(buildMenuFrame(0));
    console.log(pc.yellow("Interactive menu requires a TTY terminal. Use `qodewk --help` for commands."));
    return;
  }

  let selectedIndex = 0;
  let active = true;
  let lastRenderedLinesCount = 0;

  const render = () => {
    const frame = buildMenuFrame(selectedIndex);
    const lineCount = frame.split("\n").length;

    if (lastRenderedLinesCount > 0) {
      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, -lastRenderedLinesCount);
      readline.clearScreenDown(process.stdout);
    }

    process.stdout.write(frame);
    lastRenderedLinesCount = lineCount;
  };

  const cleanup = () => {
    try {
      process.stdin.setRawMode(false);
    } catch {}
    process.stdout.write("\x1b[?25h"); // show cursor
  };

  process.on("exit", cleanup);

  const executeSelectedAction = async () => {
    cleanup();
    console.log("");
    lastRenderedLinesCount = 0;

    const selectedItem = MENU_ITEMS[selectedIndex];

    switch (selectedItem.id) {
      case "receipt": {
        console.log(pc.dim("  [·] Generating local receipt from git diff..."));
        try {
          const receipt = await generateReceipt({ isPublic: false });
          const db = new LocalStateDB();
          db.saveReceipt(receipt);
          db.close();
          await renderTerminalReceipt(receipt);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(pc.red(`\n  Failed to generate receipt: ${message}`));
        }
        await waitForKeyToReturn();
        break;
      }

      case "audit": {
        console.log(pc.bold(pc.white("\n  Audit Branch or Revision Diff")));
        console.log(pc.dim("  ──────────────────────────────────────────────────────────"));

        let defaultBase = "origin/main";
        try {
          const { simpleGit } = await import("simple-git");
          defaultBase = await detectDefaultBaseBranch(simpleGit(process.cwd()));
        } catch {}

        const base = await askLine(
          `  › Base git ref or commit SHA [default: ${defaultBase}]: `
        );
        const head = await askLine(
          `  › Head git ref or commit SHA [default: HEAD]: `
        );

        console.log(pc.dim("\n  [·] Auditing git revision range..."));
        try {
          const receipt = await generateReceipt({
            baseSha: base || defaultBase,
            headSha: head || "HEAD",
            isPublic: false
          });
          const db = new LocalStateDB();
          db.saveReceipt(receipt);
          db.close();
          await renderTerminalReceipt(receipt);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(pc.red(`\n  Audit failed: ${message}`));
        }
        await waitForKeyToReturn();
        break;
      }

      case "share": {
        console.log(pc.dim("  [·] Generating and sanitizing receipt for cloud publishing..."));
        try {
          const receipt = await generateReceipt({ isPublic: false });

          if (process.env.QODEWK_TELEMETRY === "off") {
            console.log(pc.yellow("\n  Cloud publishing is disabled by QODEWK_TELEMETRY=off."));
            await renderTerminalReceipt(receipt);
            await waitForKeyToReturn();
            break;
          }

          const sanitized = sanitizeReceiptForShare(receipt);
          let body = JSON.stringify(sanitized);

          if (Buffer.byteLength(body, "utf-8") > SHARE_PAYLOAD_MAX_BYTES && sanitized.ai.sessions) {
            const trimmed = {
              ...sanitized,
              ai: { ...sanitized.ai, sessions: undefined }
            };
            body = JSON.stringify(trimmed);
          }

          const endpoint =
            process.env.QODEWK_API_URL ||
            `${process.env.NEXT_PUBLIC_APP_URL || process.env.QODEWK_APP_URL || "https://qodewk.flinkeo.online"}/api/receipts`;

          console.log(pc.dim(`  [·] Uploading metadata to ${endpoint}...`));

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": String(Buffer.byteLength(body, "utf-8"))
            },
            body
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => "");
            throw new Error(`API responded with ${response.status}${errText ? `: ${errText.slice(0, 100)}` : ""}`);
          }

          const data = (await response.json()) as { url: string; claimToken: string };

          const db = new LocalStateDB();
          db.saveReceipt(sanitized, data.claimToken);
          db.close();

          console.log("");
          console.log(colors.green("  [✓] Published successfully."));
          console.log(`  ${pc.dim("Public URL:")}  ${pc.underline(pc.cyan(data.url))}`);
          console.log(`  ${pc.bold(colors.amber("Claim token:"))} ${colors.amber(data.claimToken)}`);
          console.log(pc.dim("  (Saved to ~/.qodewk/state.db for future authorship proofs)\n"));

          await renderTerminalReceipt(sanitized, data.url);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(pc.red(`\n  Share failed: ${message}`));
        }
        await waitForKeyToReturn();
        break;
      }

      case "hooks": {
        await manageHooksSubmenu();
        break;
      }

      case "storage": {
        await showStorageStatus();
        break;
      }

      case "exit": {
        active = false;
        cleanup();
        console.log(pc.dim("  Exited Qodewk.\n"));
        process.exit(0);
        return;
      }
    }
  };

  const manageHooksSubmenu = async () => {
    const hooksDir = resolveGitHooksDir();
    const status = checkHookStatus(hooksDir);

    console.log(pc.bold(pc.white("\n  Qodewk Git Hooks Management")));
    console.log(pc.dim("  ──────────────────────────────────────────────────────────"));
    if (!status.isGit) {
      console.log(pc.yellow("  Not inside a Git repository. Hooks cannot be configured."));
      await waitForKeyToReturn();
      return;
    }

    console.log(`  Hooks directory: ${pc.dim(status.hooksDir || "None")}`);
    console.log(
      `  post-commit:     ${status.postCommitInstalled ? colors.green("[✓ Installed]") : pc.dim("[· Not installed]")}`
    );
    console.log(
      `  post-rewrite:    ${status.postRewriteInstalled ? colors.green("[✓ Installed]") : pc.dim("[· Not installed]")}`
    );
    console.log("");
    console.log("  [1] Install non-blocking hooks (< 5ms background recorder)");
    console.log("  [2] Uninstall Qodewk hooks");
    console.log("  [0] Back to main menu");
    console.log("");

    const choice = await askLine("  › Select option [0-2]: ");
    if (choice === "1") {
      if (status.hooksDir) {
        const path = await import("node:path");
        const targets = ["post-commit", "post-rewrite"] as const;
        for (const t of targets) {
          installHookFile(path.join(status.hooksDir, t));
        }
        console.log(colors.green("\n  [✓] Non-blocking hooks installed successfully."));
      }
    } else if (choice === "2") {
      if (status.hooksDir) {
        const path = await import("node:path");
        const targets = ["post-commit", "post-rewrite"] as const;
        for (const t of targets) {
          uninstallHookFile(path.join(status.hooksDir, t));
        }
        console.log(colors.green("\n  [✓] Qodewk hooks removed."));
      }
    }
    await waitForKeyToReturn();
  };

  const showStorageStatus = async () => {
    console.log(pc.bold(pc.white("\n  Qodewk Local Database & Storage Status")));
    console.log(pc.dim("  ──────────────────────────────────────────────────────────"));

    try {
      const db = new LocalStateDB();
      const stats = db.getStats();
      const recent = db.getRecentReceipts(5);
      db.close();

      console.log(`  Database path:          ${pc.dim("~/.qodewk/state.db")}`);
      console.log(`  Total saved receipts:   ${pc.bold(pc.white(String(stats.totalReceipts)))}`);
      console.log(`  Total agent footprints: ${pc.bold(pc.white(String(stats.totalFootprints)))}`);
      console.log("");

      if (recent.length === 0) {
        console.log(pc.dim("  No stored receipts yet. Run 'Generate Local Receipt' to record your first."));
      } else {
        console.log(pc.dim("  Recent Receipts:"));
        console.log(pc.dim("  " + "ID".padEnd(26) + "DATE".padEnd(12) + "BRANCH".padEnd(18) + "COST"));
        console.log(pc.dim("  " + "─".repeat(60)));
        for (const item of recent) {
          const id = item.receipt.receipt.id.slice(0, 24).padEnd(26);
          const date = item.receipt.receipt.createdAt.slice(0, 10).padEnd(12);
          const branch = (item.receipt.repository.branch || "unknown").slice(0, 16).padEnd(18);
          const cost = colors.coral(`$${item.receipt.ai.cost.toFixed(2)}`);
          console.log(`  ${id}${date}${branch}${cost}`);
        }
      }

      console.log("");
      console.log(`  ${colors.green("[✓]")} ${pc.dim("Privacy guarantee: raw source code is never stored in SQLite")}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`  Failed to inspect storage: ${message}`));
    }

    await waitForKeyToReturn();
  };

  // Main menu loop
  readline.emitKeypressEvents(process.stdin);

  const startLoop = () => {
    process.stdout.write("\x1b[?25l"); // hide cursor
    process.stdin.setRawMode(true);
    process.stdin.resume();
    render();

    const onKeypress = async (_str: string, key: readline.Key) => {
      if (!active) return;

      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(0);
      }

      if (key.name === "q" || key.name === "escape") {
        cleanup();
        console.log(pc.dim("\n  Exited Qodewk.\n"));
        process.exit(0);
      }

      if (key.name === "up" || key.name === "k") {
        selectedIndex = (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        render();
        return;
      }

      if (key.name === "down" || key.name === "j") {
        selectedIndex = (selectedIndex + 1) % MENU_ITEMS.length;
        render();
        return;
      }

      // Direct key mapping for numbers 0-5
      const itemByKey = MENU_ITEMS.findIndex((item) => item.key === key.name || item.key === _str);
      if (itemByKey !== -1) {
        selectedIndex = itemByKey;
        render();
        process.stdin.removeListener("keypress", onKeypress);
        await executeSelectedAction();
        if (active) {
          startLoop();
        }
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        process.stdin.removeListener("keypress", onKeypress);
        await executeSelectedAction();
        if (active) {
          startLoop();
        }
        return;
      }
    };

    process.stdin.on("keypress", onKeypress);
  };

  startLoop();
}
