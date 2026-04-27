// Build a selector for `el` using only classes shared with same-tag siblings
function siblingSelector(el: HTMLElement): string {
  const tag = CSS.escape(el.localName);
  const parent = el.parentElement;
  if (!parent) return tag;

  const siblings = [...parent.children].filter(
    (c) => c.localName === el.localName,
  ) as HTMLElement[];

  if (siblings.length <= 1) return tag;

  const shared = [...el.classList].filter((cls) =>
    siblings.every((sib) => sib.classList.contains(cls)),
  );
  const cls = shared.map((c) => `.${CSS.escape(c)}`).join("");
  return cls ? `${tag}${cls}` : tag;
}

export interface DepthLevel {
  selector: string;
  count: number;
  anchor: HTMLElement;
  parent: HTMLElement;
}

function countSameTagSiblings(el: HTMLElement): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  return [...parent.children].filter((c) => c.localName === el.localName)
    .length;
}

function isAtDocumentRoot(el: HTMLElement): boolean {
  return el === document.body || el === document.documentElement;
}

// Walk up from `el`, collect levels where same-tag siblings exist (repeating)
export function buildLevels(el: HTMLElement): DepthLevel[] {
  const levels: DepthLevel[] = [];
  const seen = new Set<string>();
  let current: HTMLElement | null = el;

  try {
    while (current && !isAtDocumentRoot(current)) {
      const parent: HTMLElement | null =
        current.parentElement as HTMLElement | null;
      if (!parent) break;

      const count = countSameTagSiblings(current);
      if (count > 1) {
        addLevelIfNew(current, parent, count, seen, levels);
      }
      current = parent;
    }
  } catch (err) {
    console.warn("Jump: Error building levels:", err);
  }

  return levels;
}

function addLevelIfNew(
  el: HTMLElement,
  parent: HTMLElement,
  count: number,
  seen: Set<string>,
  levels: DepthLevel[],
): void {
  const sel = siblingSelector(el);
  if (seen.has(sel)) return;
  seen.add(sel);
  levels.push({ selector: sel, count, anchor: el, parent });
}
