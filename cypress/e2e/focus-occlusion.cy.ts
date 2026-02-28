describe("focus mode occlusion", () => {
  describe("given a page with a modal overlay covering background list items", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-modal-overlay.html");
      cy.loadExtension();
    });

    describe("when activating focus mode", () => {
      it("then shows hints only on modal list items, not occluded background ones", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 3);
      });
    });

    describe("when the overlay is removed", () => {
      it("then shows hints on the previously occluded background list items", () => {
        cy.get("#overlay").invoke("remove");
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 3);
      });
    });
  });
});
