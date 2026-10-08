import { describe, expect, it } from "vitest";
import { bindingCrossesFamily, crossesFamily } from "./colourFamilies.js";

// Cases from the five demo sites' stored plans.
describe("crossesFamily", () => {
    it("refuses a background mapped to a text token", () => {
        // thevibe's Hero Intro overlay: #808080 -> color.text.muted.
        expect(crossesFamily("background", "color.text.muted")).toBe(true);
        // 2424 Tulane's highlights: #262626 -> color.text.primary.
        expect(crossesFamily("background", "color.text.primary")).toBe(true);
    });

    it("refuses text mapped to a surface token and a border mapped to a text token", () => {
        expect(crossesFamily("text", "color.surface.sunken")).toBe(true);
        expect(crossesFamily("border", "color.text.primary")).toBe(true);
    });

    it("keeps same-family tokens, accent borders and borders in the page's surface", () => {
        expect(crossesFamily("background", "color.surface.raised")).toBe(false);
        expect(crossesFamily("text", "color.text.inverse")).toBe(false);
        expect(crossesFamily("border", "color.action.primary.background")).toBe(false);
        expect(crossesFamily("border", "color.surface.page")).toBe(false);
    });
});

describe("bindingCrossesFamily", () => {
    it("drops a background target bound to a text token", () => {
        expect(
            bindingCrossesFamily({ target: "root.background", token: "color.text.primary" })
        ).toBe(true);
        expect(
            bindingCrossesFamily({ target: "overlay.background", token: "color.text.muted" })
        ).toBe(true);
    });

    it("keeps bindings that agree, and targets that do not name a role", () => {
        expect(
            bindingCrossesFamily({ target: "section.background", token: "color.surface.overlay" })
        ).toBe(false);
        expect(bindingCrossesFamily({ target: "heading", token: "color.text.inverse" })).toBe(
            false
        );
        expect(bindingCrossesFamily({ target: "cta", token: "color.surface.page" })).toBe(false);
        expect(
            bindingCrossesFamily({ target: "heading.typography", token: "type.heading.2" })
        ).toBe(false);
    });
});
