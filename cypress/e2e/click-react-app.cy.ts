import {
  testBackspaceDeactivatesHints,
  testClickViaHint,
  testEscapeDeactivatesHints,
} from "../support/test-utils";

describe("click mode on aggressive SPA", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  describe("given a React-like app that calls stopImmediatePropagation on keydown", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-react-app.html");
      cy.loadExtension();
    });

    describe("when activating with Ctrl+Shift+J", () => {
      it("then shows hint overlays", () => {
        cy.pressCtrlShift("J");
        // 11 links + 4 buttons = 15 clickable elements
        cy.hintLabels().should("have.length", 15);
      });
    });

    describe("when typing hint characters that the page tries to eat", () => {
      it("then filters hints and clicks the target", () => {
        testClickViaHint("a", 15);
      });
    });

    describe("when pressing Escape that the page tries to eat", () => {
      it("then deactivates hints", () => {
        testEscapeDeactivatesHints(15);
      });
    });

    describe("when pressing Backspace with no typed characters", () => {
      it("then deactivates hints", () => {
        testBackspaceDeactivatesHints(15);
      });
    });
  });
});
