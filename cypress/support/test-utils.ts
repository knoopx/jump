/**
 * Shared test utilities for click and focus mode tests.
 * Reduces duplication across E2E test files.
 */

// Click mode: verify element is clicked after typing hint
export function testClickViaHint(
  selector: string,
  expectedHintCount: number | string = "greaterThan",
) {
  cy.pressCtrlShift("J");
  if (typeof expectedHintCount === "number") {
    cy.hintLabels().should("have.length", expectedHintCount);
  } else {
    cy.hintLabels().should("have.length", expectedHintCount, 0);
  }
  cy.hintLabelFor(selector).then((label) => {
    cy.document().then((doc) => {
      const el = doc.querySelector(selector) as HTMLElement;
      let clicked = false;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        clicked = true;
      });
      cy.typeHintSeq(label);
      cy.wait(50).then(() => {
        expect(clicked).to.be.true;
      });
    });
  });
}

// Focus mode: verify element enters focus mode after typing hint
export function testFocusViaHint(
  selector: string,
  expectedHintCount: number | string = "greaterThan",
) {
  cy.pressCtrlShift("K");
  if (typeof expectedHintCount === "number") {
    cy.hintLabels().should("have.length", expectedHintCount);
  } else {
    cy.hintLabels().should("have.length", expectedHintCount, 0);
  }
  cy.hintLabelFor(selector).then((label) => {
    cy.typeHintSeq(label);
    cy.selectorBar().should("not.be.null");
    cy.document().then((doc) => {
      const el = doc.querySelector(selector) as HTMLElement;
      expect(el).to.have.attr("data-jump-focus");
    });
  });
}

// Common: verify Escape deactivates hints
export function testEscapeDeactivatesHints(expectedCount: number) {
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length", expectedCount);
  cy.pressKey("Escape");
  cy.hintLabels().should("have.length", 0);
}

// Common: verify Backspace with empty input deactivates hints
export function testBackspaceDeactivatesHints(expectedCount: number) {
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length", expectedCount);
  cy.pressKey("Backspace");
  cy.hintLabels().should("have.length", 0);
}

// Focus mode: verify Enter clicks highlighted element
export function testEnterClicksHighlighted() {
  cy.document().then((doc) => {
    let clicked = false;
    doc.addEventListener(
      "click",
      () => {
        clicked = true;
      },
      { once: true },
    );
    cy.pressKey("Enter").then(() => {
      expect(clicked).to.be.true;
    });
  });
}

// Focus mode: verify Escape exits focus mode
export function testEscapeExitsFocusMode() {
  cy.selectorBar().should("not.be.null");
  cy.pressKey("Escape");
  cy.selectorBar().should("be.null");
  cy.highlightedElement().should("be.null");
}

// Click event sequence: verify event listener is triggered
export function testEventListenerTriggered(
  selector: string,
  eventType: string,
) {
  cy.window().then((win) => {
    let fired = false;
    const el = win.document.querySelector(selector) as HTMLElement;
    el.addEventListener(eventType, () => {
      fired = true;
    });
    cy.pressCtrlShift("J");
    cy.hintLabels().should("have.length.greaterThan", 0);
    cy.hintLabelFor(selector).then((label) => {
      cy.typeHintSeq(label);
      cy.wait(50).then(() => {
        expect(fired).to.be.true;
      });
    });
  });
}

// Click event sequence: verify full event sequence
export function testFullEventSequence(selector: string) {
  cy.window().then((win) => {
    const events: string[] = [];
    const el = win.document.querySelector(selector) as HTMLElement;
    el.addEventListener("pointerdown", () => events.push("pointerdown"));
    el.addEventListener("mousedown", () => events.push("mousedown"));
    el.addEventListener("pointerup", () => events.push("pointerup"));
    el.addEventListener("mouseup", () => events.push("mouseup"));
    el.addEventListener("click", () => events.push("click"));
    cy.pressCtrlShift("J");
    cy.hintLabels().should("have.length.greaterThan", 0);
    cy.hintLabelFor(selector).then((label) => {
      cy.typeHintSeq(label);
      cy.wait(50).then(() => {
        expect(events).to.deep.equal([
          "pointerdown",
          "mousedown",
          "pointerup",
          "mouseup",
          "click",
        ]);
      });
    });
  });
}

// Click event sequence: verify event coordinates at element center
export function testEventCoordinatesAtCenter(selector: string) {
  cy.window().then((win) => {
    let eventX = -1;
    let eventY = -1;
    const el = win.document.querySelector(selector) as HTMLElement;
    el.addEventListener("mousedown", (e: MouseEvent) => {
      eventX = e.clientX;
      eventY = e.clientY;
    });
    cy.pressCtrlShift("J");
    cy.hintLabels().should("have.length.greaterThan", 0);
    cy.hintLabelFor(selector).then((label) => {
      cy.typeHintSeq(label);
      cy.wait(50).then(() => {
        const rect = el.getBoundingClientRect();
        expect(eventX).to.be.closeTo(rect.left + rect.width / 2, 1);
        expect(eventY).to.be.closeTo(rect.top + rect.height / 2, 1);
      });
    });
  });
}

// Input typing: verify hint characters do not leak into focused input
export function testHintCharactersDontLeakToSelector(
  inputSelector: string,
  hintSelector: string,
) {
  cy.pressCtrlShift("J");
  cy.hintLabels().then((labels) => {
    const first = labels[0][0];
    cy.pressKey(first);
    cy.get(inputSelector).should("have.value", "");
  });
}

// Input typing: verify Escape deactivates hints without leaking to input
export function testEscapeDeactivatesHintsNoLeak(inputSelector: string) {
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length.greaterThan", 0);
  cy.pressKey("Escape");
  cy.hintLabels().should("have.length", 0);
  cy.get(inputSelector).should("have.value", "");
}

// Input typing: verify input accepts keystrokes after hint dismissal
export function testInputAcceptsAfterDismissal(inputSelector: string) {
  cy.get(inputSelector).focus();
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length.greaterThan", 0);
  cy.pressKey("Escape");
  cy.hintLabels().should("have.length", 0);
  cy.get(inputSelector).type("hello");
  cy.get(inputSelector).should("have.value", "hello");
}

// Input typing: verify rapid toggle doesn't leak to input
export function testRapidToggleNoLeak(inputSelector: string) {
  cy.get(inputSelector).focus();
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length.greaterThan", 0);
  cy.wait(150);
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length", 0);
  cy.get(inputSelector).should("have.value", "");
}
