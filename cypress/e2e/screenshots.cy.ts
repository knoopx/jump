describe("screenshots", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  describe("click mode", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/screenshot-click.html");
      cy.loadExtension();
    });

    it("captures click hints", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().should("have.length.greaterThan", 0);
      cy.screenshot("click-mode", { capture: "viewport", overwrite: true });
    });
  });

  describe("focus mode", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/screenshot-focus.html");
      cy.loadExtension();
    });

    it("captures focus hints", () => {
      cy.pressCtrlShift("K");
      cy.hintLabels().should("have.length.greaterThan", 0);
      cy.screenshot("focus-hints", { capture: "viewport", overwrite: true });
    });

    it("captures focus navigation", () => {
      cy.pressCtrlShift("K");
      cy.hintLabels().then((labels) => {
        cy.typeHintSeq(labels[0]);
        cy.selectorBar().should("not.be.null");
        cy.screenshot("focus-navigation", {
          capture: "viewport",
          overwrite: true,
        });
      });
    });
  });
});
