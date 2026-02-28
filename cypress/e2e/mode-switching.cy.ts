describe("mode switching", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/mode-switching.html");
    cy.loadExtension();
  });

  describe("given click mode is active", () => {
    describe("when pressing Ctrl+Shift+K", () => {
      it("then deactivates click hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
        cy.wait(150);
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 0);
      });

      it("then a second Ctrl+Shift+K activates focus mode", () => {
        cy.pressCtrlShift("J");
        cy.wait(150);
        cy.pressCtrlShift("K");
        cy.wait(150);
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 3);
      });
    });
  });

  describe("given focus mode is active with a selected element", () => {
    describe("when pressing Ctrl+Shift+J to switch to click mode", () => {
      it("then exits focus and activates click hints", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          cy.wait(150);
          cy.pressCtrlShift("J");
          cy.selectorBar().should("be.null");
          cy.hintLabels().should("have.length", 3);
        });
      });
    });

    describe("when pressing Ctrl+Shift+K again", () => {
      it("then exits focus mode completely", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          cy.wait(150);
          cy.pressCtrlShift("K");
          cy.selectorBar().should("be.null");
          cy.highlightedElement().should("be.null");
          cy.muteStyleTag().should("be.null");
        });
      });
    });
  });

  describe("given focus mode is active", () => {
    describe("when pressing unbound keys", () => {
      it("then keys are suppressed and do not bubble", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.document().then((doc) => {
            let bubbled = false;
            doc.body.addEventListener("keydown", (e) => {
              if (e.key === "x") bubbled = true;
            });
            cy.pressKey("x").then(() => {
              expect(bubbled).to.be.false;
            });
          });
        });
      });
    });
  });
});
