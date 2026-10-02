#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import {
  generateReceipt,
  LocalStateDB,
  sanitizeReceiptForShare
} from "@qodewk/core";
import { ReceiptV1 } from "@qodewk/protocol";
import { outputReceipt, renderTerminalReceipt, OutputOptions } from "./receipt-view.js";
import { resolveGitHooksDir, installHookFile, uninstallHookFile } from "./hooks.js";
import { runInteractiveMenu } from "./menu.js";

const SHARE_PAYLOAD_MAX_BYTES = 50_000;

type HarvestCliOptions = {
  provider?: string;
  model?: string;
  since?: string;
  today?: boolean;
  platform?: string;
  anon?: boolean;
};

function resolveCliVersion(): string {
  try {
    const argv1 = process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : process.cwd();
    const candidates = [
      path.join(argv1, "..", "package.json"),
      path.join(argv1, "package.json")
    ];
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      const pkg = JSON.parse(fs.readFileSync(candidate, "utf-8")) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === "qodewk" && pkg.version) return pkg.version;
    }
  } catch {
    // fall through
  }
  return "0.3.0";
}

function resolveSince(options: HarvestCliOptions): string | undefined {
  return options.today ? "today" : options.since;
}

function persistReceipt(receipt: ReceiptV1, claimToken?: string): void {
  try {
    const db = new LocalStateDB();
    db.saveReceipt(receipt, claimToken);
    db.close();
  } catch {
    // CI / read-only / missing node:sqlite
  }
}

const program = new Command();

program
  .name("qodewk")
  .description("Universal telemetry and digital receipt generator for the AI coding agent era")
  .version(resolveCliVersion())
  .option("-i, --interactive", "Launch interactive terminal control panel")
  .option("--menu", "Launch interactive terminal control panel")
  .option("-j, --json", "Output receipt in machine-readable JSON format")
  .option("-f, --format <format>", "Output format (terminal, json, markdown)", "terminal")
  .option("-o, --out <path>", "Write receipt output to specified file path")
  .option("-p, --provider <provider>", "Specify AI provider (antigravity, claude, cursor, etc.)")
  .option("-m, --model <model>", "Specify AI model identifier")
  .option("-s, --since <duration>", "Harvest agent footprints since duration (e.g. today, 24h, 7d)")
  .option("--today", "Harvest agent footprints for today")
  .option("--platform <platform>", "Filter agent platform (antigravity, claude, cursor, all)")
  .option("--anon", "Anonymize branch name in output")
  .option("--local", "Force local-only mode (never open network sockets)")
  .option("--barcode", "Render classic 1D thermal barcode (always on; kept for compatibility)")
  .action(async (options) => {
    if (options.interactive || options.menu) {
      await runInteractiveMenu();
      return;
    }

    try {
      const receipt = await generateReceipt({
        provider: options.provider,
        model: options.model,
        since: resolveSince(options),
        platform: options.platform,
        anonymizeBranch: options.anon,
        isPublic: false
      });

      persistReceipt(receipt);
      await outputReceipt(receipt, options);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Error generating receipt: ${message}`));
      process.exit(1);
    }
  });

program
  .command("menu")
  .description("Launch interactive terminal control panel")
  .action(async () => {
    await runInteractiveMenu();
  });

program
  .command("audit")
  .description("Audit PR or branch diff against a target base commit")
  .option("-b, --base <base>", "Base git ref or commit SHA (e.g. origin/main)")
  .option("-H, --head <head>", "Head git ref or commit SHA")
  .option("-f, --format <format>", "Output format (terminal, json, markdown)", "terminal")
  .option("-o, --out <path>", "Write receipt output to specified file path")
  .option("-p, --provider <provider>", "Specify AI provider")
  .option("-m, --model <model>", "Specify AI model")
  .option("-s, --since <duration>", "Harvest agent footprints since duration")
  .option("--today", "Harvest agent footprints for today")
  .option("--platform <platform>", "Filter agent platform")
  .option("--anon", "Anonymize branch name in output")
  .option("--barcode", "Render classic 1D thermal barcode (always on; kept for compatibility)")
  .action(async (options) => {
    try {
      const receipt = await generateReceipt({
        baseSha: options.base,
        headSha: options.head,
        provider: options.provider,
        model: options.model,
        since: resolveSince(options),
        platform: options.platform,
        anonymizeBranch: options.anon,
        isPublic: false
      });

      persistReceipt(receipt);
      await outputReceipt(receipt, options);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Error auditing git range: ${message}`));
      process.exit(1);
    }
  });

