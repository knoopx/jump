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
        cy.hintLabels().should("have.length", 11);
      });
    });

    describe("when typing hint characters that the page tries to eat", () => {
      it("then filters hints and clicks the target", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.get("a")
            .first()
            .then(($el) => {
              let clicked = false;
              $el[0].addEventListener("click", (e) => {
                e.preventDefault();
                clicked = true;
              });
              cy.typeHintSeq(labels[0]);
              cy.wait(50).then(() => {
                expect(clicked).to.be.true;
              });
            });
        });
      });
    });

    describe("when pressing Escape that the page tries to eat", () => {
      it("then deactivates hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 11);
        cy.pressKey("Escape");
        cy.hintLabels().should("have.length", 0);
      });
    });

    describe("when pressing Backspace with no typed characters", () => {
      it("then deactivates hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 11);
        cy.pressKey("Backspace");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });
});
