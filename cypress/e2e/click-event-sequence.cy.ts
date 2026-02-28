describe("click event sequence", () => {
  describe("given a page with elements using different event listeners", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-react-delegation.html");
      cy.loadExtension();
    });

    it("then triggers click listener via hint", () => {
      cy.window().then((win) => {
        let clicked = false;
        win.document
          .getElementById("link-nav")!
          .addEventListener("click", (e) => {
            e.preventDefault();
            clicked = true;
          });
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.hintLabelFor("#link-nav").then((label) => {
          cy.typeHintSeq(label);
          cy.wait(50).then(() => {
            expect(clicked).to.be.true;
          });
        });
      });
    });

    it("then triggers mousedown on mousedown-only listener", () => {
      cy.window().then((win) => {
        let fired = false;
        win.document
          .getElementById("react-btn")!
          .addEventListener("mousedown", () => {
            fired = true;
          });
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.hintLabelFor("#react-btn").then((label) => {
          cy.typeHintSeq(label);
          cy.wait(50).then(() => {
            expect(fired).to.be.true;
          });
        });
      });
    });

    it("then triggers pointerdown on pointerdown-only listener", () => {
      cy.window().then((win) => {
        let fired = false;
        win.document
          .getElementById("react-btn")!
          .addEventListener("pointerdown", () => {
            fired = true;
          });
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.hintLabelFor("#react-btn").then((label) => {
          cy.typeHintSeq(label);
          cy.wait(50).then(() => {
            expect(fired).to.be.true;
          });
        });
      });
    });

    it("then triggers full event sequence on React-style delegated button", () => {
      cy.window().then((win) => {
        const events: string[] = [];
        const el = win.document.getElementById("react-btn")!;
        el.addEventListener("pointerdown", () => events.push("pointerdown"));
        el.addEventListener("mousedown", () => events.push("mousedown"));
        el.addEventListener("pointerup", () => events.push("pointerup"));
        el.addEventListener("mouseup", () => events.push("mouseup"));
        el.addEventListener("click", () => events.push("click"));
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.hintLabelFor("#react-btn").then((label) => {
          cy.typeHintSeq(label);
          cy.wait(50).then(() => {
            expect(events).to.deep.equal([
              "pointerdown",
              "mousedown",
              "pointerup",
              "mouseup",
              "click",
            ]);
          });
        });
      });
    });

    it("then dispatches events with coordinates at element center", () => {
      cy.window().then((win) => {
        let eventX = -1;
        let eventY = -1;
        const el = win.document.getElementById("react-btn")!;
        el.addEventListener("mousedown", (e) => {
          eventX = e.clientX;
          eventY = e.clientY;
        });
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
        cy.hintLabelFor("#react-btn").then((label) => {
          cy.typeHintSeq(label);
          cy.wait(50).then(() => {
            const rect = el.getBoundingClientRect();
            expect(eventX).to.be.closeTo(rect.left + rect.width / 2, 1);
            expect(eventY).to.be.closeTo(rect.top + rect.height / 2, 1);
          });
        });
      });
    });
  });
});
