/**
 * Code 128-B encoder + terminal thermal barcode renderer.
 * Patterns are the standard 11-module Code 128 set (bars=1, spaces=0).
 */

const CODE128_PATTERNS: readonly string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
  "11010011100", "1100011101011"
];

const START_B = 104;
const STOP = 106;

function encodeCode128B(text: string): number[] {
  const codes: number[] = [START_B];
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 32;
    if (code < 0 || code > 95) {
      throw new Error(`Code 128-B cannot encode character: ${JSON.stringify(ch)}`);
    }
    codes.push(code);
  }
  let checksum = START_B;
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i]! * i;
  }
  codes.push(checksum % 103);
  codes.push(STOP);
  return codes;
}

/** Expand Code 128 symbol codes into a binary module string (1=bar, 0=space). */
export function code128Modules(text: string): string {
  const codes = encodeCode128B(text);
  let modules = "";
  for (const code of codes) {
    modules += CODE128_PATTERNS[code] ?? "";
  }
  return modules;
}

export type TerminalBarcodeOptions = {
  /** Max visible columns for the bar row (quiet zones included). */
  maxWidth?: number;
  /** Number of stacked rows for thermal height. */
  height?: number;
  /** Quiet-zone module count on each side (before scaling). */
  quietZone?: number;
};

/**
 * Render a thermal-style Code 128 barcode as stacked Unicode block rows.
 * When the true module width exceeds maxWidth, modules are downsampled so the
 * bars still derive from a real Code 128 bitstream (receipt aesthetic first).
 */
export function renderTerminalBarcode(
  text: string,
  options: TerminalBarcodeOptions = {}
): string[] {
  const maxWidth = Math.max(16, options.maxWidth ?? 52);
  const height = Math.max(2, options.height ?? 3);
  const quietZone = Math.max(0, options.quietZone ?? 10);

  let payload = text;
  // Prefer printable ASCII that Code 128-B accepts; strip anything else.
  payload = [...payload].filter((ch) => {
    const c = ch.charCodeAt(0);
    return c >= 32 && c <= 126;
  }).join("");
  if (!payload) payload = "QODEWK";

  let modules: string;
  try {
    modules = code128Modules(payload);
  } catch {
    modules = code128Modules("QODEWK");
  }

  const withQuiet = "0".repeat(quietZone) + modules + "0".repeat(quietZone);
  // 1 module → 1 column (█ or space) for classic thermal bar look.
  const scaled = downsampleModules(withQuiet, maxWidth);
  const row = modulesToBlocks(scaled);
  return Array.from({ length: height }, () => row);
}

function downsampleModules(modules: string, maxWidth: number): string {
  if (modules.length <= maxWidth) return modules;
  const out: string[] = [];
  const ratio = modules.length / maxWidth;
  for (let i = 0; i < maxWidth; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let bars = 0;
    for (let j = start; j < end && j < modules.length; j++) {
      if (modules[j] === "1") bars++;
    }
    out.push(bars * 2 >= end - start ? "1" : "0");
  }
  return out.join("");
}

function modulesToBlocks(modules: string): string {
  let out = "";
  for (const bit of modules) {
    out += bit === "1" ? "█" : " ";
  }
  return out;
}

/**
 * Choose the shortest useful Code 128 payload for a receipt.
 * Prefers public URL when it fits; otherwise host path or bare id.
 */
export function pickBarcodePayload(input: {
  publicUrl?: string;
  receiptId: string;
  displayHost?: string;
  maxChars?: number;
}): string {
  const maxChars = input.maxChars ?? 24;
  const candidates: string[] = [];
  if (input.publicUrl) candidates.push(input.publicUrl);
  if (input.displayHost && input.receiptId) {
    candidates.push(`${input.displayHost}/r/${input.receiptId}`);
  }
  candidates.push(input.receiptId);
  // Short hex-ish tail often still unique enough for visual / local scan tools.
  if (input.receiptId.length > 12) {
    candidates.push(input.receiptId.replace(/^rec_/, "").slice(0, 12));
  }

  for (const c of candidates) {
    if (c.length <= maxChars) return c;
  }
  return candidates[candidates.length - 1]!.slice(0, maxChars);
}
