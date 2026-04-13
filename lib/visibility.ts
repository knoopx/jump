// fallow-ignore-next-line unused-files
export function rectIntersectsViewport(rect: DOMRect): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
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

function isOccluded(el: HTMLElement, rect: DOMRect): boolean {
  const points = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + 1, rect.top + 1],
    [rect.right - 1, rect.top + 1],
    [rect.left + 1, rect.bottom - 1],
    [rect.right - 1, rect.bottom - 1],
  ];
  for (const [x, y] of points) {
    try {
      const hit = deepElementFromPoint(x, y);
      if (hit && (el === hit || el.contains(hit) || hit.contains(el)))
        return false;
    } catch (err) {
      console.warn("Jump: Error checking occlusion:", err);
      continue;
    }
  }
  return true;
}

export function isVisible(el: HTMLElement): boolean {
  try {
    const style = getComputedStyle(el);

    // Check display:none
    if (style.display === "none") {
      return false;
    }

    // Check visibility:hidden (but allow visibility:visible children to override)
    if (style.visibility === "hidden") {
      return false;
    }

    // Check opacity:0 (but allow opacity > 0, even very small values)
    const opacity = parseFloat(style.opacity);
    if (opacity === 0) {
      return false;
    }

    // Check clip-path that fully clips the element
    const clipPath = style.clipPath;
    if (clipPath && clipPath.includes("inset(100%)")) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    if (!rectIntersectsViewport(rect)) return false;
    if (isOccluded(el, rect)) return false;
    return true;
  } catch (err) {
    console.warn("Jump: Error checking visibility:", err);
    return false;
  }
}
