import { describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { JSDOM } from "jsdom";

const fixturesDir = join(import.meta.dir, "fixtures");

// Create ONE jsdom that lives for all tests.
// content.ts binds its keydown listener to `document` on import,
// so we must keep the same document reference.
const dom = new JSDOM(
  "<!doctype html><html><head></head><body></body></html>",
  {
    url: "https://example.com/test",
    pretendToBeVisual: true,
  },
);
const win = dom.window as unknown as Window & typeof globalThis;
const doc = win.document;

// Patch getComputedStyle to return sane defaults
const origGCS = win.getComputedStyle.bind(win);
win.getComputedStyle = ((el: Element) => {
  const s = origGCS(el);
  return new Proxy(s, {
    get(target, prop) {
      if (prop === "display") return target.display || "block";
      if (prop === "visibility") return target.visibility || "visible";
      if (prop === "opacity") return target.opacity || "1";
      return (target as unknown as Record<string | symbol, unknown>)[prop];
    },
  });
}) as typeof win.getComputedStyle;

win.HTMLElement.prototype.scrollIntoView = () => {};
(win as unknown as Record<string, unknown>).browser = {
  runtime: { onMessage: { addListener: () => {} } },
};

// jsdom lacks CSS.escape — polyfill
if (!(win as Record<string, unknown>).CSS)
  (win as Record<string, unknown>).CSS = {} as typeof CSS;
if (!(win.CSS as Record<string, unknown>).escape) {
  (win.CSS as Record<string, unknown>).escape = (s: string) =>
    s.replace(/([^\w-])/g, "\\$1");
}

// Install jsdom globals so content.ts binds to them
const globalKeys = [
  "window",
  "document",
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLButtonElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "Element",
  "Node",
  "CSS",
  "CSSStyleDeclaration",
  "getComputedStyle",
  "DOMRect",
  "KeyboardEvent",
  "MouseEvent",
  "Event",
  "URL",
  "location",
  "browser",
  "navigator",
];
for (const k of globalKeys) {
  Object.defineProperty(globalThis, k, {
    value: (win as unknown as Record<string, unknown>)[k],
    configurable: true,
    writable: true,
  });
}

// Import content.ts ONCE — it registers its keydown listener on `document`
beforeAll(async () => {
  await import("./content.ts");
});

// --- helpers ---

function press(key: string, opts: KeyboardEventInit = {}): void {
  doc.dispatchEvent(
    new win.KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    }),
  );
}

function pressCtrlShift(key: string): void {
  press(key, { ctrlKey: true, shiftKey: true });
}

function typeSeq(label: string): void {
  for (const ch of label) press(ch);
}

function hintOverlays(): HTMLElement[] {
  return [...doc.querySelectorAll<HTMLElement>("div")].filter(
    (d) => d.style.position === "absolute" && d.style.zIndex === "2147483647",
  );
}

function visibleHintLabels(): string[] {
  return hintOverlays()
    .filter((h) => h.style.display !== "none")
    .map((h) => h.textContent ?? "");
}

function selectorBar(): HTMLElement | null {
  return (
    [...doc.querySelectorAll<HTMLElement>("div")].find(
      (d) => d.style.position === "fixed" && d.style.bottom === "24px",
    ) ?? null
  );
}

function highlightedElement(): HTMLElement | null {
  return (
    [...doc.querySelectorAll<HTMLElement>("*")].find(
      (el) => el.style.outline === "2px solid #a78bfa",
    ) ?? null
  );
}

function muteStyleTag(): HTMLStyleElement | null {
  return (
    [...doc.querySelectorAll<HTMLStyleElement>("style")].find((s) =>
      s.textContent?.includes("body::before"),
    ) ?? null
  );
}

function assignRect(
  el: Element,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  (el as Record<string, unknown>).getBoundingClientRect = () =>
    new win.DOMRect(x, y, w, h);
}

function makeVisible(selector: string): HTMLElement[] {
  const els = [...doc.querySelectorAll<HTMLElement>(selector)];
  let y = 0;
  for (const el of els) {
    assignRect(el, 10, y, 300, 40);
    y += 50;
  }
  return els;
}

function setBody(html: string): void {
  doc.body.innerHTML = html;
}

function loadFixture(file: string): void {
  const raw = readFileSync(join(fixturesDir, file), "utf-8");
  const match = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  doc.body.innerHTML = match ? match[1] : raw;
}

function cleanup(): void {
  // exit any active mode by pressing Escape twice
  press("Escape");
  press("Escape");
  doc.body.innerHTML = "";
}

// --- tests ---

