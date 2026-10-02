import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

describe("qodewk CLI smoke", () => {
  it("dist binary exists after build", () => {
    const binPath = path.resolve(__dirname, "../dist/index.cjs");
    expect(fs.existsSync(binPath)).toBe(true);
  });

  it("prints help and version", () => {
    const binPath = path.resolve(__dirname, "../dist/index.cjs");
    const helpOut = execSync(`node "${binPath}" --help`, { encoding: "utf-8" });
    expect(helpOut).toContain("Universal telemetry and digital receipt generator");

    const versionOut = execSync(`node "${binPath}" --version`, { encoding: "utf-8" });
    expect(versionOut.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("exposes hooks alias and record-event alias in help", () => {
    const binPath = path.resolve(__dirname, "../dist/index.cjs");
    const helpOut = execSync(`node "${binPath}" --help`, { encoding: "utf-8" });
    expect(helpOut).toContain("hook");
    expect(helpOut).toContain("record");
  });

  it("audit command exposes -H for head ref without colliding with help", () => {
    const binPath = path.resolve(__dirname, "../dist/index.cjs");
    const auditHelp = execSync(`node "${binPath}" audit --help`, { encoding: "utf-8" });
    expect(auditHelp).toContain("-H, --head");
    expect(auditHelp).toContain("-b, --base");
  });
});
