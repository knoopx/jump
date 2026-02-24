// Build a selector for `el` using only classes shared with same-tag siblings
export function siblingSelector(el: HTMLElement): string {
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

// Walk up from `el`, collect levels where same-tag siblings exist (repeating)
export function buildLevels(el: HTMLElement): DepthLevel[] {
  const levels: DepthLevel[] = [];
  const seen = new Set<string>();
  let current: HTMLElement | null = el;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const parent = current.parentElement;
    if (parent) {
      const count = [...parent.children].filter(
        (c) => c.localName === current!.localName,
      ).length;

      if (count > 1) {
        const sel = siblingSelector(current);
        if (!seen.has(sel)) {
          seen.add(sel);
          levels.push({ selector: sel, count, anchor: current, parent });
        }
      }
    }
    current = current.parentElement;
  }

  return levels;
}
