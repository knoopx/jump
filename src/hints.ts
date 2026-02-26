const ALPHABET = "sadfjklewcmpgh";

export const CLICKABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type=hidden]):not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[role=button]",
  "[role=link]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[tabindex]:not([tabindex='-1'])",
  "[onclick]",
  "summary",
  "details > summary",
  "[contenteditable=true]",
  "[data-jump-has-click]",
].join(",");

export function generateLabels(count: number): string[] {
  if (count === 0) return [];
  const k = ALPHABET.length;

  let len = 1;
  while (k ** len < count) len++;

  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    let label = "";
    let n = i;
    for (let j = len - 1; j >= 0; j--) {
      label = ALPHABET[n % k] + label;
      n = Math.floor(n / k);
    }
    labels.push(label);
  }
  return labels;
}

const HINT_STYLE = {
  position: "absolute",
  zIndex: "2147483647",
  padding: "0 2px",
  background: "#f5c518",
  color: "#000",
  fontSize: "12px",
  fontFamily: "monospace",
  fontWeight: "bold",
  lineHeight: "1",
  borderRadius: "1px",
  border: "none",
  boxShadow: "none",
  pointerEvents: "none",
  whiteSpace: "nowrap",
} as const;

const MATCHED_CHAR_STYLE = "opacity:0.4";

type Gravity =
  | "bottom"
  | "top"
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

const GAP = 0;

function pickGravity(rect: DOMRect, hintW: number, hintH: number): Gravity {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const centerX = rect.left + (rect.width - hintW) / 2;
  const fitsBottomCenter =
    centerX >= 0 && centerX + hintW <= vw && rect.bottom + hintH <= vh;

  if (fitsBottomCenter) return "bottom";

  const fitsRight = vw - rect.right >= hintW + GAP;
  const fitsLeft = rect.left >= hintW + GAP;
  const fitsTop = rect.top >= hintH + GAP;
  const fitsBelow = vh - rect.bottom >= hintH + GAP;

  if (fitsTop) return "top";
  if (fitsTop && fitsRight) return "top-right";
  if (fitsTop && fitsLeft) return "top-left";
  if (fitsBelow && fitsRight) return "bottom-right";
  if (fitsBelow && fitsLeft) return "bottom-left";

  return "bottom";
}

function positionForGravity(
  gravity: Gravity,
  rect: DOMRect,
  hintW: number,
  hintH: number,
): { left: number; top: number } {
  const centerX = rect.left + (rect.width - hintW) / 2;
  const centerY = rect.top + (rect.height - hintH) / 2;

  if (rect.width < hintW * 3 && rect.height < hintH * 3) {
    return { left: centerX, top: centerY };
  }

  switch (gravity) {
    case "bottom":
      return {
        left: rect.right - hintW,
        top: centerY,
      };
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

function clampToViewport(
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
  if (rect.width === 0 || rect.height === 0) return false;
  return rectIntersectsViewport(rect);
}

function createHintElement(
  label: string,
  rect: DOMRect,
  styleOverride?: Partial<typeof HINT_STYLE>,
): HTMLElement {
  const hint = document.createElement("div");
  hint.innerHTML = label
    .split("")
    .map((c) => `<span>${c}</span>`)
    .join("");

  Object.assign(hint.style, {
    ...HINT_STYLE,
    ...styleOverride,
    left: "-9999px",
    top: "-9999px",
  });
  document.documentElement.appendChild(hint);
  const w = hint.offsetWidth;
  const h = hint.offsetHeight;
  hint.remove();

  const gravity = pickGravity(rect, w, h);
  const pos = clampToViewport(positionForGravity(gravity, rect, w, h), w, h);

  Object.assign(hint.style, {
    left: `${pos.left + window.scrollX}px`,
    top: `${pos.top + window.scrollY}px`,
  });
  return hint;
}

function updateHintDisplay(
  hint: HTMLElement,
  label: string,
  typed: string,
): void {
  const chars = label.split("");
  hint.innerHTML = chars
    .map((c, i) =>
      i < typed.length
        ? `<span style="${MATCHED_CHAR_STYLE}">${c}</span>`
        : `<span>${c}</span>`,
    )
    .join("");
}

export interface ActiveHint {
  label: string;
  element: HTMLElement;
  overlay: HTMLElement;
}

const managedElements: HTMLElement[] = [];

function addManaged(el: HTMLElement): void {
  document.documentElement.appendChild(el);
  managedElements.push(el);
}

export const FOCUSABLE_SELECTOR = [
  "li",
  "tr",
  "article",
  "section",
  "details",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "dt",
  "dd",
  "blockquote",
].join(",");

export function hasSameTagSiblings(el: HTMLElement): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  const tag = el.localName;
  let count = 0;
  for (const child of parent.children) {
    if (child.localName === tag && ++count > 1) return true;
  }
  return false;
}

export function hasSharedClasses(el: HTMLElement): boolean {
  if (el.classList.length === 0) return false;
  const parent = el.parentElement;
  if (!parent) return false;
  const tag = el.localName;
  const siblings = [...parent.children].filter(
    (c) => c !== el && c.localName === tag,
  );
  if (siblings.length === 0) return false;
  for (const cls of el.classList) {
    if (siblings.every((s) => s.classList.contains(cls))) return true;
  }
  return false;
}

export function collectFocusTargets(root: Document): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  for (const el of root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (seen.has(el)) continue;
    if (!hasSameTagSiblings(el)) continue;
    seen.add(el);
    results.push(el);
  }

  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    if (seen.has(el)) continue;
    const isCustom = el.localName.includes("-");
    const isDiv = el.localName === "div";
    if (!isCustom && !isDiv) continue;
    if (isDiv && !(hasSameTagSiblings(el) && hasSharedClasses(el))) continue;
    if (isCustom && !hasSameTagSiblings(el)) continue;
    seen.add(el);
    results.push(el);
  }

  return results;
}