describe("click mode (Ctrl+Shift+J)", () => {
  beforeEach(cleanup);

  it("shows hint overlays on links when activated", () => {
    setBody(
      `<ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li><li><a href="/c">C</a></li></ul>`,
    );
    makeVisible("a[href]");

    pressCtrlShift("J");
    expect(visibleHintLabels().length).toBe(3);
  });

  it("typing a full label triggers click on matching element", () => {
    setBody(`<ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul>`);
    makeVisible("a[href]");

    let clicked = false;
    doc.querySelectorAll("a")[0].addEventListener("click", () => {
      clicked = true;
    });

    pressCtrlShift("J");
    const label = visibleHintLabels()[0];
    expect(label).toBeTruthy();
    typeSeq(label);
    expect(clicked).toBe(true);
  });

  it("Escape deactivates hints", () => {
    setBody(`<a href="/x">X</a>`);
    makeVisible("a[href]");

    pressCtrlShift("J");
    expect(visibleHintLabels().length).toBe(1);
    press("Escape");
    expect(hintOverlays().length).toBe(0);
  });

  it("wrong characters deactivates hints", () => {
    setBody(`<a href="/x">X</a>`);
    makeVisible("a[href]");

    pressCtrlShift("J");
    expect(visibleHintLabels().length).toBe(1);
    typeSeq("zzz");
    expect(hintOverlays().length).toBe(0);
  });

  it("shows hints on buttons", () => {
    setBody(`<button>Action 1</button><button>Action 2</button>`);
    makeVisible("button");

    pressCtrlShift("J");
    expect(visibleHintLabels().length).toBe(2);
  });

  it("Backspace restores filtered hints", () => {
    // 15 links → two-char labels
    setBody(
      Array.from({ length: 15 }, (_, i) => `<a href="/p${i}">L${i}</a>`).join(
        "",
      ),
    );
    makeVisible("a[href]");

    pressCtrlShift("J");
    const all = visibleHintLabels().length;
    expect(all).toBe(15);

    const firstChar = visibleHintLabels()[0][0];
    typeSeq(firstChar);
    expect(visibleHintLabels().length).toBeLessThan(all);

    press("Backspace");
    expect(visibleHintLabels().length).toBe(all);
  });
});

