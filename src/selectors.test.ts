import { describe, it, expect, beforeEach } from "bun:test";
import { siblingSelector, buildLevels } from "./selectors";

function el(
  tag: string,
  classes: string[] = [],
  children: HTMLElement[] = [],
): HTMLElement {
  const e = document.createElement(tag);
  for (const c of classes) e.classList.add(c);
  for (const ch of children) e.appendChild(ch);
  return e;
}

describe("siblingSelector", () => {
  describe("given element with no parent", () => {
    it("then returns tag name", () => {
      const orphan = el("div");
      expect(siblingSelector(orphan)).toBe("div");
    });
  });

  describe("given element with no same-tag siblings", () => {
    it("then returns tag name only", () => {
      const child = el("h1", ["title", "main-title"]);
      el("div", [], [child, el("p")]);
      expect(siblingSelector(child)).toBe("h1");
    });
  });

  describe("given multiple same-tag siblings with shared classes", () => {
    it("then returns tag with shared classes only", () => {
      const a = el("div", ["card", "featured"]);
      const b = el("div", ["card", "regular"]);
      const c = el("div", ["card", "regular"]);
      el("section", [], [a, b, c]);

      expect(siblingSelector(a)).toBe("div.card");
      expect(siblingSelector(b)).toBe("div.card");
    });
  });

  describe("given multiple same-tag siblings with no shared classes", () => {
    it("then returns tag name", () => {
      const a = el("div", ["alpha"]);
      const b = el("div", ["beta"]);
      el("section", [], [a, b]);

      expect(siblingSelector(a)).toBe("div");
    });
  });

  describe("given multiple same-tag siblings with all classes shared", () => {
    it("then returns tag with all classes", () => {
      const a = el("li", ["item", "row"]);
      const b = el("li", ["item", "row"]);
      el("ul", [], [a, b]);

      expect(siblingSelector(a)).toBe("li.item.row");
    });
  });

  describe("given sibling has extra classes beyond shared", () => {
    it("then only shared classes appear in selector", () => {
      const a = el("div", ["card", "card-lg", "promo"]);
      const b = el("div", ["card", "card-sm"]);
      const c = el("div", ["card", "card-md"]);
      el("main", [], [a, b, c]);

      expect(siblingSelector(a)).toBe("div.card");
    });
  });

  describe("given elements with no classes", () => {
    it("then returns tag name", () => {
      const a = el("span");
      const b = el("span");
      el("p", [], [a, b]);

      expect(siblingSelector(a)).toBe("span");
    });
  });
});

describe("buildLevels", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("given element with no repeating siblings at any level", () => {
    it("then returns empty array", () => {
      const inner = el("span");
      const wrapper = el("div", [], [inner]);
      document.body.appendChild(wrapper);

      expect(buildLevels(inner)).toEqual([]);
    });
  });

  describe("given element with repeating siblings at its level", () => {
    it("then returns one level with correct count", () => {
      const target = el("li", ["item"]);
      const sibling = el("li", ["item"]);
      const list = el("ul", [], [target, sibling]);
      document.body.appendChild(list);

      const levels = buildLevels(target);
      expect(levels).toHaveLength(1);
      expect(levels[0].selector).toBe("li.item");
      expect(levels[0].count).toBe(2);
      expect(levels[0].anchor).toBe(target);
    });
  });

  describe("given repeating siblings at multiple levels", () => {
    it("then returns multiple levels from inner to outer", () => {
      const link = el("a", ["link"]);
      const card1 = el("div", ["card"], [link]);
      const card2 = el("div", ["card"]);
      const card3 = el("div", ["card"]);
      const col1 = el("div", ["col"], [card1, card2]);
      const col2 = el("div", ["col"], [card3]);
      const row = el("div", ["row"], [col1, col2]);
      document.body.appendChild(row);

      const levels = buildLevels(link);

      // link has no siblings → skipped
      // card has 2 siblings (card1, card2) → level
      // col has 2 siblings (col1, col2) → level
      expect(levels.length).toBeGreaterThanOrEqual(2);
      expect(levels[0].selector).toBe("div.card");
      expect(levels[0].count).toBe(2);
      expect(levels[1].selector).toBe("div.col");
      expect(levels[1].count).toBe(2);
    });
  });

  describe("given duplicate selectors at different levels", () => {
    it("then deduplicates by selector string", () => {
      const inner = el("div", ["box"]);
      const mid1 = el("div", ["box"], [inner]);
      const mid2 = el("div", ["box"]);
      const outer1 = el("div", ["box"], [mid1, mid2]);
      const outer2 = el("div", ["box"]);
      const root = el("section", [], [outer1, outer2]);
      document.body.appendChild(root);

      const levels = buildLevels(inner);
      const selectors = levels.map((l) => l.selector);
      // all have same selector "div.box" — should appear only once
      expect(new Set(selectors).size).toBe(selectors.length);
    });
  });

  describe("given element is direct child of body", () => {
    it("then returns empty (body is excluded)", () => {
      const child = el("div");
      document.body.appendChild(child);

      expect(buildLevels(child)).toEqual([]);
    });
  });

  describe("given element where only some classes are shared", () => {
    it("then selector uses only shared classes", () => {
      const target = el("div", ["card", "featured"]);
      const sib1 = el("div", ["card", "regular"]);
      const sib2 = el("div", ["card", "compact"]);
      const parent = el("section", [], [target, sib1, sib2]);
      document.body.appendChild(parent);

      const levels = buildLevels(target);
      expect(levels).toHaveLength(1);
      expect(levels[0].selector).toBe("div.card");
      expect(levels[0].count).toBe(3);
    });
  });
});
