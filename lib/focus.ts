import { type DepthLevel, buildLevels } from "./selectors";
import { rectIntersectsViewport, isVisible } from "./visibility";

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

  const sameTagSiblings = [...parent.children].filter(
    (c) => c !== el && c.localName === el.localName,
  ) as HTMLElement[];

  for (const cls of el.classList) {
    if (sameTagSiblings.every((s) => s.classList.contains(cls))) return true;
  }
  return false;
}

function shouldIncludeFocusableElement(el: HTMLElement): boolean {
  if (!hasSameTagSiblings(el)) return false;
  return true;
}

function passesSizeAndViewportCheck(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  return rectIntersectsViewport(rect);
}

function isDivOrCustomElement(el: HTMLElement): boolean {
  const name = el.localName;
  return name === "div" || name.includes("-");
}

function shouldIncludeDivOrCustomElement(el: HTMLElement): boolean {
  if (!isDivOrCustomElement(el)) return false;
  if (!passesSizeAndViewportCheck(el)) return false;
  if (!hasSameTagSiblings(el)) return false;
  return el.localName === "div" ? hasSharedClasses(el) : true;
}

function collectBySelector<T extends HTMLElement>(
  root: Document | ShadowRoot,
  selector: string,
  filter: (el: T) => boolean,
  seen: Set<HTMLElement>,
  results: HTMLElement[],
): void {
  for (const el of root.querySelectorAll<T>(selector)) {
    if (seen.has(el)) continue;
    if (!filter(el as T)) continue;
    seen.add(el);
    results.push(el);
  }
}

function collectTargetsFromRoot(root: Document | ShadowRoot): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  try {
    collectBySelector(
      root,
      FOCUSABLE_SELECTOR,
      shouldIncludeFocusableElement,
      seen,
      results,
    );
    collectBySelector(
      root,
      "div, :defined",
      shouldIncludeDivOrCustomElement,
      seen,
      results,
    );
  } catch (err) {
    console.warn("Jump: Error collecting focus targets:", err);
  }

  return results;
}

function addVisibleTargets(source: HTMLElement[], target: HTMLElement[]): void {
  for (const el of source) {
    if (isVisible(el) && !target.includes(el)) {
      target.push(el);
    }
  }
}

export function collectFocusTargets(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  try {
    addVisibleTargets(collectTargetsFromRoot(document), elements);

    for (const el of document.querySelectorAll("*")) {
      if (el.shadowRoot) {
        addVisibleTargets(collectTargetsFromRoot(el.shadowRoot), elements);
      }
    }
  } catch (err) {
    console.warn("Jump: Error collecting focus targets from document:", err);
  }

  return elements;
}

let focusLevels: DepthLevel[] = [];
let focusDepth = -1;
let focusIndex = 0;
let selectorBar: HTMLElement | null = null;
let spotlightOverlay: HTMLElement | null = null;
let highlightTarget: HTMLElement | null = null;
let onExitCallback: ((target: HTMLElement | null) => void) | null = null;

function positionSpotlight(): void {
  if (!spotlightOverlay || !highlightTarget) return;
  const rect = highlightTarget.getBoundingClientRect();
  const pad = 10;
  const radius = 8;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const t = rect.top - pad;
  const r = rect.right + pad;
  const b = rect.bottom + pad;
  const l = rect.left - pad;
  const cr = Math.min(radius, (r - l) / 2, (b - t) / 2);
  spotlightOverlay.style.clipPath = `path(evenodd,'M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z M ${l + cr} ${t} L ${r - cr} ${t} A ${cr} ${cr} 0 0 1 ${r} ${t + cr} L ${r} ${b - cr} A ${cr} ${cr} 0 0 1 ${r - cr} ${b} L ${l + cr} ${b} A ${cr} ${cr} 0 0 1 ${l} ${b - cr} L ${l} ${t + cr} A ${cr} ${cr} 0 0 1 ${l + cr} ${t} Z')`;
}

