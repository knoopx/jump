import { Window } from "happy-dom";

const window = new Window({ url: "https://localhost" });
const props = [
  "window",
  "document",
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLButtonElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "Element",
  "Node",
  "CSS",
  "CSSStyleDeclaration",
  "getComputedStyle",
  "DOMRect",
  "KeyboardEvent",
  "MouseEvent",
  "Event",
  "URL",
  "location",
] as const;

for (const prop of props) {
  if (!(prop in globalThis)) {
    Object.defineProperty(globalThis, prop, {
      value: (window as unknown as Record<string, unknown>)[prop],
      configurable: true,
    });
  }
}
