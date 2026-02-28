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
    const hit = deepElementFromPoint(x, y);
    if (hit && (el === hit || el.contains(hit) || hit.contains(el)))
      return false;
  }
  return true;
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
  if (!rectIntersectsViewport(rect)) return false;
  if (isOccluded(el, rect)) return false;
  return true;
}

function hasPointerChild(el: HTMLElement): boolean {
  for (const child of el.querySelectorAll<HTMLElement>("*")) {
    if (getComputedStyle(child).cursor === "pointer") return true;
  }
  return false;
}

export function collectClickTargets(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const elements: HTMLElement[] = [];

  function walk(root: Document | ShadowRoot | Element): void {
    const searchRoot = root instanceof Element ? root.shadowRoot : root;
    if (!searchRoot) return;

    for (const el of searchRoot.querySelectorAll<HTMLElement>("*")) {
      if (el.shadowRoot) walk(el);
      if (seen.has(el)) continue;
      if (getComputedStyle(el).cursor !== "pointer") continue;
      if (hasPointerChild(el)) continue;
      if (!isVisible(el)) continue;
      seen.add(el);
      elements.push(el);
    }
  }

  walk(document);
  return elements;
}

export function simulateClick(target: HTMLElement): void {
  const rect = target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const shared: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 1,
  };

  target.dispatchEvent(new MouseEvent("pointerover", shared));
  target.dispatchEvent(new MouseEvent("mouseover", shared));
  target.dispatchEvent(new MouseEvent("pointerdown", shared));
  target.dispatchEvent(new MouseEvent("mousedown", shared));
  target.dispatchEvent(new MouseEvent("pointerup", shared));
  target.dispatchEvent(new MouseEvent("mouseup", shared));
  target.click();
}
