import { selectors } from "./selectors";
import { type ActiveHint, relabelHints, removeHints, showHints } from "./hints";

const domain = window.location.hostname;
const domainSelectors = selectors[domain];

if (domainSelectors) {
  let active = false;
  let hints: ActiveHint[] = [];

  function activate(): void {
    hints = showHints(domainSelectors);
    if (hints.length === 0) return;
    active = true;
  }

  function deactivate(): void {
    removeHints(hints);
    hints = [];
    active = false;
  }

  function handleKey(key: string): void {
    const visible = hints.filter((h) => h.overlay.style.display !== "none");
    const matched = visible.filter((h) => h.label === key);

    if (matched.length === 1) {
      const target = matched[0].element;
      deactivate();
      target.focus();
      target.click();
      return;
    }

    const matchedGroups = new Set(matched.map((h) => h.group));
    if (matched.length > 1 && matchedGroups.size === 1) {
      matched[0].element.scrollIntoView({ block: "center", inline: "nearest" });
    }

    for (const hint of visible) {
      if (hint.label !== key) {
        hint.overlay.style.display = "none";
      }
    }

    relabelHints(hints);
  }

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

      if (e.key === "j" && e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (active) {
          deactivate();
        } else {
          activate();
        }
        return;
      }

      if (!active) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        deactivate();
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
}
