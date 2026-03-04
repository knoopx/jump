describe("hint typing on focused input", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/hint-input-typing.html");
    cy.loadExtension();
  });

  describe("given a text input is focused", () => {
    beforeEach(() => {
      cy.get("#text-input").focus();
    });

    describe("when activating click hints with Ctrl+Shift+J", () => {
      it("then shows hint overlays despite input focus", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
      });

      it("then does not type the activation key into the input", () => {
        cy.pressCtrlShift("J");
        cy.get("#text-input").should("have.value", "");
      });
    });

    describe("when typing hint characters with input focused", () => {
      it("then hint characters do not leak into the input", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          const first = labels[0][0];
          cy.pressKey(first);
          cy.get("#text-input").should("have.value", "");
        });
      });

      it("then filters hints matching the typed prefix", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          const initial = labels.length;
          cy.pressKey(labels[0][0]);
          cy.hintLabels().should("have.length.at.most", initial);
        });
      });

      it("then completing a label triggers click and clears hints", () => {
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
          cy.hintLabels().should("have.length", 0);
        });
      });
    });

    describe("when pressing Escape with input focused", () => {
      it("then deactivates hints without typing into input", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.pressKey("Escape");
        cy.hintLabels().should("have.length", 0);
        cy.get("#text-input").should("have.value", "");
      });
    });

    describe("when pressing Backspace with input focused", () => {
      it("then backspace controls hint filtering, not the input", () => {
        cy.get("#text-input").type("pre-existing");
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.pressKey(labels[0][0]);
          cy.pressKey("Backspace");
          cy.get("#text-input").should("have.value", "pre-existing");
        });
      });
    });
  });

  describe("given a textarea is focused", () => {
    beforeEach(() => {
      cy.get("#textarea").focus();
    });

    describe("when activating and typing hints", () => {
      it("then hint characters do not leak into textarea", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.pressKey(labels[0][0]);
          cy.get("#textarea").should("have.value", "");
        });
      });
    });
  });

  describe("given a contenteditable is focused", () => {
    beforeEach(() => {
      cy.get("#editable").focus();
    });

    describe("when activating and typing hints", () => {
      it("then hint characters do not insert into contenteditable", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.pressKey(labels[0][0]);
          cy.get("#editable").should("have.text", "editable");
        });
      });
    });
  });

  describe("given a select element is focused", () => {
    beforeEach(() => {
      cy.get("#select").focus();
    });

    describe("when activating hints", () => {
      it("then shows hints despite select focus", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
      });
    });
  });

  describe("given focus mode is active on a focused input", () => {
    beforeEach(() => {
      cy.get("#text-input").focus();
    });

    describe("when activating focus hints with Ctrl+Shift+K", () => {
      it("then shows focus hints despite input focus", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().should("have.length.greaterThan", 0);
      });

      it("then hint keystrokes do not leak into input", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.get("#text-input").should("have.value", "");
        });
      });
    });

    describe("when selecting a focus hint and navigating", () => {
      it("then j/k keystrokes do not type into the input", () => {
        cy.pressCtrlShift("K");
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
          cy.pressKey("j");
          cy.pressKey("k");
          cy.get("#text-input").should("have.value", "");
        });
      });
    });
  });

  describe("given hints are deactivated", () => {
    describe("when typing into the input after hint dismissal", () => {
      it("then input accepts keystrokes normally", () => {
        cy.get("#text-input").focus();
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.pressKey("Escape");
        cy.hintLabels().should("have.length", 0);
        cy.get("#text-input").type("hello");
        cy.get("#text-input").should("have.value", "hello");
      });
    });
  });

  describe("given rapid activation/deactivation with input focused", () => {
    describe("when toggling hints twice quickly", () => {
      it("then input remains clean and hints are removed", () => {
        cy.get("#text-input").focus();
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.wait(150);
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 0);
        cy.get("#text-input").should("have.value", "");
      });
    });
  });

  describe("given beforeinput suppression with input focused", () => {
    describe("when typing hint characters", () => {
      it("then beforeinput events do not reach the input", () => {
        cy.get("#text-input").focus();
        cy.window().then((win) => {
          let reachedInput = false;
          win.document
            .getElementById("text-input")!
            .addEventListener("beforeinput", () => {
              reachedInput = true;
            });

          cy.pressCtrlShift("J");
          cy.hintLabels().then((labels) => {
            const inputEvent = new win.InputEvent("beforeinput", {
              data: labels[0][0],
              inputType: "insertText",
              bubbles: true,
              cancelable: true,
              composed: true,
            });
            win.document
              .getElementById("text-input")!
              .dispatchEvent(inputEvent);

            cy.wrap(null).then(() => {
              expect(reachedInput).to.be.false;
              cy.get("#text-input").should("have.value", "");
            });
          });
        });
      });
    });
  });
});