describe("focus mode (Ctrl+Shift+K)", () => {
  beforeEach(cleanup);

  it("shows hints on repeating list items", () => {
    setBody(`<ul><li>A</li><li>B</li><li>C</li><li>D</li></ul>`);
    makeVisible("li");

    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBe(4);
  });

  it("does not show hints on lone elements", () => {
    setBody(`<div><section>Only</section></div>`);
    makeVisible("section");

    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBe(0);
  });

  it("shows hints on divs with shared classes", () => {
    setBody(
      `<div class="feed"><div class="card a">A</div><div class="card">B</div><div class="card b">C</div></div>`,
    );
    makeVisible(".card");

    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBe(3);
  });

  it("does not show hints on divs without shared classes", () => {
    setBody(
      `<div><div class="header">H</div><div class="content">C</div><div class="footer">F</div></div>`,
    );
    makeVisible(".header,.content,.footer");

    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBe(0);
  });

  it("selecting a hint enters focus with bar, highlight, mute", () => {
    setBody(`<ul><li>A</li><li>B</li><li>C</li></ul>`);
    makeVisible("li");

    pressCtrlShift("K");
    const label = visibleHintLabels()[0];
    expect(label).toBeTruthy();
    typeSeq(label);

    expect(selectorBar()).toBeTruthy();
    expect(highlightedElement()).toBeTruthy();
    expect(muteStyleTag()).toBeTruthy();
  });

  it("j/k navigates between matches", () => {
    setBody(`<ul><li>A</li><li>B</li><li>C</li></ul>`);
    const items = makeVisible("li");

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    expect(highlightedElement()).toBe(items[0]);

    press("j");
    expect(highlightedElement()).toBe(items[1]);
    press("j");
    expect(highlightedElement()).toBe(items[2]);
    press("k");
    expect(highlightedElement()).toBe(items[1]);
  });

  it("j/k does not go past boundaries", () => {
    setBody(`<ul><li>A</li><li>B</li></ul>`);
    const items = makeVisible("li");

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);

    press("k"); // already first
    expect(highlightedElement()).toBe(items[0]);

    press("j");
    press("j");
    press("j"); // past last
    expect(highlightedElement()).toBe(items[1]);
  });

  it("d changes depth level", () => {
    setBody(`
      <div class="outer">
        <div class="inner">
          <article class="post"><ul><li>A</li><li>B</li><li>C</li></ul></article>
          <article class="post"><ul><li>D</li><li>E</li><li>F</li></ul></article>
        </div>
        <div class="inner">
          <article class="post"><ul><li>G</li><li>H</li><li>I</li></ul></article>
        </div>
      </div>
    `);
    makeVisible("li");
    makeVisible("article");

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    const bar1 = selectorBar()?.textContent ?? "";

    // Keep pressing d until bar changes or we exhaust levels
    let changed = false;
    for (let i = 0; i < 5; i++) {
      press("d");
      if ((selectorBar()?.textContent ?? "") !== bar1) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("Enter triggers click and exits focus", () => {
    setBody(`<ul><li>A</li><li>B</li></ul>`);
    makeVisible("li");

    let clickFired = false;
    doc.addEventListener(
      "click",
      () => {
        clickFired = true;
      },
      { once: true },
    );

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    press("Enter");

    expect(clickFired).toBe(true);
    expect(selectorBar()).toBeNull();
  });

  it("Escape exits focus mode completely", () => {
    setBody(`<ul><li>A</li><li>B</li></ul>`);
    makeVisible("li");

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    expect(selectorBar()).toBeTruthy();

    press("Escape");
    expect(selectorBar()).toBeNull();
    expect(muteStyleTag()).toBeNull();
    expect(highlightedElement()).toBeNull();
  });
});

describe("focus mode bugs", () => {
  beforeEach(cleanup);

  it("j/k only navigates siblings in the same parent, not all matches globally", () => {
    setBody(`
      <div>
        <ul id="list1"><li>A1</li><li>A2</li><li>A3</li></ul>
        <ul id="list2"><li>B1</li><li>B2</li></ul>
      </div>
    `);
    const list1Items = makeVisible("#list1 li");
    makeVisible("#list2 li");

    pressCtrlShift("K");
    // Pick first item from list1
    typeSeq(visibleHintLabels()[0]);

    // Navigate j — should stay within the same group
    const visited: HTMLElement[] = [highlightedElement()!];
    for (let i = 0; i < 10; i++) {
      press("j");
      visited.push(highlightedElement()!);
    }

    // BUG: focusMatches() uses document.querySelectorAll("li") which returns
    // ALL li elements on page. j navigates from list1 into list2.
    // This is wrong — user picked a list1 item, should stay in list1.
    const list2Items = [...doc.querySelectorAll("#list2 li")];
    const crossedIntoList2 = visited.some((el) => list2Items.includes(el));
    expect(crossedIntoList2).toBe(false);
  });

  it("d broadening preserves the scoped group, not all matches globally", () => {
    setBody(`
      <div class="page">
        <section class="feed">
          <article class="card"><ul><li>A</li><li>B</li></ul></article>
          <article class="card"><ul><li>C</li><li>D</li></ul></article>
        </section>
        <section class="sidebar">
          <article class="card"><ul><li>X</li><li>Y</li></ul></article>
        </section>
      </div>
    `);
    makeVisible("li");
    makeVisible("article");
    makeVisible("section");

    pressCtrlShift("K");
    // Pick first li (inside feed > first article)
    typeSeq(visibleHintLabels()[0]);

    // Broaden with d to article level
    press("d");

    // Navigate — should only visit articles in .feed, not .sidebar
    const visited = new Set<HTMLElement>();
    visited.add(highlightedElement()!);
    for (let i = 0; i < 10; i++) {
      press("j");
      const h = highlightedElement();
      if (h) visited.add(h);
    }

    // BUG: selector is "article.card" which matches ALL 3 articles globally.
    // User started in .feed, so navigation should not cross into .sidebar.
    const sidebarArticle = doc.querySelector(".sidebar article") as HTMLElement;
    expect(visited.has(sidebarArticle)).toBe(false);
  });

  it("changing depth keeps anchor in context", () => {
    setBody(`
      <div class="feed">
        <article class="post"><ul><li>A</li><li>B</li></ul></article>
        <article class="post"><ul><li>C</li><li>D</li></ul></article>
      </div>
    `);
    makeVisible("li");
    makeVisible("article");

    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);

    // At li level, anchor is first li
    const firstAnchor = highlightedElement();
    expect(firstAnchor).toBeTruthy();

    // Broaden
    press("d");

    // After broadening, the highlighted element should be an ancestor of
    // the original anchor (the article containing the li we picked)
    const newAnchor = highlightedElement();
    expect(newAnchor).toBeTruthy();
    expect(newAnchor!.contains(firstAnchor!)).toBe(true);
  });

  it("mute overlay highlights only the scoped group, not unrelated matches", () => {
    setBody(`
      <div>
        <ul id="nav"><li>Nav1</li><li>Nav2</li></ul>
        <ul id="content"><li>Post1</li><li>Post2</li><li>Post3</li></ul>
      </div>
    `);
    makeVisible("li");

    pressCtrlShift("K");
    // Pick first content li
    const labels = visibleHintLabels();
    // Find the label for first #content li
    const contentItems = [
      ...doc.querySelectorAll("#content li"),
    ] as HTMLElement[];
    const allHintEls = hintOverlays().filter((h) => h.style.display !== "none");

    typeSeq(labels[0]);

    // The mute style should scope to the parent, not elevate ALL li on page.
    const muteText = muteStyleTag()?.textContent ?? "";
    // Should use a scoped selector like [data-jump-mute-parent] > li
    // and NOT a bare "li" at the start of a rule
    const hasScopedSelector = /\[[\w-]+\]\s*>\s*li\s*\{/.test(muteText);
    expect(hasScopedSelector).toBe(true);
  });
});

describe("focus mode on reddit-popular", () => {
  beforeEach(() => {
    cleanup();
    loadFixture("reddit-popular.html");
    makeVisible("article");
    makeVisible("li");
  });

  it("shows hints for repeating content", () => {
    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBeGreaterThan(0);
  });

  it("selecting hint enters focus, j navigates distinct elements", () => {
    pressCtrlShift("K");
    const label = visibleHintLabels()[0];
    expect(label).toBeTruthy();
    typeSeq(label);

    expect(selectorBar()).toBeTruthy();
    expect(highlightedElement()).toBeTruthy();

    const visited = new Set<HTMLElement>();
    visited.add(highlightedElement()!);
    for (let i = 0; i < 50; i++) {
      press("j");
      const h = highlightedElement();
      if (h) visited.add(h);
    }
    expect(visited.size).toBeGreaterThan(1);
    console.log(`  Navigated ${visited.size} distinct elements`);
  });

  it("d broadens depth level", () => {
    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    const bar1 = selectorBar()?.textContent ?? "";

    const bars = new Set([bar1]);
    for (let i = 0; i < 5; i++) {
      press("d");
      bars.add(selectorBar()?.textContent ?? "");
    }
    console.log(`  ${bars.size} distinct depth levels`);
  });

  it("full flow: activate → pick → navigate → Enter exits", () => {
    pressCtrlShift("K");
    typeSeq(visibleHintLabels()[0]);
    press("j");
    press("j");

    let clickFired = false;
    doc.addEventListener(
      "click",
      () => {
        clickFired = true;
      },
      { once: true },
    );
    press("Enter");

    expect(clickFired).toBe(true);
    expect(selectorBar()).toBeNull();
    expect(highlightedElement()).toBeNull();
  });
});

describe("focus mode on reddit-comments", () => {
  beforeEach(() => {
    cleanup();
    loadFixture("reddit-comments.html");
    // Make comment elements with siblings visible
    const comments = [
      ...doc.querySelectorAll("shreddit-comment"),
    ] as HTMLElement[];
    let y = 0;
    for (const c of comments) {
      const parent = c.parentElement;
      if (!parent) continue;
      if (
        [...parent.children].filter((s) => s.localName === c.localName).length >
        1
      ) {
        assignRect(c, 10, y, 600, 80);
        y += 90;
      }
    }
    makeVisible("li");
    makeVisible("tr");
  });

  it("shows hints", () => {
    pressCtrlShift("K");
    expect(visibleHintLabels().length).toBeGreaterThan(0);
  });

  it("can navigate with j/k", () => {
    pressCtrlShift("K");
    const labels = visibleHintLabels();
    if (labels.length === 0) return;

    typeSeq(labels[0]);
    const visited = new Set<HTMLElement>();
    visited.add(highlightedElement()!);
    for (let i = 0; i < 30; i++) {
      press("j");
      const h = highlightedElement();
      if (h) visited.add(h);
    }
    expect(visited.size).toBeGreaterThan(1);
    console.log(`  Navigated ${visited.size} distinct elements`);
  });

  it("Escape cleans up all state", () => {
    pressCtrlShift("K");
    const labels = visibleHintLabels();
    if (labels.length === 0) return;

    typeSeq(labels[0]);
    expect(selectorBar()).toBeTruthy();

    press("Escape");
    expect(selectorBar()).toBeNull();
    expect(muteStyleTag()).toBeNull();
    expect(highlightedElement()).toBeNull();
  });
});