function onScrollReposition(): void {
  positionSpotlight();
}

function highlightAnchor(el: HTMLElement): void {
  removeHighlight();
  highlightTarget = el;
  el.setAttribute("data-jump-focus", "");
  spotlightOverlay = document.createElement("div");
  Object.assign(spotlightOverlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    pointerEvents: "none",
    zIndex: "2147483646",
    transition: "clip-path 0.15s ease",
  });
  document.documentElement.appendChild(spotlightOverlay);
  positionSpotlight();
  window.addEventListener("scroll", onScrollReposition, true);
}

function removeHighlight(): void {
  window.removeEventListener("scroll", onScrollReposition, true);
  spotlightOverlay?.remove();
  spotlightOverlay = null;
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

function applyFocusLevel(): void {
  const level = currentLevel();
  if (!level) return;
  level.anchor.scrollIntoView({ block: "center" });
  highlightAnchor(level.anchor);
  showBar();
}

function suppress(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopImmediatePropagation();
}

function handleNavigationKey(key: string): boolean {
  if (key === "j" || key === "k") {
    navigate(key === "j" ? 1 : -1);
    return true;
  }
  return false;
}

function handleDepthKey(key: string): boolean {
  if (key === "d" || key === "f") {
    changeDepth(key === "d" ? 1 : -1);
    return true;
  }
  return false;
}

const SPATIAL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function handleSpatialKey(key: string): boolean {
  if (SPATIAL_KEYS.has(key)) {
    navigateSpatial(key);
    return true;
  }
  return false;
}

function handleEnterKey(): void {
  const target = currentAnchor();
  const cb = onExitCallback;
  exitFocus();
  cb?.(target);
}

function handleEscapeKey(): void {
  const cb = onExitCallback;
  exitFocus();
  cb?.(null);
}

function onKeyDown(e: KeyboardEvent): void {
  suppress(e);

  if (handleNavigationKey(e.key)) return;
  if (handleDepthKey(e.key)) return;
  if (handleSpatialKey(e.key)) return;
  if (e.key === "Enter") {
    handleEnterKey();
    return;
  }
  if (e.key === "Escape") {
    handleEscapeKey();
    return;
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

function isDirectionValid(key: string, dx: number, dy: number): boolean {
  if (key === "ArrowUp") return dy < 0;
  if (key === "ArrowDown") return dy > 0;
  if (key === "ArrowLeft") return dx < 0;
  if (key === "ArrowRight") return dx > 0;
  return false;
}

function findBestSpatialTarget(
  matches: HTMLElement[],
  anchor: HTMLElement,
  cx: number,
  cy: number,
  key: string,
): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestDist = Infinity;

  for (const el of matches) {
    if (el === anchor) continue;
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;
    const dx = ex - cx;
    const dy = ey - cy;

    if (!isDirectionValid(key, dx, dy)) continue;

    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = el;
    }
  }
  return best;
}

function selectSpatialTarget(el: HTMLElement, level: DepthLevel): void {
  level.anchor = el;
  el.scrollIntoView({ block: "center" });
  highlightAnchor(el);
  showBar();
}

function navigateSpatial(key: string): void {
  const matches = focusMatches();
  const level = currentLevel();
  if (!level || matches.length === 0) return;
  const cur = level.anchor.getBoundingClientRect();
  const cx = cur.left + cur.width / 2;
  const cy = cur.top + cur.height / 2;

  const best = findBestSpatialTarget(matches, level.anchor, cx, cy, key);
  if (best) selectSpatialTarget(best, level);
}

function changeDepth(delta: number): void {
  const next = focusDepth + delta;
  if (next < 0 || next >= focusLevels.length) return;
  focusDepth = next;
  applyFocusLevel();
}

function currentAnchor(): HTMLElement | null {
  return currentLevel()?.anchor ?? null;
}
