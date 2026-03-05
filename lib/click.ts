import { rectIntersectsViewport, isVisible, isOccluded } from "./visibility";

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

// Check if element is natively clickable based on tag and attributes
function isNativeClickable(el: HTMLElement): boolean {
  const tag = el.localName;

  // Native clickable tags
  if (NATIVE_CLICKABLE_TAGS.has(tag)) {
    // Special handling for inputs
    if (tag === "input") {
      const input = el as HTMLInputElement;
      const type = input.type?.toLowerCase() || "text";
      // Hidden inputs are not clickable
      if (type === "hidden") return false;
      // Disabled inputs are not clickable (but we may still want to hint them)
      if (input.disabled) return false;
      return true;
    }

    // Special handling for buttons/selects
    if (tag === "button" || tag === "select") {
      const btn = el as HTMLButtonElement | HTMLSelectElement;
      if (btn.disabled) return false;
      return true;
    }

    // Anchors need an href to be clickable
    if (tag === "a") {
      const anchor = el as HTMLAnchorElement;
      return !!anchor.href || !!anchor.name;
    }

    return true;
  }

  return false;
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

export function collectClickTargets(): HTMLElement[] {
  const clickableElements: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  function walk(root: Document | ShadowRoot): void {
    try {
      // Query all elements that might be clickable
      const candidates = root.querySelectorAll<HTMLElement>(
        "*[tabindex],*[contenteditable],*[role],*[onclick],*[onmousedown],a,button,input,select,textarea,details,label,summary,option,menuitem,audio,video"
      );

      for (const el of candidates) {
        if (seen.has(el)) continue;
        seen.add(el);

        // Skip if element has no dimensions
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // Skip if not in viewport
        if (!rectIntersectsViewport(rect)) continue;

        // Check if element is clickable
        let isClickable = false;

        if (isNativeClickable(el)) {
          isClickable = true;
        } else if (hasInteractiveAttributes(el)) {
          isClickable = true;
        } else if (hasClickEventListener(el)) {
          isClickable = true;
        }

        if (!isClickable) continue;

        // Check visibility (including occlusion)
        if (!isVisible(el)) continue;

        clickableElements.push(el);
      }

      // Recurse into shadow DOM
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot && !seen.has(el as HTMLElement)) {
          walk(el.shadowRoot);
        }
      }
    } catch (err) {
      console.warn("Jump: Error walking DOM:", err);
    }
  }

  walk(document);

  // Filter out elements that have clickable descendants (we want the innermost element)
  const hasClickableDescendant = new Set<HTMLElement>();
  for (let i = 0; i < clickableElements.length; i++) {
    for (let j = 0; j < clickableElements.length; j++) {
      if (i === j) continue;
      if (clickableElements[i].contains(clickableElements[j])) {
        hasClickableDescendant.add(clickableElements[i]);
        break;
      }
    }
  }

  const elements: HTMLElement[] = [];
  for (const el of clickableElements) {
    if (hasClickableDescendant.has(el)) continue;
    elements.push(el);
  }

  return elements;
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
