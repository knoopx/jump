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

  let elements: HTMLElement[] = [];
  try {
    elements = m === "focus" ? collectFocusTargets() : collectClickTargets();
  } catch (err) {
    console.error("Jump: Failed to collect targets:", err);
    deactivateHints();
    return;
  }

  if (elements.length === 0) {
    deactivateHints();
    return;
  }

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

function createCommandHandler() {
  let lastCommandTime = 0;

  return function handleCommand(command: string): void {
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
  };
}

function installKeyboardListeners(handleCommand: (cmd: string) => void): void {
  function suppress(e: KeyboardEvent): void {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function isModifierActive(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.altKey || e.metaKey;
  }

  function isJumpShortcut(e: KeyboardEvent): boolean {
    if (e.altKey || e.metaKey) return false;
    if (!e.ctrlKey || !e.shiftKey) return false;
    return e.key === "J" || e.key === "K";
  }

  function handleShortcutKeydown(e: KeyboardEvent): boolean {
    if (!isJumpShortcut(e)) return false;
    suppress(e);
    handleCommand(e.key === "J" ? "activate-click" : "activate-focus");
    return true;
  }

  function handleHintKeydown(e: KeyboardEvent): void {
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
    if (e.key.length === 1 && !isModifierActive(e)) {
      suppress(e);
      handleKey(e.key.toLowerCase());
    }
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (handleShortcutKeydown(e)) return;
      if (!hintActive()) return;
      handleHintKeydown(e);
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

  window.addEventListener(
    "beforeinput",
    (e) => {
      if (hintActive()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}

function installMessageListener(handleCommand: (cmd: string) => void): void {
  browser.runtime.onMessage.addListener((msg: { command: string }) => {
    handleCommand(msg.command);
  });
}

function installNavigationReset(): void {
  let lastUrl = location.href;

  function resetOnNavigation(): void {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (active || focusActive()) {
        if (focusActive()) exitFocus();
        deactivateHints();
        syncModeAttr();
      }
    }
  }

  window.addEventListener("popstate", resetOnNavigation);
  window.addEventListener("hashchange", resetOnNavigation);
  const observer = new MutationObserver(resetOnNavigation);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-url", "href"],
  });
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  main() {
    const handleCommand = createCommandHandler();
    installKeyboardListeners(handleCommand);
    installMessageListener(handleCommand);
    installNavigationReset();
  },
});
