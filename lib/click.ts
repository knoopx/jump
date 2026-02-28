import { isVisible } from "./visibility";

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
