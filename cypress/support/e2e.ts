/// <reference types="cypress" />
export {};

Cypress.Commands.add("loadExtension", () => {
  cy.window().then((win) => {
    (win as any).browser = {
      runtime: {
        id: "test-extension",
        onMessage: { addListener: () => {} },
        getURL: (path: string) => path,
      },
    };
  });
  cy.readFile(".output/firefox-mv2/content-scripts/content.js").then((src) => {
    cy.document().then((doc) => {
      const script = doc.createElement("script");
      script.textContent = src;
      doc.documentElement.appendChild(script);
    });
  });
});

Cypress.Commands.add(
  "pressKey",
  (key: string, opts?: Partial<KeyboardEventInit>) => {
    cy.window().then((win) => {
      // Create the event in the app's context so prototype patches apply
      const e = new win.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...opts,
      });
      win.document.dispatchEvent(e);
    });
  },
);

Cypress.Commands.add("pressCtrlShift", (key: string) => {
  cy.pressKey(key, { ctrlKey: true, shiftKey: true });
});

Cypress.Commands.add("typeHintSeq", (label: string) => {
  for (const ch of label) {
    cy.pressKey(ch);
  }
});

Cypress.Commands.add("hintLabels", () => {
  return cy.document().then((doc) => {
    const overlays = [...doc.querySelectorAll<HTMLElement>("div")].filter(
      (d) =>
        d.style.position === "absolute" &&
        d.style.zIndex === "2147483647" &&
        d.style.display !== "none",
    );
    return overlays.map((h) => h.textContent ?? "");
  });
});

Cypress.Commands.add("selectorBar", () => {
  return cy.document().then((doc) => {
    const found =
      [...doc.querySelectorAll<HTMLElement>("div")].find(
        (d) => d.style.position === "fixed" && d.style.bottom === "24px",
      ) ?? null;
    return cy.wrap<HTMLElement | null>(found, { log: false });
  });
});

Cypress.Commands.add("highlightedElement", () => {
  return cy.document().then((doc) => {
    const found =
      [...doc.querySelectorAll<HTMLElement>("*")].find(
        (e) => e.style.outline === "2px solid #a78bfa",
      ) ?? null;
    return cy.wrap<HTMLElement | null>(found, { log: false });
  });
});

Cypress.Commands.add("muteStyleTag", () => {
  return cy.document().then((doc) => {
    const found =
      [...doc.querySelectorAll<HTMLStyleElement>("style")].find((s) =>
        s.textContent?.includes("data-jump-mute-parent"),
      ) ?? null;
    return cy.wrap<HTMLStyleElement | null>(found, { log: false });
  });
});

Cypress.Commands.add("hintLabelFor", (selector: string) => {
  return cy.document().then((doc) => {
    const target = doc.querySelector<HTMLElement>(selector);
    if (!target) throw new Error(`Element not found: ${selector}`);
    const targetRect = target.getBoundingClientRect();
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top + targetRect.height / 2;
    const overlays = [...doc.querySelectorAll<HTMLElement>("div")].filter(
      (d) =>
        d.style.position === "absolute" &&
        d.style.zIndex === "2147483647" &&
        d.style.display !== "none",
    );
    let bestLabel = "";
    let bestDist = Infinity;
    for (const o of overlays) {
      const ox = parseFloat(o.style.left) + o.offsetWidth / 2;
      const oy = parseFloat(o.style.top) + o.offsetHeight / 2;
      const dist = Math.hypot(ox - tx, oy - ty);
      if (dist < bestDist) {
        bestDist = dist;
        bestLabel = o.textContent ?? "";
      }
    }
    return bestLabel;
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loadExtension(): Chainable<void>;
      pressKey(key: string, opts?: Partial<KeyboardEventInit>): Chainable<void>;
      pressCtrlShift(key: string): Chainable<void>;
      typeHintSeq(label: string): Chainable<void>;
      hintLabels(): Chainable<string[]>;
      hintLabelFor(selector: string): Chainable<string>;
      selectorBar(): Chainable<HTMLElement | null>;
      highlightedElement(): Chainable<HTMLElement | null>;
      muteStyleTag(): Chainable<HTMLStyleElement | null>;
    }
  }
}
