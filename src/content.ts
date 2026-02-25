import {
  type ActiveHint,
  CLICKABLE_SELECTOR,
  filterHints,
  removeHints,
  showHints,
} from "./hints";
import { type DepthLevel, buildLevels } from "./selectors";

type Mode = "click" | "focus";

let active = false;
let mode: Mode = "click";
let hints: ActiveHint[] = [];
let typed = "";

// --- Focus navigation state ---

let focusLevels: DepthLevel[] = [];
let focusDepth = -1;
let focusIndex = 0;
let muteStyle: HTMLStyleElement | null = null;
let selectorBar: HTMLElement | null = null;
let highlightedEl: HTMLElement | null = null;
let highlightPrevStyles = { outline: "", outlineOffset: "", borderRadius: "" };

function highlightAnchor(el: HTMLElement): void {
  removeHighlight();
  highlightedEl = el;
  highlightPrevStyles = {
    outline: el.style.outline,
    outlineOffset: el.style.outlineOffset,
    borderRadius: el.style.borderRadius,
  };
  el.style.outline = "2px solid rgba(167, 139, 250, 1)";
  el.style.outlineOffset = "16px";
  el.style.borderRadius = "2px";
}

function removeHighlight(): void {
  if (highlightedEl) {
    highlightedEl.style.outline = highlightPrevStyles.outline;
    highlightedEl.style.outlineOffset = highlightPrevStyles.outlineOffset;
    highlightedEl.style.borderRadius = highlightPrevStyles.borderRadius;
    highlightedEl = null;
    highlightPrevStyles = { outline: "", outlineOffset: "", borderRadius: "" };
  }
}

function focusActive(): boolean {
  return focusDepth >= 0 && focusLevels.length > 0;
}

function currentLevel(): DepthLevel | null {
  return focusLevels[focusDepth] ?? null;
}

function focusMatches(): HTMLElement[] {
  const level = currentLevel();
  if (!level) return [];
  try {
    return [
      ...level.parent.querySelectorAll<HTMLElement>(
        `:scope > ${level.selector}`,
      ),
    ];
  } catch {
    return [];
  }
}

// --- Focus UI ---

function showBar(): void {
  hideBar();
  const level = currentLevel();
  if (!level) return;
  const matches = focusMatches();
  const pos = matches.indexOf(level.anchor) + 1;

  selectorBar = document.createElement("div");
  Object.assign(selectorBar.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    padding: "6px 12px",
    background: "#1e1e2e",
    color: "#cdd6f4",
    fontSize: "12px",
    fontFamily: "monospace",
    borderRadius: "6px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
  });
  selectorBar.textContent = `${level.selector}  ${pos}/${matches.length}  [d↑ f↓]`;
  document.documentElement.appendChild(selectorBar);
}

function hideBar(): void {
  selectorBar?.remove();
  selectorBar = null;
}

const MUTE_ANCESTOR = "data-jump-ancestor";
const MUTE_PARENT = "data-jump-mute-parent";

function applyMute(): void {
  removeMute();
  const level = currentLevel();
  if (!level) return;

  // Mark ancestor chain from body down to (but excluding) parent
  let node: HTMLElement | null = level.parent.parentElement;
  while (node && node !== document.documentElement) {
    node.setAttribute(MUTE_ANCESTOR, "");
    node = node.parentElement;
  }

  // Mark parent for sibling dimming
  level.parent.setAttribute(MUTE_PARENT, "");

  const dimRule = "opacity: 0.15; transition: opacity 0.15s;";
  muteStyle = document.createElement("style");
  muteStyle.textContent = [
    `body > :not([${MUTE_ANCESTOR}]):not([${MUTE_PARENT}]) { ${dimRule} }`,
    `[${MUTE_ANCESTOR}] > :not([${MUTE_ANCESTOR}]):not([${MUTE_PARENT}]) { ${dimRule} }`,
    `[${MUTE_PARENT}] > :not(${level.selector}) { ${dimRule} }`,
  ].join("\n");
  document.head.appendChild(muteStyle);
}

function removeMute(): void {
  muteStyle?.remove();
  muteStyle = null;
  document
    .querySelectorAll(`[${MUTE_ANCESTOR}], [${MUTE_PARENT}]`)
    .forEach((el) => {
      el.removeAttribute(MUTE_ANCESTOR);
      el.removeAttribute(MUTE_PARENT);
    });
}

function applyFocusLevel(): void {
  const level = currentLevel();
  if (!level) return;
  applyMute();
  highlightAnchor(level.anchor);
  level.anchor.scrollIntoView({ block: "center" });
  showBar();
}

function enterFocus(el: HTMLElement): void {
  focusLevels = buildLevels(el);
  if (focusLevels.length === 0) {
    // No repeating levels found — use element's own tag as fallback
    const tag = CSS.escape(el.localName);
    focusLevels = [{ selector: tag, count: 1, anchor: el }];
  }
  focusDepth = 0;
  focusIndex = 0;
  applyFocusLevel();
}

