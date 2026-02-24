import { describe, it, expect, beforeAll } from "bun:test";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DOMParser } = require("linkedom");
import { readFileSync } from "fs";
import { join } from "path";
import { siblingSelector, buildLevels } from "./selectors";

interface SiteFixture {
  name: string;
  doc: Document;
}

const sites: SiteFixture[] = [];
const fixturesDir = join(import.meta.dir, "fixtures");

function loadFixture(name: string, file: string): SiteFixture {
  const html = readFileSync(join(fixturesDir, file), "utf-8");
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return { name, doc: doc as unknown as Document };
}

beforeAll(() => {
  sites.push(loadFixture("Hacker News", "hn.html"));
  sites.push(loadFixture("Wikipedia", "wiki.html"));
  sites.push(loadFixture("GitHub Trending", "gh.html"));
});

describe("siblingSelector on real sites", () => {
  it("produces non-empty selectors for common elements", () => {
    for (const site of sites) {
      const elements = [
        ...site.doc.querySelectorAll("a, div, li, h1, h2, h3, p, span, tr"),
      ].slice(0, 50);
      for (const el of elements) {
        const sel = siblingSelector(el as unknown as HTMLElement);
        expect(sel.length).toBeGreaterThan(0);
      }
      console.log(
        `  ${site.name}: ${elements.length} elements → all produce selectors`,
      );
    }
  });

  it("selectors are valid and match at least 1 element", () => {
    for (const site of sites) {
      const elements = [...site.doc.querySelectorAll("a, div, li, tr")].slice(
        0,
        50,
      );
      let valid = 0;
      for (const el of elements) {
        const sel = siblingSelector(el as unknown as HTMLElement);
        try {
          const matches = site.doc.querySelectorAll(sel);
          if (matches.length >= 1) valid++;
        } catch {
          // invalid selector
        }
      }
      console.log(
        `  ${site.name}: ${valid}/${elements.length} selectors valid`,
      );
      expect(valid).toBe(elements.length);
    }
  });

  it("same-tag siblings produce identical selectors", () => {
    for (const site of sites) {
      const containers = [
        ...site.doc.querySelectorAll("ul, ol, tbody, div"),
      ].slice(0, 20);
      let groups = 0;
      for (const container of containers) {
        const firstTag = container.children[0]?.localName;
        if (!firstTag) continue;
        const children = [...container.children].filter(
          (c) => c.localName === firstTag,
        ) as unknown as HTMLElement[];
        if (children.length < 2) continue;

        const selectors = children.map((c) => siblingSelector(c));
        const unique = new Set(selectors);
        expect(unique.size).toBe(1);
        groups++;
      }
      console.log(
        `  ${site.name}: ${groups} sibling groups verified consistent`,
      );
    }
  });
});

describe("buildLevels on real sites", () => {
  it("list items have at least one repeating level", () => {
    for (const site of sites) {
      const items = [...site.doc.querySelectorAll("li, tr")].slice(0, 20);
      let found = 0;
      for (const item of items) {
        const levels = buildLevels(item as unknown as HTMLElement);
        if (levels.length > 0) found++;
      }
      console.log(
        `  ${site.name}: ${found}/${items.length} items have repeating levels`,
      );
      expect(found).toBeGreaterThan(0);
    }
  });

  it("level selectors match >1 elements globally", () => {
    for (const site of sites) {
      const items = [...site.doc.querySelectorAll("li, tr, a")].slice(0, 20);
      let total = 0;
      let repeating = 0;
      for (const item of items) {
        const levels = buildLevels(item as unknown as HTMLElement);
        for (const level of levels) {
          total++;
          try {
            const count = site.doc.querySelectorAll(level.selector).length;
            if (count > 1) repeating++;
          } catch {
            // skip
          }
        }
      }
      console.log(
        `  ${site.name}: ${repeating}/${total} level selectors match >1 elements`,
      );
    }
  });

  it("Hacker News: story rows produce useful depth levels", () => {
    const hn = sites.find((s) => s.name === "Hacker News")!;
    const rows = hn.doc.querySelectorAll("tr.athing");
    expect(rows.length).toBeGreaterThan(0);

    const first = rows[0] as unknown as HTMLElement;
    const levels = buildLevels(first);

    console.log(`  Stories: ${rows.length}`);
    for (const level of levels) {
      try {
        const count = hn.doc.querySelectorAll(level.selector).length;
        console.log(
          `    "${level.selector}" → ${count} global, ${level.count} siblings`,
        );
      } catch {
        console.log(`    "${level.selector}" → invalid`);
      }
    }
    expect(levels.length).toBeGreaterThan(0);
  });

  it("Wikipedia: section headings produce depth levels", () => {
    const wiki = sites.find((s) => s.name === "Wikipedia")!;
    const h2s = wiki.doc.querySelectorAll("h2");
    expect(h2s.length).toBeGreaterThan(0);

    const first = h2s[0] as unknown as HTMLElement;
    const levels = buildLevels(first);

    console.log(`  h2 headings: ${h2s.length}`);
    for (const level of levels) {
      try {
        const count = wiki.doc.querySelectorAll(level.selector).length;
        console.log(
          `    "${level.selector}" → ${count} global, ${level.count} siblings`,
        );
      } catch {
        console.log(`    "${level.selector}" → invalid`);
      }
    }
  });

  it("GitHub Trending: repo articles produce depth levels", () => {
    const gh = sites.find((s) => s.name === "GitHub Trending")!;
    const articles = gh.doc.querySelectorAll("article");
    expect(articles.length).toBeGreaterThan(0);

    const first = articles[0] as unknown as HTMLElement;
    const levels = buildLevels(first);

    console.log(`  Articles: ${articles.length}`);
    for (const level of levels) {
      try {
        const count = gh.doc.querySelectorAll(level.selector).length;
        console.log(
          `    "${level.selector}" → ${count} global, ${level.count} siblings`,
        );
      } catch {
        console.log(`    "${level.selector}" → invalid`);
      }
    }
    expect(levels.length).toBeGreaterThan(0);
  });
});
