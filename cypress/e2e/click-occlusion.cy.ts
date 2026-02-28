describe("click mode occlusion", () => {
  describe("given a page with a modal overlay covering background elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-modal-overlay.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints only on modal elements, not occluded background ones", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 1);
      });

      it("then the visible hint corresponds to the modal link", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          expect(labels.length).to.eq(1);
          cy.get("#modal a").should("exist");
        });
      });
    });

    describe("when the overlay is removed", () => {
      it("then shows hints on the previously occluded background elements", () => {
        cy.get("#overlay").invoke("remove");
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 1);
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
        cy.hintLabels().should("have.length", 1);
      });

      it("then does not hint the footer link behind the banner", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 1);
      });
    });
  });
});