program
  .command("share")
  .description("Publish privacy-safe receipt to Qodewk cloud and get a shareable URL")
  .option("-p, --provider <provider>", "Specify AI provider")
  .option("-m, --model <model>", "Specify AI model")
  .option("-s, --since <duration>", "Harvest agent footprints since duration")
  .option("--today", "Harvest agent footprints for today")
  .option("--platform <platform>", "Filter agent platform")
  .option("--anon", "Anonymize branch name in output")
  .option("-f, --format <format>", "Local fallback output format", "terminal")
  .option("-j, --json", "Also print JSON after share")
  .option("--barcode", "Render classic 1D thermal barcode (always on; kept for compatibility)")
  .action(async (options) => {
    try {
      const receipt = await generateReceipt({
        provider: options.provider,
        model: options.model,
        since: resolveSince(options),
        platform: options.platform,
        anonymizeBranch: options.anon,
        isPublic: false
      });

      const localFlag = program.opts().local === true;
      if (process.env.QODEWK_TELEMETRY === "off" || localFlag) {
        console.log(
          pc.yellow(
            `\nCloud publishing is disabled (${localFlag ? "--local" : "QODEWK_TELEMETRY=off"}).`
          )
        );
        console.log(pc.dim("Telemetry remains strictly stored in local SQLite (~/.qodewk/state.db).\n"));
        persistReceipt(receipt);
        await renderTerminalReceipt(receipt);
        return;
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

      if (Buffer.byteLength(body, "utf-8") > SHARE_PAYLOAD_MAX_BYTES) {
        console.error(pc.red("Sanitized receipt still exceeds the 50 KB cloud payload limit."));
        process.exit(1);
      }

      const endpoint =
        process.env.QODEWK_API_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL || process.env.QODEWK_APP_URL || "https://qodewk.flinkeo.online"}/api/receipts`;
      console.log(pc.dim(`Publishing receipt ${sanitized.receipt.id} to ${endpoint}...`));

      try {
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
          throw new Error(`API responded with status ${response.status}${errText ? `: ${errText.slice(0, 200)}` : ""}`);
        }

        const data = (await response.json()) as { url: string; claimToken: string };

        persistReceipt(sanitized, data.claimToken);

        console.log("");
        console.log(pc.green("  Published successfully."));
        console.log(`  ${pc.dim("Public URL:")} ${pc.underline(pc.cyan(data.url))}`);
        console.log(`  ${pc.bold(pc.yellow("  Claim token (store securely — shown once):"))}`);
        console.log(`  ${pc.yellow(data.claimToken)}`);
        console.log(pc.dim("  Saved to ~/.qodewk/state.db — required to prove authorship later."));
        console.log("");

        await renderTerminalReceipt(sanitized, data.url);

        if (options.json) {
          console.log(JSON.stringify({ url: data.url, claimToken: data.claimToken, receipt: sanitized }, null, 2));
        }
      } catch (networkErr: unknown) {
        const message = networkErr instanceof Error ? networkErr.message : String(networkErr);
        console.log(pc.yellow(`\nCould not reach cloud API (${message}). Rendered locally:`));
        persistReceipt(receipt);
        await renderTerminalReceipt(receipt);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Error sharing receipt: ${message}`));
      process.exit(1);
    }
  });

program
  .command("record")
  .alias("record-event")
  .description("Silently record local telemetry receipt into SQLite (used by git hooks)")
  .action(async () => {
    try {
      const receipt = await generateReceipt({ isPublic: false });
      persistReceipt(receipt);
      process.exit(0);
    } catch {
      // Non-blocking, never fail git commit
      process.exit(0);
    }
  });

const hookCommand = program
  .command("hook")
  .aliases(["hooks"])
  .description("Manage non-blocking Git hooks for automatic telemetry recording");

hookCommand
  .command("install")
  .description("Install non-blocking post-commit and post-rewrite Git hooks")
  .action(async () => {
    try {
      const hooksDir = resolveGitHooksDir();
      if (!hooksDir) {
        console.error(pc.red("Error: Current directory is not a Git repository (.git not found)."));
        process.exit(1);
      }

      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      const targets = ["post-commit", "post-rewrite"] as const;
      let installed = 0;
      let existing = 0;

      for (const name of targets) {
        const result = installHookFile(path.join(hooksDir, name));
        if (result === "installed") installed++;
        else existing++;
      }

      if (installed === 0 && existing > 0) {
        console.log(pc.yellow("Qodewk Git hooks are already installed (post-commit, post-rewrite)."));
        return;
      }

      console.log(
        pc.green(
          `✓ Non-blocking Qodewk hooks installed in ${hooksDir} (post-commit${installed > 1 || existing > 0 ? ", post-rewrite" : installed === 1 && targets.length === 2 ? " + post-rewrite" : ""})`
        )
      );
      if (existing > 0) {
        console.log(pc.dim(`  (${existing} hook file(s) already contained the Qodewk marker)`));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Failed to install Git hook: ${message}`));
      process.exit(1);
    }
  });

hookCommand
  .command("uninstall")
  .description("Remove Qodewk post-commit and post-rewrite Git hooks")
  .action(async () => {
    try {
      const hooksDir = resolveGitHooksDir();
      if (!hooksDir) {
        console.log(pc.yellow("No Git repository found."));
        return;
      }

      const targets = ["post-commit", "post-rewrite"] as const;
      let removed = 0;

      for (const name of targets) {
        const result = uninstallHookFile(path.join(hooksDir, name));
        if (result === "removed") removed++;
      }

      if (removed === 0) {
        console.log(pc.yellow("Qodewk hooks are not installed."));
        return;
      }

      console.log(pc.green(`✓ Qodewk hook markers removed from ${removed} file(s).`));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Failed to uninstall hook: ${message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
