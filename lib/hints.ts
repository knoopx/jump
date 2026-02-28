const ALPHABET = "sadfjklewcmpgh";

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

const HINT_STYLE: Record<string, string> = {
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
};

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

function createHintElement(
  label: string,
  rect: DOMRect,
  styleOverride?: Record<string, string>,
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

function rectsOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height
  );
}

function deCollide(
  hints: { left: number; top: number; width: number; height: number }[],
): void {
  const PAD = 2;
  const MAX_PASSES = 5;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;
    for (let i = 1; i < hints.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = hints[j];
        const b = hints[i];
        if (!rectsOverlap(a, b)) continue;
        moved = true;
        const overlapRight = a.left + a.width - b.left;
        const overlapDown = a.top + a.height - b.top;
        if (overlapRight <= overlapDown) {
          b.left = a.left + a.width + PAD;
        } else {
          b.top = a.top + a.height + PAD;
        }
      }
    }
    if (!moved) break;
  }
}

export function showHints(
  elements: HTMLElement[],
  styleOverride?: Record<string, string>,
): ActiveHint[] {
  const labels = generateLabels(elements.length);
  const overlays: HTMLElement[] = [];
  const positions: {
    left: number;
    top: number;
    width: number;
    height: number;
  }[] = [];

  for (let i = 0; i < elements.length; i++) {
    const rect = elements[i].getBoundingClientRect();
    const overlay = createHintElement(labels[i], rect, styleOverride);
    overlays.push(overlay);

    document.documentElement.appendChild(overlay);
    const left = parseFloat(overlay.style.left) || 0;
    const top = parseFloat(overlay.style.top) || 0;
    const width = overlay.offsetWidth;
    const height = overlay.offsetHeight;
    overlay.remove();
    positions.push({ left, top, width, height });
  }

  deCollide(positions);

  const hints: ActiveHint[] = [];
  for (let i = 0; i < elements.length; i++) {
    const overlay = overlays[i];
    overlay.style.left = `${positions[i].left}px`;
    overlay.style.top = `${positions[i].top}px`;
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
