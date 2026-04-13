// fallow-ignore-next-line unused-files
import { rectIntersectsViewport, isVisible } from "./visibility";

// Elements that are inherently clickable/focusable by HTML spec
const NATIVE_CLICKABLE_TAGS = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "details",
  "label",
  "summary",
  "option",
  "optgroup",
  "menuitem",
  "audio",
  "video",
  "slot",
]);

// Roles that indicate interactivity (ARIA)
const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "checkbox",
  "switch",
  "tab",
  "togglebutton",
  "treeitem",
]);

// Check if element has a click/mousedown event listener attached
function hasClickEventListener(el: HTMLElement): boolean {
  // Check for inline event handlers
  if (el.onclick || el.onmousedown) return true;

  // Check for onclick attribute (Firefox specific)
  const onclickAttr = el.getAttribute("onclick");
  if (onclickAttr && onclickAttr.length > 0) return true;

  return false;
}

// Check if input element is clickable
function isInputClickable(input: HTMLInputElement): boolean {
  const type = input.type?.toLowerCase() || "text";
  if (type === "hidden") return false;
  if (input.disabled) return false;
  return true;
}

// Check if button or select is clickable
function isButtonOrSelectClickable(
  el: HTMLButtonElement | HTMLSelectElement,
): boolean {
  return !el.disabled;
}

// Check if anchor is clickable
function isAnchorClickable(anchor: HTMLAnchorElement): boolean {
  return !!anchor.href || !!anchor.name;
}

// Check if element is natively clickable based on tag and attributes
function isNativeClickable(el: HTMLElement): boolean {
  const tag = el.localName;

  if (!NATIVE_CLICKABLE_TAGS.has(tag)) return false;

  if (tag === "input") return isInputClickable(el as HTMLInputElement);
  if (tag === "button" || tag === "select")
    return isButtonOrSelectClickable(
      el as HTMLButtonElement | HTMLSelectElement,
    );
  if (tag === "a") return isAnchorClickable(el as HTMLAnchorElement);

  return true;
}

// Check if element has interactive attributes
function hasInteractiveAttributes(el: HTMLElement): boolean {
  // tabindex >= 0 makes an element focusable/clickable
  const tabindex = el.getAttribute("tabindex");
  if (tabindex !== null) {
    const tabValue = parseInt(tabindex, 10);
    if (!isNaN(tabValue) && tabValue >= 0) return true;
  }

  // contentEditable makes an element editable/clickable
  const contentEditable = el.getAttribute("contenteditable");
  if (contentEditable && contentEditable.toLowerCase() !== "false") return true;

  // ARIA roles indicating interactivity
  const role = el.getAttribute("role");
  if (role && INTERACTIVE_ROLES.has(role.toLowerCase())) return true;

  // Common onclick-like attributes
  const clickAttrs = ["onclick", "onmousedown", "onmouseenter", "ontouchstart"];
  for (const attr of clickAttrs) {
    if (el.hasAttribute(attr)) return true;
  }

  return false;
}

const CLICKABLE_CANDIDATES_SELECTOR =
  "*[tabindex],*[contenteditable],*[role],*[onclick],*[onmousedown],a,button,input,select,textarea,details,label,summary,option,menuitem,audio,video";

function isElementClickable(el: HTMLElement): boolean {
  return (
    isNativeClickable(el) ||
    hasInteractiveAttributes(el) ||
    hasClickEventListener(el)
  );
}

function shouldIncludeClickTarget(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (!rectIntersectsViewport(rect)) return false;
  if (!isElementClickable(el)) return false;
  if (!isVisible(el)) return false;
  return true;
}

function collectClickTargetsFromRoot(
  root: Document | ShadowRoot,
  seen: Set<HTMLElement>,
  results: HTMLElement[],
): void {
  try {
    const candidates = root.querySelectorAll<HTMLElement>(
      CLICKABLE_CANDIDATES_SELECTOR,
    );

    for (const el of candidates) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!shouldIncludeClickTarget(el)) continue;
      results.push(el);
    }

    // Recurse into shadow DOM
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) {
        collectClickTargetsFromRoot(el.shadowRoot, seen, results);
      }
    }
  } catch (err) {
    console.warn("Jump: Error walking DOM:", err);
  }
}

function filterOutElementsWithDescendants(
  elements: HTMLElement[],
): HTMLElement[] {
  const hasClickableDescendant = new Set<HTMLElement>();

  for (let i = 0; i < elements.length; i++) {
    for (let j = 0; j < elements.length; j++) {
      if (i === j) continue;
      if (elements[i].contains(elements[j])) {
        hasClickableDescendant.add(elements[i]);
        break;
      }
    }
  }

  return elements.filter((el) => !hasClickableDescendant.has(el));
}

export function collectClickTargets(): HTMLElement[] {
  const clickableElements: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  collectClickTargetsFromRoot(document, seen, clickableElements);
  return filterOutElementsWithDescendants(clickableElements);
}

export function simulateClick(target: HTMLElement): void {
  try {
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

    // Only call native click() if it exists (some elements don't have it)
    if (typeof target.click === "function") {
      target.click();
    }
  } catch (err) {
    console.error("Jump: Error simulating click:", err);
  }
}
