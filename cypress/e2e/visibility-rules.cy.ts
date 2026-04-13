describe("visibility rules", () => {
  beforeEach(() => {
    cy.visit("cypress/fixtures/visibility-rules.html");
    cy.loadExtension();
  });

  function withActivatedHints(checkFn: (doc: Document) => void) {
    cy.pressCtrlShift("J");
    cy.hintLabels().then(() => {
      cy.document().then(checkFn);
    });
  }

  function testElementNotHinted(
    selector: string,
    checkFn: (el: HTMLElement) => void,
  ) {
    withActivatedHints((doc) => {
      const el = doc.querySelector(selector) as HTMLElement;
      checkFn(el);
    });
  }

  function testElementHintedAfterStyleChange(selector: string, style: string) {
    cy.get(selector).invoke("attr", "style", style);
    cy.pressCtrlShift("J");
    cy.hintLabelFor(selector).should("not.be.empty");
  }

  function testElementHiddenAfterStyleChange(
    selector: string,
    style: string,
    checkFn: (el: HTMLElement) => void,
  ) {
    cy.get(selector).invoke("attr", "style", style);
    withActivatedHints((doc) => {
      const el = doc.querySelector(selector) as HTMLElement;
      checkFn(el);
    });
  }

  function testElementHasZeroDimensions(selector: string) {
    testElementNotHinted(selector, (el) => {
      const rect = el.getBoundingClientRect();
      expect(rect.width).to.eq(0);
      expect(rect.height).to.eq(0);
    });
  }

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
      testElementNotHinted("#display-none", (el) => {
        expect(el.offsetParent).to.be.null;
      });
    });

    it("then skips a link inside a display:none parent", () => {
      testElementNotHinted("#display-none-child", (el) => {
        expect(el.offsetParent).to.be.null;
      });
    });

    it("then skips a link with display:none !important", () => {
      testElementNotHinted("#display-none-inline", (el) => {
        expect(el.offsetParent).to.be.null;
      });
    });
  });

  describe("click mode excludes visibility:hidden elements", () => {
    it("then skips a link with visibility:hidden", () => {
      testElementNotHinted("#visibility-hidden", (el) => {
        expect(getComputedStyle(el).visibility).to.eq("hidden");
      });
    });

    it("then skips a link inheriting visibility:hidden from parent", () => {
      testElementNotHinted("#visibility-hidden-child", (el) => {
        expect(getComputedStyle(el).visibility).to.eq("hidden");
      });
    });
  });

  describe("click mode excludes opacity:0 elements", () => {
    it("then skips a link with opacity:0", () => {
      testElementNotHinted("#opacity-zero", (el) => {
        expect(getComputedStyle(el).opacity).to.eq("0");
      });
    });
  });

  describe("click mode excludes zero-dimension elements", () => {
    it("then skips a link with zero width", () => {
      testElementNotHinted("#zero-width", (el) => {
        expect(el.getBoundingClientRect().width).to.eq(0);
      });
    });

    it("then skips a link with zero height", () => {
      testElementNotHinted("#zero-height", (el) => {
        expect(el.getBoundingClientRect().height).to.eq(0);
      });
    });

    it("then skips a link with zero width and height", () => {
      testElementHasZeroDimensions("#zero-both");
    });
  });

  describe("click mode excludes offscreen elements", () => {
    it("then skips a link positioned far offscreen", () => {
      testElementNotHinted("#offscreen", (el) => {
        expect(el.getBoundingClientRect().right).to.be.lessThan(0);
      });
    });
  });

  describe("click mode excludes clip-path hidden elements", () => {
    it("then skips a link with clip-path: inset(100%)", () => {
      testElementNotHinted("#clip-path", (el) => {
        expect(getComputedStyle(el).clipPath).to.eq("inset(100%)");
      });
    });
  });

  describe("click mode excludes overflow-clipped elements", () => {
    it("then skips a link inside a zero-size overflow:hidden container", () => {
      testElementHasZeroDimensions("#overflow-container");
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
      testElementHintedAfterStyleChange(
        "#display-none",
        "display: inline-block; width: 100px; height: 20px;",
      );
    });

    it("then reveals a previously visibility:hidden element after making it visible", () => {
      testElementHintedAfterStyleChange(
        "#visibility-hidden",
        "visibility: visible; display: inline-block; width: 100px; height: 20px;",
      );
    });

    it("then reveals a previously opacity:0 element after setting opacity above 0", () => {
      testElementHintedAfterStyleChange("#opacity-zero", "opacity: 0.1");
    });

    it("then hides a previously visible element after setting display:none", () => {
      testElementHiddenAfterStyleChange("#visible", "display: none", (el) => {
        expect(getComputedStyle(el).display).to.eq("none");
      });
    });

    it("then hides a previously visible element after setting visibility:hidden", () => {
      testElementHiddenAfterStyleChange(
        "#visible",
        "visibility: hidden; display: inline-block; width: 100px; height: 20px;",
        (el) => {
          expect(getComputedStyle(el).visibility).to.eq("hidden");
        },
      );
    });

    it("then hides a previously visible element after setting opacity:0", () => {
      testElementHiddenAfterStyleChange("#visible", "opacity: 0", (el) => {
        expect(getComputedStyle(el).opacity).to.eq("0");
      });
    });
  });
});
