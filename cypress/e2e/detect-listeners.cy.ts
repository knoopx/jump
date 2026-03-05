describe("clickable element detection (vimium-c style)", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/detect-listeners.html");
    cy.loadExtension();
  });

  describe("given elements with and without cursor: pointer", () => {
    describe("when activating click mode", () => {
      it("then shows no hints (no actual interactive elements)", () => {
        // Neither div has actual interactivity (no href, no event listeners, no tabindex)
        // cursor: pointer alone does not make an element clickable in vimium-c
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });
});