function exitFocus(): void {
  focusLevels = [];
  focusDepth = -1;
  focusIndex = 0;
  removeMute();
  removeHighlight();
  hideBar();
  (document.activeElement as HTMLElement)?.blur();
}

function navigate(delta: number): void {
  const matches = focusMatches();
  if (matches.length === 0) return;
  const level = currentLevel()!;
  const idx = matches.indexOf(level.anchor);
  const next = idx + delta;
  if (next < 0 || next >= matches.length) return;
  level.anchor = matches[next];
  highlightAnchor(matches[next]);
  matches[next].scrollIntoView({ block: "center" });
  showBar();
}

function navigateSpatial(key: string): void {
  const matches = focusMatches();
  const level = currentLevel();
  if (!level || matches.length === 0) return;
  const cur = level.anchor.getBoundingClientRect();
  const cx = cur.left + cur.width / 2;
  const cy = cur.top + cur.height / 2;

  let best: HTMLElement | null = null;
  let bestDist = Infinity;

  for (const el of matches) {
    if (el === level.anchor) continue;
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;
    const dx = ex - cx;
    const dy = ey - cy;

    let valid = false;
    if (key === "ArrowUp") valid = dy < 0;
    else if (key === "ArrowDown") valid = dy > 0;
    else if (key === "ArrowLeft") valid = dx < 0;
    else if (key === "ArrowRight") valid = dx > 0;
    if (!valid) continue;

    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = el;
    }
  }

  if (best) {
    level.anchor = best;
    highlightAnchor(best);
    best.scrollIntoView({ block: "center" });
    showBar();
  }
}

function changeDepth(delta: number): void {
  const next = focusDepth + delta;
  if (next < 0 || next >= focusLevels.length) return;
  focusDepth = next;
  applyFocusLevel();
}

// --- Hint mode ---

const FOCUS_STYLE = {
  background: "#a78bfa",
  border: "1px solid #7c3aed",
} as const;

function activateHints(m: Mode): void {
  (document.activeElement as HTMLElement)?.blur();
  typed = "";
  mode = m;
  hints = showHints(m === "focus" ? FOCUS_STYLE : undefined, m === "focus");
  if (hints.length === 0) return;
  active = true;
}

function deactivateHints(): void {
  removeHints();
  hints = [];
  typed = "";
  active = false;
}

function handleKey(key: string): void {
  typed += key;
  const matching = filterHints(hints, typed);

  if (matching.length === 0) {
    deactivateHints();
    return;
  }

  if (matching.length === 1 && matching[0].label === typed) {
    const target = matching[0].element;
    deactivateHints();
    if (mode === "focus") {
      enterFocus(target);
    } else {
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const shared = {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      };
      target.dispatchEvent(new MouseEvent("mousedown", shared));
      target.focus();
      target.dispatchEvent(new MouseEvent("mouseup", shared));
      target.dispatchEvent(new MouseEvent("click", shared));
    }
  }
}

function handleBackspace(): void {
  if (typed.length === 0) {
    deactivateHints();
    return;
  }
  typed = typed.slice(0, -1);
  filterHints(hints, typed);
}

// --- Event handler ---

document.addEventListener(
  "keydown",
  (e) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)
    ) {
      return;
    }

    // Ctrl+Shift+J/K — activate hint mode (or exit focus to re-enter)
    if (
      (e.key === "J" || e.key === "K") &&
      e.ctrlKey &&
      e.shiftKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleCommand(e.key === "J" ? "activate-click" : "activate-focus");
      return;
    }

    // --- Focus mode keys (only when focus is active, hints are not) ---
    if (focusActive() && !active) {
      // j/k — next/prev match
      if (
        (e.key === "j" || e.key === "k") &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        navigate(e.key === "j" ? 1 : -1);
        return;
      }

      // d/f — broaden/narrow depth
      if (
        (e.key === "d" || e.key === "f") &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        changeDepth(e.key === "d" ? 1 : -1);
        return;
      }

      // Arrow keys — spatial navigation
      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        navigateSpatial(e.key);
        return;
      }

      // Enter — click current
      if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const level = currentLevel();
        if (level) {
          const target = level.anchor;
          const rect = target.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const shared = {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          };
          exitFocus();
          target.dispatchEvent(new MouseEvent("mousedown", shared));
          target.focus();
          target.dispatchEvent(new MouseEvent("mouseup", shared));
          target.dispatchEvent(new MouseEvent("click", shared));
          if (target instanceof HTMLAnchorElement && target.href) {
            window.location.href = target.href;
          }
        }
        return;
      }

      // Escape — exit focus
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        exitFocus();
        return;
      }
    }

    // --- Hint mode keys ---
    if (!active) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      deactivateHints();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleBackspace();
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleKey(e.key.toLowerCase());
    }
  },
  true,
);

function handleCommand(command: string): void {
  if (focusActive()) exitFocus();
  if (active) {
    deactivateHints();
  } else {
    activateHints(command === "activate-click" ? "click" : "focus");
  }
}

browser.runtime.onMessage.addListener((msg: { command: string }) => {
  handleCommand(msg.command);
});
