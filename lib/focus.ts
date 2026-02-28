import { type DepthLevel, buildLevels } from "./selectors";
import { isVisible } from "./visibility";

const FOCUSABLE_SELECTOR = [
  "li",
  "tr",
  "article",
  "section",
  "details",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "dt",
  "dd",
  "blockquote",
  "img",
].join(",");

function hasSameTagSiblings(el: HTMLElement): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  const tag = el.localName;
  let count = 0;
  for (const child of parent.children) {
    if (child.localName === tag && ++count > 1) return true;
  }
  return false;
}

function hasSharedClasses(el: HTMLElement): boolean {
  if (el.classList.length === 0) return false;
  const parent = el.parentElement;
  if (!parent) return false;
  const tag = el.localName;
  const siblings = [...parent.children].filter(
    (c) => c !== el && c.localName === tag,
  );
  if (siblings.length === 0) return false;
  for (const cls of el.classList) {
    if (siblings.every((s) => s.classList.contains(cls))) return true;
  }
  return false;
}

function collectTargetsFromRoot(root: Document | ShadowRoot): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  for (const el of root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (seen.has(el)) continue;
    if (!hasSameTagSiblings(el)) continue;
    seen.add(el);
    results.push(el);
  }

  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    if (seen.has(el)) continue;
    const isCustom = el.localName.includes("-");
    const isDiv = el.localName === "div";
    if (!isCustom && !isDiv) continue;
    if (isDiv && !(hasSameTagSiblings(el) && hasSharedClasses(el))) continue;
    if (isCustom && !hasSameTagSiblings(el)) continue;
    seen.add(el);
    results.push(el);
  }

  return results;
}

export function collectFocusTargets(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  for (const el of collectTargetsFromRoot(document)) {
    if (isVisible(el)) elements.push(el);
  }

  for (const el of document.querySelectorAll("*")) {
    if (el.shadowRoot) {
      for (const target of collectTargetsFromRoot(el.shadowRoot)) {
        if (isVisible(target) && !elements.includes(target))
          elements.push(target);
      }
    }
  }

  return elements;
}

let focusLevels: DepthLevel[] = [];
let focusDepth = -1;
let focusIndex = 0;
let muteStyle: HTMLStyleElement | null = null;
let selectorBar: HTMLElement | null = null;
let highlightOverlay: HTMLElement | null = null;
let highlightTarget: HTMLElement | null = null;
let onExitCallback: ((target: HTMLElement | null) => void) | null = null;

function positionOverlay(): void {
  if (!highlightOverlay || !highlightTarget) return;
  const rect = highlightTarget.getBoundingClientRect();
  const pad = 16;
  const top = rect.top + window.scrollY - pad;
  const left = rect.left + window.scrollX - pad;
  Object.assign(highlightOverlay.style, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
  });
}

function onScrollReposition(): void {
  positionOverlay();
}

function highlightAnchor(el: HTMLElement): void {
  removeHighlight();
  highlightTarget = el;
  el.setAttribute("data-jump-focus", "");
  highlightOverlay = document.createElement("div");
  Object.assign(highlightOverlay.style, {
    position: "absolute",
    border: "2px solid #a78bfa",
    borderRadius: "4px",
    pointerEvents: "none",
    zIndex: "2147483646",
    boxSizing: "border-box",
  });
  document.documentElement.appendChild(highlightOverlay);
  positionOverlay();
  window.addEventListener("scroll", onScrollReposition, true);
}

function removeHighlight(): void {
  window.removeEventListener("scroll", onScrollReposition, true);
  highlightOverlay?.remove();
  highlightOverlay = null;
  highlightTarget?.removeAttribute("data-jump-focus");
  highlightTarget = null;
}

export function focusActive(): boolean {
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

  let node: HTMLElement | null = level.parent.parentElement;
  while (node && node !== document.documentElement) {
    node.setAttribute(MUTE_ANCESTOR, "");
    node = node.parentElement;
  }

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
  level.anchor.scrollIntoView({ block: "center" });
  highlightAnchor(level.anchor);
  showBar();
}

function suppress(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopImmediatePropagation();
}

function onKeyDown(e: KeyboardEvent): void {
  suppress(e);

  if (e.key === "j" || e.key === "k") {
    navigate(e.key === "j" ? 1 : -1);
  } else if (e.key === "d" || e.key === "f") {
    changeDepth(e.key === "d" ? 1 : -1);
  } else if (
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight"
  ) {
    navigateSpatial(e.key);
  } else if (e.key === "Enter") {
    const target = currentAnchor();
    const cb = onExitCallback;
    exitFocus();
    cb?.(target);
  } else if (e.key === "Escape") {
    const cb = onExitCallback;
    exitFocus();
    cb?.(null);
  }
}

function installKeyboardHandlers(): void {
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", suppress, true);
  window.addEventListener("keypress", suppress, true);
}

function removeKeyboardHandlers(): void {
  window.removeEventListener("keydown", onKeyDown, true);
  window.removeEventListener("keyup", suppress, true);
  window.removeEventListener("keypress", suppress, true);
}

export function enterFocus(
  el: HTMLElement,
  onExit: (target: HTMLElement | null) => void,
): void {
  focusLevels = buildLevels(el);
  if (focusLevels.length === 0) {
    const tag = CSS.escape(el.localName);
    focusLevels = [
      {
        selector: tag,
        count: 1,
        anchor: el,
        parent: el.parentElement ?? document.body,
      },
    ];
  }
  focusDepth = 0;
  focusIndex = 0;
  onExitCallback = onExit;
  installKeyboardHandlers();
  applyFocusLevel();
}

export function exitFocus(): void {
  removeKeyboardHandlers();
  onExitCallback = null;
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
  matches[next].scrollIntoView({ block: "center" });
  highlightAnchor(matches[next]);
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
    best.scrollIntoView({ block: "center" });
    highlightAnchor(best);
    showBar();
  }
}

function changeDepth(delta: number): void {
  const next = focusDepth + delta;
  if (next < 0 || next >= focusLevels.length) return;
  focusDepth = next;
  applyFocusLevel();
}

export function currentAnchor(): HTMLElement | null {
  return currentLevel()?.anchor ?? null;
}
