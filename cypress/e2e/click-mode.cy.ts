describe("click mode", () => {
  describe("given a page with clickable links", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-basic.html");
      cy.loadExtension();
    });

    describe("when activating with Ctrl+Shift+J", () => {
      it("then shows hint overlays on each link", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
      });

      it("then each hint has unique label text", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          const unique = new Set(labels);
          expect(unique.size).to.eq(labels.length);
        });
      });
    });

    describe("when typing a complete hint label", () => {
      it("then triggers click on the matching element", () => {
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

      it("then removes all hint overlays", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.get("a")
            .first()
            .then(($el) => {
              $el[0].addEventListener("click", (e) => e.preventDefault());
              cy.typeHintSeq(labels[0]);
              cy.hintLabels().should("have.length", 0);
            });
        });
      });
    });

    describe("when pressing Escape during hint selection", () => {
      it("then deactivates all hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
        cy.pressKey("Escape");
        cy.hintLabels().should("have.length", 0);
      });
    });

    describe("when typing non-matching characters", () => {
      it("then deactivates hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
        cy.pressKey("z");
        cy.pressKey("z");
        cy.pressKey("z");
        cy.hintLabels().should("have.length", 0);
      });
    });

    describe("when toggling hint mode twice", () => {
      it("then deactivates on second press", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
        cy.wait(150);
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with many links (multi-char labels)", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-many-links.html");
      cy.loadExtension();
    });

    describe("when typing first character of a multi-char label", () => {
      it("then filters hints to matching subset", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          expect(labels.length).to.eq(15);
          cy.pressKey(labels[0][0]);
          cy.hintLabels().should("have.length.lessThan", 15);
        });
      });
    });

    describe("when pressing Backspace after filtering", () => {
      it("then restores all hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().then((labels) => {
          cy.pressKey(labels[0][0]);
          cy.hintLabels().should("have.length.lessThan", 15);
          cy.pressKey("Backspace");
          cy.hintLabels().should("have.length", 15);
        });
      });
    });

    describe("when pressing Backspace with no typed characters", () => {
      it("then deactivates hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 15);
        cy.pressKey("Backspace");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with duplicate href links", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-duplicate-href.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints on all visible links", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 3);
      });
    });
  });

  describe("given a page with hidden elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-hidden.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then excludes hidden and zero-size elements", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 1);
      });
    });
  });

  describe("given an input element is focused", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-input-focus.html");
      cy.loadExtension();
    });

    describe("when pressing Ctrl+Shift+J while input is focused", () => {
      it("then still activates hint mode", () => {
        cy.get("#search").focus();
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length.greaterThan", 0);
      });
    });
  });

  describe("given no clickable elements on page", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-empty.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows no hints", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 0);
      });
    });
  });

  describe("given a page with shadow DOM elements", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-shadow-dom.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints on links inside shadow roots", () => {
        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 2);
      });
    });

    describe("when clicking a shadow DOM link hint", () => {
      it("then triggers click on the shadow element", () => {
        // fixture only has shadow links, so any hint is a shadow element
        cy.window().then((win) => {
          (win as any).__shadowClicked = false;
          const shadowRoot =
            win.document.querySelector("nav-sidebar")!.shadowRoot!;
          for (const link of shadowRoot.querySelectorAll("a[href]")) {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              (win as any).__shadowClicked = true;
            });
          }
        });

        cy.pressCtrlShift("J");
        cy.hintLabels().should("have.length", 2);
        cy.hintLabels().then((labels) => {
          cy.typeHintSeq(labels[0]);
        });
        cy.window().its("__shadowClicked").should("eq", true);
      });
    });
  });

  describe("given a page with nested shadow DOM", () => {
    beforeEach(() => {
      cy.visit("cypress/fixtures/click-nested-shadow.html");
      cy.loadExtension();
    });

    describe("when activating click mode", () => {
      it("then shows hints on links in nested shadow roots", () => {
        cy.pressCtrlShift("J");
        // outer shadow has 1 link + inner-nav, inner shadow has 2 links
        cy.hintLabels().should("have.length.greaterThan", 1);
      });
    });
  });
});
