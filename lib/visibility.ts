export function rectIntersectsViewport(rect: DOMRect): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (rect.top >= vh || rect.bottom <= 0) return false;
  return rect.left < vw && rect.right > 0;
}

function deepElementFromPoint(x: number, y: number): Element | null {
  let current = document.elementFromPoint(x, y);
  while (current?.shadowRoot) {
    const inner = current.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === current) break;
    current = inner;
  }
  return current;
}

function samplePoints(rect: DOMRect): [number, number][] {
  return [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + 1, rect.top + 1],
    [rect.right - 1, rect.top + 1],
    [rect.left + 1, rect.bottom - 1],
    [rect.right - 1, rect.bottom - 1],
  ];
}

function hitBelongsToElement(hit: Element, el: HTMLElement): boolean {
  return el === hit || el.contains(hit) || hit.contains(el);
}

function isOccluded(el: HTMLElement, rect: DOMRect): boolean {
  for (const [x, y] of samplePoints(rect)) {
    try {
      const hit = deepElementFromPoint(x, y);
      if (hit && hitBelongsToElement(hit, el)) return false;
    } catch (err) {
      console.warn("Jump: Error checking occlusion:", err);
      continue;
    }
  }
  return true;
}

function passesDisplayCheck(style: CSSStyleDeclaration): boolean {
  return style.display !== "none";
}

function passesVisibilityCheck(style: CSSStyleDeclaration): boolean {
  return style.visibility !== "hidden";
}

function passesOpacityCheck(style: CSSStyleDeclaration): boolean {
  return parseFloat(style.opacity) !== 0;
}

function passesClipPathCheck(style: CSSStyleDeclaration): boolean {
  const clipPath = style.clipPath;
  return !(clipPath && clipPath.includes("inset(100%)"));
}

function passesStyleChecks(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  return (
    passesDisplayCheck(style) &&
    passesVisibilityCheck(style) &&
    passesOpacityCheck(style) &&
    passesClipPathCheck(style)
  );
}

function passesRectChecks(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (!rectIntersectsViewport(rect)) return false;
  return !isOccluded(el, rect);
}

export function isVisible(el: HTMLElement): boolean {
  try {
    if (!passesStyleChecks(el)) return false;
    return passesRectChecks(el);
  } catch (err) {
    console.warn("Jump: Error checking visibility:", err);
    return false;
  }
}
