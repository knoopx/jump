import { collectClickTargets, simulateClick } from "@/lib/click";
import {
  changeDepth,
  collectFocusTargets,
  currentAnchor,
  enterFocus,
  exitFocus,
  focusActive,
  navigate,
  navigateSpatial,
} from "@/lib/focus";
import {
  type ActiveHint,
  filterHints,
  removeHints,
  showHints,
} from "@/lib/hints";

type Mode = "click" | "focus";

let active = false;
let mode: Mode = "click";
let hints: ActiveHint[] = [];
let typed = "";

const FOCUS_STYLE = {
  background: "#a78bfa",
  border: "1px solid #7c3aed",
} as const;

function hintActive(): boolean {
  return active;
}

function syncModeAttr(): void {
  if (active) {
    document.documentElement.dataset.jumpMode = "hint";
  } else if (focusActive()) {
    document.documentElement.dataset.jumpMode = "focus";
  } else {
    delete document.documentElement.dataset.jumpMode;
  }
}

function activateHints(m: Mode): void {
  typed = "";
  mode = m;

  const elements =
    m === "focus" ? collectFocusTargets() : collectClickTargets();
  if (elements.length === 0) return;

  hints = showHints(elements, m === "focus" ? FOCUS_STYLE : undefined);
  active = true;
  syncModeAttr();
}

function deactivateHints(): void {
  removeHints();
  hints = [];
  typed = "";
  active = false;
  syncModeAttr();
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
      syncModeAttr();
    } else {
      requestAnimationFrame(() => simulateClick(target));
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

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",

  main() {
    let lastCommandTime = 0;

    function handleCommand(command: string): void {
      const now = Date.now();
      if (now - lastCommandTime < 100) return;
      lastCommandTime = now;

      if (focusActive()) {
        exitFocus();
        syncModeAttr();
      }
      if (hintActive()) {
        deactivateHints();
      } else {
        activateHints(command === "activate-click" ? "click" : "focus");
      }
    }

    window.addEventListener(
      "keydown",
      (e) => {
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

        const isEditable =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable);

        if (isEditable && !hintActive()) {
          return;
        }

        if (focusActive() && !hintActive()) {
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

          if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const target = currentAnchor();
            if (target) {
              exitFocus();
              syncModeAttr();
              simulateClick(target);
            }
            return;
          }

          if (e.key === "Escape") {
            e.preventDefault();
            e.stopImmediatePropagation();
            exitFocus();
            syncModeAttr();
            return;
          }

          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        if (!hintActive()) return;

        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          pendingKeyups++;
          deactivateHints();
          return;
        }

        if (e.key === "Backspace") {
          e.preventDefault();
          e.stopImmediatePropagation();
          pendingKeyups++;
          handleBackspace();
          return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          pendingKeyups++;
          handleKey(e.key.toLowerCase());
        }
      },
      true,
    );

    let pendingKeyups = 0;

    function suppressKeyEvent(e: KeyboardEvent): void {
      if (e.type === "keyup" && pendingKeyups > 0) {
        pendingKeyups--;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (!focusActive() && !hintActive()) return;
      const isEditable =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);
      if (isEditable && !hintActive()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    window.addEventListener("keyup", suppressKeyEvent, true);
    window.addEventListener("keypress", suppressKeyEvent, true);

    browser.runtime.onMessage.addListener((msg: { command: string }) => {
      handleCommand(msg.command);
    });
  },
});
