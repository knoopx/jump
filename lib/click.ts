import { rectIntersectsViewport, isVisible } from "./visibility";

export function collectClickTargets(): HTMLElement[] {
  const pointerElements: HTMLElement[] = [];

  function walk(root: Document | ShadowRoot | Element): void {
    const searchRoot = root instanceof Element ? root.shadowRoot : root;
    if (!searchRoot) return;

    for (const el of searchRoot.querySelectorAll<HTMLElement>("*")) {
      if (el.shadowRoot) walk(el);
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (!rectIntersectsViewport(rect)) continue;
      if (getComputedStyle(el).cursor !== "pointer") continue;
      pointerElements.push(el);
    }
  }

  walk(document);

  const hasPointerDescendant = new Set<HTMLElement>();
  for (const el of pointerElements) {
    let parent = el.parentElement;
    while (parent) {
      if (hasPointerDescendant.has(parent)) break;
      hasPointerDescendant.add(parent);
      parent = parent.parentElement;
    }
  }

  const elements: HTMLElement[] = [];
  for (const el of pointerElements) {
    if (hasPointerDescendant.has(el)) continue;
    if (!isVisible(el)) continue;
    elements.push(el);
  }

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
