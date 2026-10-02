import { describe, it, expect } from "vitest";
import {
  parseSinceOption,
  harvestAntigravityFootprints,
  harvestClaudeFootprints,
  harvestCursorFootprints,
  harvestUniversalFootprints
} from "../src/harvester/index.js";
import path from "node:path";
import os from "node:os";

describe("Universal Agent Footprint Harvesters (`harvester/`)", () => {
  describe("parseSinceOption", () => {
    it("returns undefined for undefined or empty input", () => {
      expect(parseSinceOption(undefined)).toBeUndefined();
      expect(parseSinceOption("")).toBeUndefined();
    });

    it("parses 'today' into midnight of current day", () => {
      const parsed = parseSinceOption("today");
      expect(parsed).toBeInstanceOf(Date);
      const now = new Date();
      expect(parsed?.getFullYear()).toBe(now.getFullYear());
      expect(parsed?.getMonth()).toBe(now.getMonth());
      expect(parsed?.getDate()).toBe(now.getDate());
      expect(parsed?.getHours()).toBe(0);
      expect(parsed?.getMinutes()).toBe(0);
    });

    it("parses hour relative durations like '24h' and '12hours'", () => {
      const parsed24 = parseSinceOption("24h");
      expect(parsed24).toBeInstanceOf(Date);
      const diffHours24 = (Date.now() - parsed24!.getTime()) / (1000 * 60 * 60);
      expect(Math.round(diffHours24)).toBe(24);

      const parsed12 = parseSinceOption("12hours");
      expect(parsed12).toBeInstanceOf(Date);
      const diffHours12 = (Date.now() - parsed12!.getTime()) / (1000 * 60 * 60);
      expect(Math.round(diffHours12)).toBe(12);
    });

    it("parses day relative durations like '7d' and '3days'", () => {
      const parsed7 = parseSinceOption("7d");
      expect(parsed7).toBeInstanceOf(Date);
      const diffDays7 = (Date.now() - parsed7!.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays7)).toBe(7);
    });

    it("parses exact ISO date strings", () => {
      const iso = "2026-05-15T10:30:00.000Z";
      const parsed = parseSinceOption(iso);
      expect(parsed?.toISOString()).toBe(iso);
    });

    it("returns undefined for malformed strings", () => {
      expect(parseSinceOption("not-a-valid-date-duration")).toBeUndefined();
    });
  });

  describe("Fail-Safe Harvesting (Non-existent / Missing paths)", () => {
    const nonExistentPath = path.join(os.tmpdir(), "qodewk-non-existent-test-repo-99999");

    it("harvestAntigravityFootprints returns empty array on invalid/missing path without throwing", () => {
      expect(() => {
        const fps = harvestAntigravityFootprints(nonExistentPath);
        expect(Array.isArray(fps)).toBe(true);
      }).not.toThrow();
    });

    it("harvestClaudeFootprints returns empty array on invalid/missing path without throwing", () => {
      expect(() => {
        const fps = harvestClaudeFootprints(nonExistentPath, "non-existent-alias");
        expect(Array.isArray(fps)).toBe(true);
      }).not.toThrow();
    });

    it("harvestCursorFootprints returns empty array on invalid/missing path without throwing", () => {
      expect(() => {
        const fps = harvestCursorFootprints(nonExistentPath);
        expect(Array.isArray(fps)).toBe(true);
      }).not.toThrow();
    });
  });

  describe("harvestUniversalFootprints", () => {
    it("aggregates footprints into a structured UniversalHarvestResult", async () => {
      const result = await harvestUniversalFootprints({
        repoPath: process.cwd(),
        projectAlias: "qodewk"
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.footprints)).toBe(true);
      expect(Array.isArray(result.platforms)).toBe(true);
      expect(Array.isArray(result.models)).toBe(true);
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(Array.isArray(result.filesEdited)).toBe(true);
      expect(result.totalTokens).toHaveProperty("input");
      expect(result.totalTokens).toHaveProperty("output");
      expect(result.totalTokens).toHaveProperty("cached");
      expect(typeof result.totalCost).toBe("number");
      expect(["verified", "imported", "observed", "estimated", "unknown"]).toContain(result.mode);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("respects platform filtering flag", async () => {
      const result = await harvestUniversalFootprints({
        repoPath: process.cwd(),
        platform: "claude"
      });

      expect(result.platforms.every((p) => p === "claude" || p === "anthropic")).toBe(true);
    });
  });
});
