import { describe, it, expect } from "bun:test";
import { generateLabels } from "./hints";

describe("generateLabels", () => {
  describe("given zero elements", () => {
    it("then returns empty array", () => {
      expect(generateLabels(0)).toEqual([]);
    });
  });

  describe("given count within single-char range", () => {
    it("then returns single-character labels", () => {
      const labels = generateLabels(5);
      expect(labels).toHaveLength(5);
      for (const l of labels) {
        expect(l).toHaveLength(1);
      }
    });

    it("then all labels are unique", () => {
      const labels = generateLabels(14);
      expect(new Set(labels).size).toBe(14);
    });

    it("then labels use the alphabet characters", () => {
      const alphabet = "sadfjklewcmpgh";
      const labels = generateLabels(14);
      for (const l of labels) {
        expect(alphabet).toContain(l);
      }
    });
  });

  describe("given count exceeding single-char capacity", () => {
    it("then returns two-character labels", () => {
      const labels = generateLabels(15);
      expect(labels).toHaveLength(15);
      for (const l of labels) {
        expect(l).toHaveLength(2);
      }
    });

    it("then all labels are unique", () => {
      const labels = generateLabels(100);
      expect(new Set(labels).size).toBe(100);
    });
  });

  describe("given count exceeding two-char capacity", () => {
    it("then returns three-character labels", () => {
      // 14^2 = 196, so 197 needs 3 chars
      const labels = generateLabels(197);
      expect(labels).toHaveLength(197);
      for (const l of labels) {
        expect(l).toHaveLength(3);
      }
    });
  });

  describe("given count of one", () => {
    it("then returns single label", () => {
      const labels = generateLabels(1);
      expect(labels).toHaveLength(1);
      expect(labels[0]).toHaveLength(1);
    });
  });
});
