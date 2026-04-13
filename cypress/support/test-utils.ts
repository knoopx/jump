/**
 * Shared test utilities for click and focus mode tests.
 * Reduces duplication across E2E test files.
 */

// Helper to activate hints and verify count
function activateHintsAndVerify(
  key: "J" | "K",
  expectedHintCount: number | string = "greaterThan",
) {
  cy.pressCtrlShift(key);
  if (typeof expectedHintCount === "number") {
    cy.hintLabels().should("have.length", expectedHintCount);
  } else {
    cy.hintLabels().should("have.length", expectedHintCount, 0);
  }
}

// Click mode: verify element is clicked after typing hint
export function testClickViaHint(
  selector: string,
  expectedHintCount: number | string = "greaterThan",
) {
  activateHintsAndVerify("J", expectedHintCount);
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
  activateHintsAndVerify("K", expectedHintCount);
  cy.hintLabelFor(selector).then((label) => {
    cy.typeHintSeq(label);
    cy.selectorBar().should("not.be.null");
    cy.document().then((doc) => {
      const el = doc.querySelector(selector) as HTMLElement;
      expect(el).to.have.attr("data-jump-focus");
    });
  });
}

// Helper: verify a key deactivates hints
function testKeyDeactivatesHints(key: string, expectedCount: number) {
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length", expectedCount);
  cy.pressKey(key);
  cy.hintLabels().should("have.length", 0);
}

// Common: verify Escape deactivates hints
export function testEscapeDeactivatesHints(expectedCount: number) {
  testKeyDeactivatesHints("Escape", expectedCount);
}

// Common: verify Backspace with empty input deactivates hints
export function testBackspaceDeactivatesHints(expectedCount: number) {
  testKeyDeactivatesHints("Backspace", expectedCount);
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

// Helper: select first focus hint and run test
export function withSelectedFocusHint(testFn: (labels: string[]) => void) {
  cy.pressCtrlShift("K");
  cy.hintLabels().then((labels) => {
    cy.typeHintSeq(labels[0]);
    testFn(labels);
  });
}

// Helper: select first focus hint and verify selector bar appears
export function selectFirstFocusHintAndVerifyBar() {
  cy.pressCtrlShift("K");
  cy.hintLabels().then((labels) => {
    cy.typeHintSeq(labels[0]);
    cy.selectorBar().should("not.be.null");
  });
}

// Focus mode: verify Escape exits focus mode
export function testEscapeExitsFocusMode() {
  cy.selectorBar().should("not.be.null");
  cy.pressKey("Escape");
  cy.selectorBar().should("be.null");
  cy.highlightedElement().should("be.null");
}

// Helper: click via hint and perform assertion
function clickViaHintAndAssert(
  selector: string,
  assertion: (el: HTMLElement) => { verify: () => void; waitFor?: number },
) {
  cy.window().then((win) => {
    const el = win.document.querySelector(selector) as HTMLElement;
    const { verify, waitFor = 50 } = assertion(el);
    cy.pressCtrlShift("J");
    cy.hintLabels().should("have.length.greaterThan", 0);
    cy.hintLabelFor(selector).then((label) => {
      cy.typeHintSeq(label);
      cy.wait(waitFor).then(() => {
        verify();
      });
    });
  });
}

// Click event sequence: verify event listener is triggered
export function testEventListenerTriggered(
  selector: string,
  eventType: string,
) {
  clickViaHintAndAssert(selector, (el) => {
    let fired = false;
    el.addEventListener(eventType, () => {
      fired = true;
    });
    return {
      verify: () => {
        expect(fired).to.be.true;
      },
    };
  });
}

// Click event sequence: verify full event sequence
export function testFullEventSequence(selector: string) {
  clickViaHintAndAssert(selector, (el) => {
    const events: string[] = [];
    el.addEventListener("pointerdown", () => events.push("pointerdown"));
    el.addEventListener("mousedown", () => events.push("mousedown"));
    el.addEventListener("pointerup", () => events.push("pointerup"));
    el.addEventListener("mouseup", () => events.push("mouseup"));
    el.addEventListener("click", () => events.push("click"));
    return {
      verify: () => {
        expect(events).to.deep.equal([
          "pointerdown",
          "mousedown",
          "pointerup",
          "mouseup",
          "click",
        ]);
      },
    };
  });
}

// Click event sequence: verify event coordinates at element center
export function testEventCoordinatesAtCenter(selector: string) {
  clickViaHintAndAssert(selector, (el) => {
    let eventX = -1;
    let eventY = -1;
    el.addEventListener("mousedown", (e: MouseEvent) => {
      eventX = e.clientX;
      eventY = e.clientY;
    });
    return {
      verify: () => {
        const rect = el.getBoundingClientRect();
        expect(eventX).to.be.closeTo(rect.left + rect.width / 2, 1);
        expect(eventY).to.be.closeTo(rect.top + rect.height / 2, 1);
      },
    };
  });
}

// Helper: activate hints and type first character of first label
function activateAndTypeFirstChar() {
  cy.pressCtrlShift("J");
  cy.hintLabels().then((labels) => {
    const first = labels[0][0];
    cy.pressKey(first);
  });
}

// Input typing: verify hint characters do not leak into focused input
export function testHintCharactersDontLeakToSelector(
  inputSelector: string,
  hintSelector: string,
) {
  activateAndTypeFirstChar();
  cy.get(inputSelector).should("have.value", "");
}

// Helper: verify hints deactivated and input is clean
function verifyHintsDeactivatedAndInputClean(inputSelector: string) {
  cy.hintLabels().should("have.length", 0);
  cy.get(inputSelector).should("have.value", "");
}

// Input typing: verify Escape deactivates hints without leaking to input
export function testEscapeDeactivatesHintsNoLeak(inputSelector: string) {
  cy.pressCtrlShift("J");
  cy.hintLabels().should("have.length.greaterThan", 0);
  cy.pressKey("Escape");
  verifyHintsDeactivatedAndInputClean(inputSelector);
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
  verifyHintsDeactivatedAndInputClean(inputSelector);
}
