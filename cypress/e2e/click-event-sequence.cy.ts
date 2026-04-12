describe("click event sequence", () => {
  describe("given a page with elements using different event listeners", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-react-delegation.html");
      cy.loadExtension();
    });

    it("then triggers click listener via hint", () => {
      testEventListenerTriggered("#link-nav", "click");
    });

    it("then triggers mousedown on mousedown-only listener", () => {
      testEventListenerTriggered("#react-btn", "mousedown");
    });

    it("then triggers pointerdown on pointerdown-only listener", () => {
      testEventListenerTriggered("#react-btn", "pointerdown");
    });

    it("then triggers full event sequence on React-style delegated button", () => {
      testFullEventSequence("#react-btn");
    });

    it("then dispatches events with coordinates at element center", () => {
      testEventCoordinatesAtCenter("#react-btn");
    });
  });
});
