describe("cursor pointer click detection", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/detect-listeners.html");
    cy.loadExtension();
  });

  describe("given an element with cursor: pointer", () => {
    describe("when activating click mode", () => {
      it("then shows a hint on the element", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 1);
      });
    });
  });

  describe("given an element with default cursor", () => {
    describe("when activating click mode", () => {
      it("then does not show a hint on the element", () => {
        cy.pressCtrlShift("J");
        cy.get("#default-target").then(($el) => {
          cy.hintLabels().should("have.length", 1);
          cy.wrap($el).should("not.have.attr", "data-hint");
        });
      });
    });
  });
});
