import { collectClickTargets, simulateClick } from "@/lib/click";
import {
  collectFocusTargets,
  enterFocus,
  exitFocus,
  focusActive,
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
      enterFocus(target, (clickTarget) => {
        syncModeAttr();
        if (clickTarget) simulateClick(clickTarget);
      });
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

    function suppress(e: KeyboardEvent): void {
      e.preventDefault();
      e.stopImmediatePropagation();
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
          suppress(e);
          handleCommand(e.key === "J" ? "activate-click" : "activate-focus");
          return;
        }

        if (!hintActive()) return;

        const isEditable =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable);

        if (isEditable) return;

        if (e.key === "Escape") {
          suppress(e);
          deactivateHints();
          return;
        }

        if (e.key === "Backspace") {
          suppress(e);
          handleBackspace();
          return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          suppress(e);
          handleKey(e.key.toLowerCase());
        }
      },
      true,
    );

    window.addEventListener(
      "keyup",
      (e) => {
        if (hintActive()) suppress(e);
      },
      true,
    );

    window.addEventListener(
      "keypress",
      (e) => {
        if (hintActive()) suppress(e);
      },
      true,
    );

    browser.runtime.onMessage.addListener((msg: { command: string }) => {
      handleCommand(msg.command);
    });
  },
});
