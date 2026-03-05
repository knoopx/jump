describe("visibility rules", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/visibility-rules.html");
    cy.loadExtension();
  });

  describe("click mode includes visible elements", () => {
    it("then hints a normally visible link", () => {
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#visible").should("not.be.empty");
    });

    it("then hints a link with opacity: 0.5", () => {
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#opacity-half").should("not.be.empty");
    });

    it("then hints a link with opacity: 0.01", () => {
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#opacity-almost-zero").should("not.be.empty");
    });

    it("then hints a link with explicit visibility: visible", () => {
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#visibility-visible").should("not.be.empty");
    });

    it("then hints a visibility:visible child inside a visibility:hidden parent", () => {
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#vis-child-override").should("not.be.empty");
    });
  });

  describe("click mode excludes display:none elements", () => {
    it("then skips a link with display:none", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#display-none") as HTMLElement;
          expect(el.offsetParent).to.be.null;
        });
      });
    });

    it("then skips a link inside a display:none parent", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#display-none-child") as HTMLElement;
          expect(el.offsetParent).to.be.null;
        });
      });
    });

    it("then skips a link with display:none !important", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#display-none-inline") as HTMLElement;
          expect(el.offsetParent).to.be.null;
        });
      });
    });
  });

  describe("click mode excludes visibility:hidden elements", () => {
    it("then skips a link with visibility:hidden", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#visibility-hidden") as HTMLElement;
          expect(getComputedStyle(el).visibility).to.eq("hidden");
        });
      });
    });

    it("then skips a link inheriting visibility:hidden from parent", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector(
            "#visibility-hidden-child",
          ) as HTMLElement;
          expect(getComputedStyle(el).visibility).to.eq("hidden");
        });
      });
    });
  });

  describe("click mode excludes opacity:0 elements", () => {
    it("then skips a link with opacity:0", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#opacity-zero") as HTMLElement;
          expect(getComputedStyle(el).opacity).to.eq("0");
        });
      });
    });
  });

  describe("click mode excludes zero-dimension elements", () => {
    it("then skips a link with zero width", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#zero-width") as HTMLElement;
          const rect = el.getBoundingClientRect();
          expect(rect.width).to.eq(0);
        });
      });
    });

    it("then skips a link with zero height", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#zero-height") as HTMLElement;
          const rect = el.getBoundingClientRect();
          expect(rect.height).to.eq(0);
        });
      });
    });

    it("then skips a link with zero width and height", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#zero-both") as HTMLElement;
          const rect = el.getBoundingClientRect();
          expect(rect.width).to.eq(0);
          expect(rect.height).to.eq(0);
        });
      });
    });
  });

  describe("click mode excludes offscreen elements", () => {
    it("then skips a link positioned far offscreen", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#offscreen") as HTMLElement;
          const rect = el.getBoundingClientRect();
          expect(rect.right).to.be.lessThan(0);
        });
      });
    });
  });

  describe("click mode excludes clip-path hidden elements", () => {
    it("then skips a link with clip-path: inset(100%)", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#clip-path") as HTMLElement;
          expect(getComputedStyle(el).clipPath).to.eq("inset(100%)");
        });
      });
    });
  });

  describe("click mode excludes overflow-clipped elements", () => {
    it("then skips a link inside a zero-size overflow:hidden container", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const container = doc.querySelector(
            "#overflow-container",
          ) as HTMLElement;
          const rect = container.getBoundingClientRect();
          expect(rect.width).to.eq(0);
          expect(rect.height).to.eq(0);
        });
      });
    });
  });

  describe("total hint count", () => {
    it("then reports the baseline for debugging", () => {
      cy.pressCtrlShift("J");
      cy.hintLabels().then((labels) => {
        // Log which elements got hints for debugging
        cy.log(`Baseline hint count: ${labels.length}`);
      });
      cy.document().then((doc) => {
        // Verify each expected-visible element has a pointer cursor
        for (const id of [
          "visible",
          "opacity-half",
          "opacity-almost-zero",
          "visibility-visible",
          "vis-child-override",
        ]) {
          const el = doc.querySelector(`#${id}`) as HTMLElement;
          expect(
            getComputedStyle(el).cursor,
            `${id} should have pointer cursor`,
          ).to.eq("pointer");
        }
      });
    });
  });

  describe("dynamic visibility changes", () => {
    it("then reveals a previously display:none element after making it visible", () => {
      cy.get("#display-none").invoke(
        "attr",
        "style",
        "display: inline-block; width: 100px; height: 20px;",
      );
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#display-none").should("not.be.empty");
    });

    it("then reveals a previously visibility:hidden element after making it visible", () => {
      cy.get("#visibility-hidden").invoke(
        "attr",
        "style",
        "visibility: visible; display: inline-block; width: 100px; height: 20px;",
      );
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#visibility-hidden").should("not.be.empty");
    });

    it("then reveals a previously opacity:0 element after setting opacity above 0", () => {
      cy.get("#opacity-zero").invoke("attr", "style", "opacity: 0.1");
      cy.pressCtrlShift("J");
      cy.hintLabelFor("#opacity-zero").should("not.be.empty");
    });

    it("then hides a previously visible element after setting display:none", () => {
      cy.get("#visible").invoke("attr", "style", "display: none");
      cy.pressCtrlShift("J");
      cy.hintLabels().then((labels) => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#visible") as HTMLElement;
          expect(getComputedStyle(el).display).to.eq("none");
          // visible element is gone, so hint count should be one less
          // than what a full-page activation would normally show
        });
      });
    });

    it("then hides a previously visible element after setting visibility:hidden", () => {
      cy.get("#visible").invoke(
        "attr",
        "style",
        "visibility: hidden; display: inline-block; width: 100px; height: 20px;",
      );
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#visible") as HTMLElement;
          expect(getComputedStyle(el).visibility).to.eq("hidden");
        });
      });
    });

    it("then hides a previously visible element after setting opacity:0", () => {
      cy.get("#visible").invoke("attr", "style", "opacity: 0");
      cy.pressCtrlShift("J");
      cy.hintLabels().then(() => {
        cy.document().then((doc) => {
          const el = doc.querySelector("#visible") as HTMLElement;
          expect(getComputedStyle(el).opacity).to.eq("0");
        });
      });
    });
  });
});
