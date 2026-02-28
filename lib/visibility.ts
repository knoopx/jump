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

export function deepElementFromPoint(x: number, y: number): Element | null {
  let current = document.elementFromPoint(x, y);
  while (current?.shadowRoot) {
    const inner = current.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === current) break;
    current = inner;
  }
  return current;
}

export function isOccluded(el: HTMLElement, rect: DOMRect): boolean {
  const points = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + 1, rect.top + 1],
    [rect.right - 1, rect.top + 1],
    [rect.left + 1, rect.bottom - 1],
    [rect.right - 1, rect.bottom - 1],
  ];
  for (const [x, y] of points) {
    const hit = deepElementFromPoint(x, y);
    if (hit && (el === hit || el.contains(hit) || hit.contains(el)))
      return false;
  }
  return true;
}

export function isVisible(el: HTMLElement): boolean {
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
  if (!rectIntersectsViewport(rect)) return false;
  if (isOccluded(el, rect)) return false;
  return true;
}
