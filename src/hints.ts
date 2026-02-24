const ALPHABET = "asdfghjkl";

export function generateLabels(count: number): string[] {
  const k = ALPHABET.length;
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push(ALPHABET[i % k]);
  }
  return labels;
}

type Gravity =
  | "bottom"
  | "top"
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

const HINT_STYLE = {
  position: "absolute",
  zIndex: "2147483647",
  padding: "1px 4px",
  background: "#f5c518",
  color: "#000",
  fontSize: "11px",
  fontFamily: "monospace",
  fontWeight: "bold",
  lineHeight: "1.2",
  borderRadius: "2px",
  border: "1px solid #c9a100",
  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  pointerEvents: "none",
} as const;

const HIGHLIGHT_STYLE = {
  position: "absolute",
  zIndex: "2147483646",
  pointerEvents: "none",
  border: "2px solid #f5c518",
  borderRadius: "4px",
  background: "rgba(245, 197, 24, 0.08)",
} as const;

const GAP = 0;
const ESTIMATED_CHAR_WIDTH = 7.5;
const ESTIMATED_HEIGHT = 16;

function estimateHintSize(label: string): { w: number; h: number } {
  return {
    w: label.length * ESTIMATED_CHAR_WIDTH + 10,
    h: ESTIMATED_HEIGHT,
  };
}

function pickGravity(rect: DOMRect, hintW: number, hintH: number): Gravity {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fitsRight = vw - rect.right >= hintW + GAP;
  const fitsLeft = rect.left >= hintW + GAP;
  const fitsTop = rect.top >= hintH + GAP;
  const fitsBottom = vh - rect.bottom >= hintH + GAP;

  if (fitsBottom) return "bottom";
  if (fitsTop) return "top";
  if (fitsTop && fitsRight) return "top-right";
  if (fitsTop && fitsLeft) return "top-left";
  if (fitsBottom && fitsRight) return "bottom-right";
  if (fitsBottom && fitsLeft) return "bottom-left";

  return "bottom";
}

function positionForGravity(
  gravity: Gravity,
  rect: DOMRect,
  hintW: number,
  hintH: number,
): { left: number; top: number } {
  const centerX = rect.left + (rect.width - hintW) / 2;

  switch (gravity) {
    case "bottom":
      return { left: centerX, top: rect.bottom + GAP };
    case "top":
      return { left: centerX, top: rect.top - hintH - GAP };
    case "top-right":
      return { left: rect.right + GAP, top: rect.top - hintH - GAP };
    case "top-left":
      return { left: rect.left - hintW - GAP, top: rect.top - hintH - GAP };
    case "bottom-right":
      return { left: rect.right + GAP, top: rect.bottom + GAP };
    case "bottom-left":
      return { left: rect.left - hintW - GAP, top: rect.bottom + GAP };
  }
}

function clamp(
  pos: { left: number; top: number },
  hintW: number,
  hintH: number,
): { left: number; top: number } {
  return {
    left: Math.max(0, Math.min(pos.left, window.innerWidth - hintW)),
    top: Math.max(0, Math.min(pos.top, window.innerHeight - hintH)),
  };
}

function rectIntersectsViewport(rect: DOMRect): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

function clipRectToViewport(rect: DOMRect): DOMRect {
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(window.innerWidth, rect.right);
  const bottom = Math.min(window.innerHeight, rect.bottom);
  return new DOMRect(
    left,
    top,
    Math.max(0, right - left),
    Math.max(0, bottom - top),
  );
}

function createHintElement(label: string, rect: DOMRect): HTMLElement {
  const hint = document.createElement("div");
  hint.textContent = label;
  hint.dataset.hint = label;

  const { w, h } = estimateHintSize(label);
  const gravity = pickGravity(rect, w, h);
  const pos = clamp(positionForGravity(gravity, rect, w, h), w, h);

  Object.assign(hint.style, {
    ...HINT_STYLE,
    left: `${pos.left + window.scrollX}px`,
    top: `${pos.top + window.scrollY}px`,
  });
  return hint;
}

function createHighlightElement(rect: DOMRect): HTMLElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    ...HIGHLIGHT_STYLE,
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  return el;
}

function findCommonAncestor(elements: HTMLElement[]): HTMLElement {
  if (elements.length === 1) return elements[0];

  let ancestor: HTMLElement = elements[0];
  for (let i = 1; i < elements.length; i++) {
    while (!ancestor.contains(elements[i])) {
      ancestor = ancestor.parentElement ?? document.documentElement;
    }
  }
  return ancestor;
}

function boundingRect(elements: HTMLElement[]): DOMRect {
  let top = Infinity;
  let left = Infinity;
  let bottom = -Infinity;
  let right = -Infinity;
  for (const el of elements) {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    bottom = Math.max(bottom, r.bottom);
    right = Math.max(right, r.right);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

export interface ActiveHint {
  group: number;
  label: string;
  element: HTMLElement;
  overlay: HTMLElement;
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rectIntersectsViewport(rect);
}

const managedElements: HTMLElement[] = [];

function addManaged(el: HTMLElement): void {
  document.documentElement.appendChild(el);
  managedElements.push(el);
}

export function showHints(selectorGroups: string[]): ActiveHint[] {
  const hints: ActiveHint[] = [];

  const groupsWithElements: { group: number; elements: HTMLElement[] }[] = [];
  const seenElements = new Set<HTMLElement>();

  for (let g = 0; g < selectorGroups.length; g++) {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(selectorGroups[g]),
    ).filter((element) => {
      if (!isVisible(element)) return false;
      if (seenElements.has(element)) return false;
      seenElements.add(element);
      return true;
    });

    if (elements.length > 0) {
      groupsWithElements.push({ group: g, elements });
    }
  }

  const singleGroup = groupsWithElements.length === 1;

  if (singleGroup) {
    const { group, elements } = groupsWithElements[0];
    const labels = generateLabels(elements.length);
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      const overlay = createHintElement(labels[i], rect);
      addManaged(overlay);
      hints.push({ group, label: labels[i], element: elements[i], overlay });
    }
  } else {
    const groupLabels = generateLabels(groupsWithElements.length);
    for (let gi = 0; gi < groupsWithElements.length; gi++) {
      const { group, elements } = groupsWithElements[gi];
      const container = findCommonAncestor(elements);
      const rawContainerRect =
        container === document.documentElement
          ? boundingRect(elements)
          : container.getBoundingClientRect();
      const containerRect = clipRectToViewport(rawContainerRect);
      if (!rectIntersectsViewport(containerRect)) continue;

      const highlight = createHighlightElement(containerRect);
      addManaged(highlight);

      const hintOverlay = createHintElement(groupLabels[gi], containerRect);
      addManaged(hintOverlay);

      for (const element of elements) {
        hints.push({
          group,
          label: groupLabels[gi],
          element,
          overlay: hintOverlay,
        });
      }
    }
  }

  return hints;
}

export function relabelHints(hints: ActiveHint[]): void {
  // Remove all managed elements and recreate for visible hints
  for (const el of managedElements) {
    el.remove();
  }
  managedElements.length = 0;

  const visible = hints.filter((h) => h.overlay.style.display !== "none");
  const labels = generateLabels(visible.length);
  for (let i = 0; i < visible.length; i++) {
    const rect = visible[i].element.getBoundingClientRect();
    const overlay = createHintElement(labels[i], rect);
    addManaged(overlay);
    visible[i].label = labels[i];
    visible[i].overlay = overlay;
  }
}

export function removeHints(_hints: ActiveHint[]): void {
  for (const el of managedElements) {
    el.remove();
  }
  managedElements.length = 0;
}
