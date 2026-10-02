import * as fs from "node:fs";
import pc from "picocolors";
import { ReceiptV1 } from "@qodewk/protocol";
import { formatMarkdownReceipt } from "@qodewk/core";
import { pickBarcodePayload, renderTerminalBarcode } from "./barcode.js";
import { colors, visibleWidth, stripAnsi } from "./theme.js";

export type OutputOptions = {
  json?: boolean;
  format?: string;
  out?: string;
  barcode?: boolean;
};

export function buildTerminalReceipt(receipt: ReceiptV1, publicUrl?: string): string {
  const lines: string[] = [];
  const coral = colors.coral;
  const green = colors.green;
  const red = colors.red;
  const teal = colors.teal;
  const INNER_WIDTH = 52;

  const push = (line: string) => lines.push(line);

  const printRow = (content: string, width = INNER_WIDTH) => {
    const visLen = visibleWidth(content);
    const pad = Math.max(0, width - visLen);
    push(`  | ${content}${" ".repeat(pad)} |`);
  };

  const printRowSplit = (left: string, right: string, width = INNER_WIDTH) => {
    const leftVis = visibleWidth(left);
    const rightVis = visibleWidth(right);
    const pad = Math.max(1, width - leftVis - rightVis);
    push(`  | ${left}${" ".repeat(pad)}${right} |`);
  };

  const printCenteredRow = (content: string, width = INNER_WIDTH) => {
    const visLen = visibleWidth(content);
    const totalPad = Math.max(0, width - visLen);
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;
    push(`  | ${" ".repeat(leftPad)}${content}${" ".repeat(rightPad)} |`);
  };

  const printDivider = (char = "=", width = INNER_WIDTH) => {
    push(`  | ${char.repeat(width)} |`);
  };

  const totalTokens = (receipt.ai.tokens.input + receipt.ai.tokens.output).toLocaleString();
  const inputK = `${Math.round(receipt.ai.tokens.input / 1000)}k`;
  const outputK = `${Math.round(receipt.ai.tokens.output / 1000)}k`;
  const costPrefix = receipt.ai.mode === "verified" ? "$" : "~$";
  const confidencePercent = `${Math.round(receipt.ai.confidence * 100)}%`;

  push("");
  push("  " + pc.bold(coral("/\\".repeat(28))));
  printCenteredRow(pc.bold(pc.white("Q O D E W K")));
  printCenteredRow(coral("*** PROOF OF SHIPMENT ***"));
  printRow("");
  printRowSplit(
    `ID:   ${receipt.receipt.id.slice(0, 24)}`,
    `DATE: ${receipt.receipt.createdAt.slice(0, 10)}`
  );
  printRowSplit(
    `REPO: ${receipt.repository.projectAlias.slice(0, 18)}`,
    `BRANCH: ${receipt.repository.branch.slice(0, 16)}`
  );
  if (receipt.ai.task) {
    const taskClean = receipt.ai.task.length > 44 ? receipt.ai.task.slice(0, 43) + "…" : receipt.ai.task;
    printRow(`TASK: ${taskClean}`);
  }
  printDivider("=");
  const itemsHeader =
    receipt.repository.commitsCount && receipt.repository.commitsCount > 1
      ? `ITEMS CHANGED (${receipt.repository.commitsCount} COMMITS)`
      : "ITEMS CHANGED";
  printRowSplit(itemsHeader, "QTY");
  printDivider("-");
  printRowSplit("Files Touched", String(receipt.mutation.files));
  printRowSplit("Lines Inserted", green("+ " + receipt.mutation.insertions));
  printRowSplit("Lines Deleted", red("- " + receipt.mutation.deletions));
  printRowSplit(
    "Net Code Delta",
    teal((receipt.mutation.netLines >= 0 ? "+ " : "- ") + Math.abs(receipt.mutation.netLines))
  );
  printDivider("-");
  printRow("AI TELEMETRY & ATTRIBUTION");
  const provString = receipt.ai.provider + " · " + (receipt.ai.model || "Unknown");
  const cleanProv = provString.length > 40 ? provString.slice(0, 39) + "…" : provString;
  printRow(`Provider: ${cleanProv}`);
  if (receipt.ai.sessions && receipt.ai.sessions.length > 1) {
    const others = receipt.ai.sessions
      .slice(1)
      .map((s) => s.provider)
      .filter((p, i, arr) => arr.indexOf(p) === i && p !== receipt.ai.provider);
    if (others.length > 0) {
      printRow(pc.dim(`Also seen: ${others.join(", ")}`));
    }
  }
  if (receipt.ai.aiWrittenRatio !== undefined) {
    const aiPct = Math.round(receipt.ai.aiWrittenRatio * 100);
    printRowSplit("AI Written Code", `${aiPct}% (Human: ${100 - aiPct}%)`);
  }
  const tokenDetail = `${inputK} in (${Math.round(receipt.ai.tokens.cached / 1000)}k cached) / ${outputK} out`;
  const cleanTokens = tokenDetail.length > 40 ? tokenDetail.slice(0, 39) + "…" : tokenDetail;
  printRow(`Tokens:   ${cleanTokens}`);
  printRowSplit("Total Tokens:", totalTokens);
  printDivider("=");
  const costLabel = receipt.ai.mode === "verified" ? "VERIFIED AI COST" : "ESTIMATED AI COST";
  printRowSplit(costLabel, pc.bold(coral(costPrefix + receipt.ai.cost.toFixed(2))));
  printRowSplit(`CONFIDENCE: ${confidencePercent}`, `[Mode: ${receipt.ai.mode}]`);
  printDivider("=");
  printRow("");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.QODEWK_APP_URL || "https://qodewk.flinkeo.online";
  const isPublished = Boolean(publicUrl);
  const displayHost = baseUrl.replace(/^https?:\/\//, "");

  const barcodePayload = pickBarcodePayload({
    publicUrl,
    receiptId: receipt.receipt.id,
    displayHost,
    maxChars: 28
  });
  const barcodeRows = renderTerminalBarcode(barcodePayload, {
    maxWidth: INNER_WIDTH,
    height: 3,
    quietZone: 8
  });
  for (const barRow of barcodeRows) {
    printCenteredRow(pc.bold(barRow));
  }

  if (isPublished) {
    printCenteredRow(pc.cyan(displayHost));
    printCenteredRow(pc.underline(pc.cyan(`r/${receipt.receipt.id}`)));
  } else {
    printCenteredRow(pc.yellow("[ LOCAL RECORD — NOT PUBLISHED ]"));
  }
  printRow("");
  if (process.env.QODEWK_TELEMETRY === "off") {
    printRow(`  ${teal("[✓]")} QODEWK_TELEMETRY=off (Cloud sync disabled)`);
  }
  printRow(`  ${green("[✓]")} Source code was never uploaded to Qodewk`);
  push("  " + pc.bold(coral("\\/".repeat(28))));
  push("");

  if (isPublished && publicUrl) {
    push(`  ${pc.dim("Public Receipt:")} ${pc.underline(pc.cyan(publicUrl))}`);
  } else {
    push(`  ${pc.dim("Saved to local DB:")} ${pc.dim("~/.qodewk/state.db")}`);
    push(`  ${pc.dim("To publish & get shareable URL:")} ${pc.cyan("qodewk share")}`);
    push(`  ${pc.dim("Interactive menu:")} ${pc.cyan("qodewk menu")}`);
  }

  push("");

  return lines.join("\n");
}

export async function renderTerminalReceipt(receipt: ReceiptV1, publicUrl?: string): Promise<void> {
  console.log(buildTerminalReceipt(receipt, publicUrl));
}

export async function outputReceipt(
  receipt: ReceiptV1,
  options: OutputOptions,
  publicUrl?: string
): Promise<void> {
  const format = options.json ? "json" : options.format || "terminal";

  let content: string;
  if (format === "json") {
    content = JSON.stringify(receipt, null, 2);
  } else if (format === "markdown") {
    content = formatMarkdownReceipt(receipt, publicUrl);
  } else {
    content = buildTerminalReceipt(receipt, publicUrl);
  }

  if (options.out) {
    const fileContent = format === "terminal" ? stripAnsi(content) : content;
    fs.writeFileSync(options.out, fileContent.endsWith("\n") ? fileContent : fileContent + "\n", "utf-8");
    console.log(pc.green(`✓ Receipt written to ${options.out}`));
  }

  if (!options.out) {
    if (format === "terminal") {
      console.log(content);
    } else {
      console.log(content);
    }
  }
}
