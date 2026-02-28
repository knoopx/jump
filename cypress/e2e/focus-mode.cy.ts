describe("focus mode", () => {
  describe("given a page with repeating list items", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-list.html");
      cy.loadExtension();
    });

    describe("when activating with Ctrl+Shift+K", () => {
      it("then shows hints on each repeating item", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 4);
      });
    });

    describe("when selecting a hint", () => {
      it("then shows the selector bar", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
        });
      });

      it("then highlights the selected element", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.get("li").first().should("have.attr", "data-jump-focus");
        });
      });

      it("then applies mute overlay to non-sibling content", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.muteStyleTag().should("not.be.null");
        });
      });

      it("then removes hint overlays", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.hintLabels().should("have.length", 0);
        });
      });
    });

    describe("when navigating with j/k", () => {
      it("then j moves highlight to next sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.get("li").eq(0).should("have.attr", "data-jump-focus");
          cy.pressKey("j");
          cy.get("li").eq(1).should("have.attr", "data-jump-focus");
        });
      });

      it("then k moves highlight to previous sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("j");
          cy.pressKey("j");
          cy.pressKey("k");
          cy.get("li").eq(1).should("have.attr", "data-jump-focus");
        });
      });

      it("then j does not go past last sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          for (let i = 0; i < 20; i++) cy.pressKey("j");
          cy.get("li").last().should("have.attr", "data-jump-focus");
        });
      });

      it("then k does not go before first sibling", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          for (let i = 0; i < 20; i++) cy.pressKey("k");
          cy.get("li").first().should("have.attr", "data-jump-focus");
        });
      });

      it("then selector bar persists during navigation", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          cy.pressKey("j");
          cy.pressKey("j");
          cy.pressKey("k");
          cy.selectorBar().should("not.be.null");
        });
      });
    });

    describe("when pressing Enter", () => {
      it("then triggers click on highlighted element", () => {
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

      it("then exits focus mode", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("Enter");
          cy.selectorBar().should("be.null");
          cy.highlightedElement().should("be.null");
          cy.muteStyleTag().should("be.null");
        });
      });
    });

    describe("when pressing Escape", () => {
      it("then removes selector bar", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("Escape");
          cy.selectorBar().should("be.null");
        });
      });

      it("then removes highlight", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("Escape");
          cy.highlightedElement().should("be.null");
        });
      });

      it("then removes mute overlay", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("Escape");
          cy.muteStyleTag().should("be.null");
        });
      });
    });

    describe("when toggling focus mode twice", () => {
      it("then exits on second Ctrl+Shift+K", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 4);
        cy.wait(150);
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with lone elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-lone.html");
      cy.loadExtension();
    });

    describe("when activating focus mode", () => {
      it("then shows no hints for non-repeating elements", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with divs sharing classes", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-shared-class.html");
      cy.loadExtension();
    });

    describe("when activating focus mode", () => {
      it("then shows hints on divs with shared class", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 3);
      });
    });
  });

  describe("given a page with divs without shared classes", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-no-shared-class.html");
      cy.loadExtension();
    });

    describe("when activating focus mode", () => {
      it("then shows no hints", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with multiple separate lists", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-multi-list.html");
      cy.loadExtension();
    });

    describe("when navigating with j/k after selecting from list1", () => {
      it("then stays within the same parent list", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          for (let i = 0; i < 10; i++) cy.pressKey("j");
          cy.get("#list2 li").each(($li) => {
            expect($li[0].hasAttribute("data-jump-focus")).to.be.false;
          });
        });
      });
    });
  });

  describe("given a page with nested depth levels", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-nested-depth.html");
      cy.loadExtension();
    });

    describe("when pressing d to change depth", () => {
      it("then selector bar persists after depth changes", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          for (let i = 0; i < 5; i++) cy.pressKey("d");
          cy.selectorBar().should("not.be.null");
        });
      });
    });

    describe("when pressing f to narrow depth", () => {
      it("then does not go below initial depth", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.selectorBar().should("not.be.null");
          cy.pressKey("f");
          cy.selectorBar().should("not.be.null");
        });
      });
    });
  });

  describe("given focus is active and input is focused", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/focus-input.html");
      cy.loadExtension();
    });

    describe("when pressing Ctrl+Shift+K while input is focused", () => {
      it("then still activates focus mode", () => {
        cy.get("#search").focus();
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length", 3);
      });
    });
  });
});
