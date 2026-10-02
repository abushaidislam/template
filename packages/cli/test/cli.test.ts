import { describe, it, expect } from "vitest";
import { code128Modules, renderTerminalBarcode, pickBarcodePayload } from "../src/barcode.js";

describe("qodewk CLI", () => {
  describe("Barcode Encoder (`barcode.ts`)", () => {
    it("encodes valid Code 128-B printable ASCII characters to binary bitstream", () => {
      const modules = code128Modules("QODEWK-123");
      expect(typeof modules).toBe("string");
      expect(modules.length).toBeGreaterThan(0);
      expect(/^[01]+$/.test(modules)).toBe(true);
    });

    it("throws error for unsupported non-ASCII characters", () => {
      expect(() => code128Modules("QODEWK-🔥")).toThrow(/Code 128-B cannot encode character/);
    });

    it("renders terminal barcode rows with requested width, height, and quiet zones", () => {
      const rows = renderTerminalBarcode("rec_123456789012345678901234", {
        maxWidth: 40,
        height: 3,
        quietZone: 5
      });

      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(typeof row).toBe("string");
        expect(row.length).toBeLessThanOrEqual(40);
        expect(row).toContain("█");
      }
    });

    it("pickBarcodePayload prioritizes public URL if within maxChars or falls back to receipt ID", () => {
      const shortUrlPayload = pickBarcodePayload({
        publicUrl: "https://qod.wk/r/123",
        receiptId: "rec_123456789012345678901234",
        maxChars: 30
      });
      expect(shortUrlPayload).toBe("https://qod.wk/r/123");

      const longUrlPayload = pickBarcodePayload({
        publicUrl: "https://very-long-domain-name-qodewk.flinkeo.online/receipt/rec_123456789012345678901234",
        receiptId: "rec_123456789012345678901234",
        maxChars: 28
      });
      expect(longUrlPayload.length).toBeLessThanOrEqual(28);
    });
  });
});
