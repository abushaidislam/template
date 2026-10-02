import { describe, it, expect } from "vitest";
import { buildMenuFrame, MENU_ITEMS } from "../src/menu.js";
import { checkHookStatus } from "../src/hooks.js";
import { stripAnsi } from "../src/theme.js";
import { execSync } from "node:child_process";
import path from "node:path";

const binPath = path.resolve(__dirname, "../dist/index.cjs");

// Pictographic emojis (e.g. 🧾, 🔍, 🌐, ⚓, ❌, 🚀, etc.)
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{274C}\u{274E}\u{2705}]/u;

describe("Qodewk CLI Menu System (`menu.test.ts`)", () => {
  describe("Menu Items Definition", () => {
    it("defines 6 core menu options with unique keys", () => {
      expect(MENU_ITEMS).toHaveLength(6);
      const keys = MENU_ITEMS.map((item) => item.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(6);
      expect(keys).toEqual(["1", "2", "3", "4", "5", "0"]);
    });

    it("has labels and descriptions for all items without any cheap emojis", () => {
      for (const item of MENU_ITEMS) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(EMOJI_REGEX.test(item.label)).toBe(false);
        expect(EMOJI_REGEX.test(item.description)).toBe(false);
      }
    });
  });

  describe("buildMenuFrame", () => {
    it("renders clean box-drawing borders and editorial header", () => {
      const rendered = buildMenuFrame(0);
      const plain = stripAnsi(rendered);

      expect(plain).toContain("┌");
      expect(plain).toContain("┐");
      expect(plain).toContain("└");
      expect(plain).toContain("┘");
      expect(plain).toContain("Q O D E W K");
      expect(plain).toContain("Telemetry Control Panel");
      expect(plain).toContain("Use ↑ / ↓ to navigate · Enter to select · q to quit");
      expect(plain).toContain("[✓] Source code was never uploaded to Qodewk");
    });

    it("ensures every non-empty line has consistent exact width (no overflows)", () => {
      for (let i = 0; i < MENU_ITEMS.length; i++) {
        const frame = buildMenuFrame(i);
        const lines = frame.split("\n").filter((l) => l.trim().length > 0);
        for (const line of lines) {
          const plain = stripAnsi(line);
          expect(plain.length).toBe(64);
        }
      }
    });

    it("does NOT contain any cheap/tacky emojis in the rendered terminal output", () => {
      for (let i = 0; i < MENU_ITEMS.length; i++) {
        const frame = buildMenuFrame(i);
        const plain = stripAnsi(frame);
        expect(EMOJI_REGEX.test(plain)).toBe(false);
      }
    });

    it("highlights pointer `›` on the currently selected item", () => {
      // Selected index 0 -> [1] Generate Local Receipt
      const frame0 = stripAnsi(buildMenuFrame(0));
      expect(frame0).toContain("› [1] Generate Local Receipt");
      expect(frame0).not.toContain("› [2] Audit Branch or Revision Range");

      // Selected index 1 -> [2] Audit Branch or Revision Range
      const frame1 = stripAnsi(buildMenuFrame(1));
      expect(frame1).toContain("› [2] Audit Branch or Revision Range");
      expect(frame1).not.toContain("› [1] Generate Local Receipt");

      // Selected index 5 -> [0] Exit
      const frame5 = stripAnsi(buildMenuFrame(5));
      expect(frame5).toContain("› [0] Exit");
      expect(frame5).not.toContain("› [5] Database & Storage Status");
    });
  });

  describe("Hooks Inspector (`hooks.ts`)", () => {
    it("reports hook status cleanly for null or invalid directories", () => {
      const status = checkHookStatus(null);
      expect(status.isGit).toBe(false);
      expect(status.hooksDir).toBeNull();
      expect(status.postCommitInstalled).toBe(false);
      expect(status.postRewriteInstalled).toBe(false);
    });
  });

  describe("CLI Command Integration", { timeout: 15000 }, () => {
    it("exposes `menu` command and `-i, --interactive` option in --help", () => {
      const help = execSync(`node "${binPath}" --help`, { encoding: "utf-8" });
      expect(help).toContain("menu");
      expect(help).toContain("-i, --interactive");
    });
  });
});
