// Injected into the page's main world at document_start.
// Monkey-patches addEventListener/removeEventListener to mark elements
// that have click handlers with a data attribute.

const ATTR = "data-jump-has-click";
const CLICK_EVENTS = new Set([
  // mouse
  "click",
  "dblclick",
  "auxclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  // pointer
  "pointerdown",
  "pointerup",
  // touch
  "touchstart",
  "touchend",
  // keyboard (elements listening for Enter/Space)
  "keydown",
  "keyup",
  "keypress",
]);

const counters = new WeakMap<EventTarget, number>();
const origAdd = EventTarget.prototype.addEventListener;
const origRemove = EventTarget.prototype.removeEventListener;

EventTarget.prototype.addEventListener = function (
  type: string,
  ...args: unknown[]
) {
  if (CLICK_EVENTS.has(type) && this instanceof HTMLElement) {
    const count = (counters.get(this) ?? 0) + 1;
    counters.set(this, count);
    this.setAttribute(ATTR, "");
  }
  return origAdd.call(this, type, ...(args as [any, any]));
};

EventTarget.prototype.removeEventListener = function (
  type: string,
  ...args: unknown[]
) {
  if (CLICK_EVENTS.has(type) && this instanceof HTMLElement) {
    const count = Math.max(0, (counters.get(this) ?? 0) - 1);
    counters.set(this, count);
    if (count === 0) this.removeAttribute(ATTR);
  }
  return origRemove.call(this, type, ...(args as [any, any]));
};
