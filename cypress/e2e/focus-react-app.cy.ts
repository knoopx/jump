describe("focus mode on aggressive SPA", () => {
  describe("given a React-like app that calls stopImmediatePropagation on keydown", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-react-app.html");
      cy.loadExtension();
    });

    describe("when activating with Ctrl+Shift+K", () => {
      it("then shows focus hints", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 4);
      });
    });

    describe("when selecting a hint with characters the page tries to eat", () => {
      it("then enters focus mode with selector bar", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
        });
      });
    });

    describe("when navigating with j/k that the page tries to eat", () => {
      it("then j moves to next sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.get("li.post")
            .eq(0)
            .should("have.attr", "data-jump-focus");
          cy.pressKey("j");
          cy.get("li.post")
            .eq(1)
            .should("have.attr", "data-jump-focus");
        });
      });

      it("then k moves to previous sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("j");
          cy.pressKey("k");
          cy.get("li.post")
            .eq(0)
            .should("have.attr", "data-jump-focus");
        });
      });
    });

    describe("when pressing Escape that the page tries to eat", () => {
      it("then exits focus mode", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          cy.pressKey("Escape");
          cy.selectorBar().should("be.null");
          cy.highlightedElement().should("be.null");
        });
      });
    });

    describe("when pressing Enter in focus mode", () => {
      it("then clicks the highlighted element", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.document().then((doc) => {
            let clicked = false;
            doc.addEventListener(
              "click",
              () => {
                clicked = true;
              },
              { once: true },
            );
            cy.pressKey("Enter").then(() => {
              expect(clicked).to.be.true;
            });
          });
        });
      });
    });
  });
});