export function showHints(
  styleOverride?: Partial<typeof HINT_STYLE>,
  focusableOnly?: boolean,
): ActiveHint[] {
  const hints: ActiveHint[] = [];
  const seenElements = new Set<HTMLElement>();
  const elements: HTMLElement[] = [];

  if (focusableOnly) {
    for (const el of collectFocusTargets(document)) {
      if (isVisible(el)) elements.push(el);
    }
    // Also traverse shadow roots
    for (const el of document.querySelectorAll("*")) {
      if (el.shadowRoot) {
        for (const target of collectFocusTargets(
          el.shadowRoot as unknown as Document,
        )) {
          if (isVisible(target) && !elements.includes(target))
            elements.push(target);
        }
      }
    }
  } else {
    function collectClickable(root: Document | ShadowRoot | Element): void {
      const searchRoot = root instanceof Element ? root.shadowRoot : root;
      if (!searchRoot) return;

      for (const el of searchRoot.querySelectorAll<HTMLElement>(
        CLICKABLE_SELECTOR,
      )) {
        if (!isVisible(el) || seenElements.has(el)) continue;
        if (el instanceof HTMLAnchorElement && el.href) {
          const url = new URL(el.href, location.href);
          if (
            url.origin === location.origin &&
            url.pathname === location.pathname
          )
            continue;
        }
        seenElements.add(el);
        elements.push(el);
      }

      for (const el of searchRoot.querySelectorAll("*")) {
        if (el.shadowRoot) collectClickable(el);
      }
    }

    collectClickable(document);
  }

  const targetMap = new Map<string, HTMLElement[]>();
  const noKey: HTMLElement[] = [];

  for (const el of elements) {
    let key: string | undefined;
    if (el instanceof HTMLAnchorElement && el.href) {
      key = el.href;
    }

    if (key) {
      const group = targetMap.get(key);
      if (group) group.push(el);
      else targetMap.set(key, [el]);
    } else {
      noKey.push(el);
    }
  }

  elements.length = 0;
  for (const group of targetMap.values()) {
    if (group.length === 1) {
      elements.push(group[0]);
    } else {
      let best = group[0];
      let bestArea = 0;
      for (const el of group) {
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area > bestArea) {
          bestArea = area;
          best = el;
        }
      }
      elements.push(best);
    }
  }
  for (const el of noKey) elements.push(el);

  const labels = generateLabels(elements.length);
  for (let i = 0; i < elements.length; i++) {
    const rect = elements[i].getBoundingClientRect();
    const overlay = createHintElement(labels[i], rect, styleOverride);
    addManaged(overlay);
    hints.push({ label: labels[i], element: elements[i], overlay });
  }

  return hints;
}

export function filterHints(hints: ActiveHint[], typed: string): ActiveHint[] {
  const matching: ActiveHint[] = [];
  for (const hint of hints) {
    if (hint.label.startsWith(typed)) {
      hint.overlay.style.display = "";
      updateHintDisplay(hint.overlay, hint.label, typed);
      matching.push(hint);
    } else {
      hint.overlay.style.display = "none";
    }
  }
  return matching;
}

export function removeHints(): void {
  for (const el of managedElements) {
    el.remove();
  }
  managedElements.length = 0;
}
