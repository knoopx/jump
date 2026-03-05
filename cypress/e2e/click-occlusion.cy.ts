describe("click mode occlusion", () => {
  describe("given a page with a modal overlay covering background elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-modal-overlay.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints only on modal elements, not occluded background ones", () => {
        cy.pressCtrlShift("J");
        // Modal has 1 link + 1 button = 2 clickable elements
        cy.hintLabels().should("have.length", 2);
      });

      it("then the visible hints correspond to modal link and button", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          expect(labels.length).to.eq(2);
          cy.get("#modal a").should("exist");
          cy.get("#modal button").should("exist");
        });
      });
    });

    describe("when the overlay is removed", () => {
      it("then shows hints on the previously occluded background elements", () => {
        cy.get("#overlay").invoke("remove");
        cy.pressCtrlShift("J");
        // Background has 1 link + 1 button = 2 clickable elements
        cy.hintLabels().should("have.length", 2);
      });
    });
  });

  describe("given a page with a popover partially covering elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-popover.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then excludes the occluded link behind the popover", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          expect(labels.length).to.eq(2);
        });
      });
    });

    describe("when the popover is removed", () => {
      it("then shows hints on all links", () => {
        cy.get("#popover").invoke("remove");
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 2);
      });
    });
  });

  describe("given a page with a fixed cookie banner covering footer elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-cookie-banner.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints on visible clickable elements", () => {
        cy.pressCtrlShift("J");
        // Top link + accept button = 2 visible clickable elements
        cy.hintLabels().should("have.length", 2);
      });

      it("then does not hint the footer link behind the banner", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          // Should have 2 hints (top link + accept button), not 3
          expect(labels.length).to.eq(2);
          // Verify footer link is not hinted
          cy.get("#accept").should("exist");
        });
      });
    });
  });
});
