import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { DEFAULT_STEP_COLOUR } from "./stepColours.js";
import { FALLBACK_STEP_COLOUR } from "./stepColours.js";
import { HEX_COLOUR_MESSAGE } from "./stepColours.js";
import { STEP_COLOURS } from "./stepColours.js";
import { isHexColour } from "./isHexColour.js";

describe("STEP_COLOURS (R273)", () => {
    it("lists the ten presets in the prototype's order as theme token strings", () => {
        expect(STEP_COLOURS).toEqual([
            { label: "Orange", value: "var(--color-primary-500)" },
            { label: "Rust", value: "var(--color-primary-800)" },
            { label: "Amber", value: "var(--color-warning-600)" },
            { label: "Olive", value: "var(--color-warning-800)" },
            { label: "Teal", value: "var(--color-success-500)" },
            { label: "Green", value: "var(--color-success-800)" },
            { label: "Red", value: "var(--color-destructive-500)" },
            { label: "Maroon", value: "var(--color-destructive-700)" },
            { label: "Gray", value: "var(--color-neutral-500)" },
            { label: "Ink", value: "var(--color-neutral-900)" }
        ]);
    });

    it("takes Orange for a new step and a neutral token for an empty stored colour", () => {
        expect(DEFAULT_STEP_COLOUR).toBe("var(--color-primary-500)");
        expect(FALLBACK_STEP_COLOUR).toBe("var(--color-neutral-500)");
    });

    it("words the hex rule as the design does", () => {
        expect(HEX_COLOUR_MESSAGE).toBe("Enter a hex colour, e.g. #3B6FD4.");
    });
});

describe("isHexColour", () => {
    it("accepts #RRGGBB in either case", () => {
        expect(isHexColour("#3B6FD4")).toBe(true);
        expect(isHexColour("#3b6fd4")).toBe(true);
    });

    it("refuses anything else", () => {
        expect(isHexColour("#3B6FD")).toBe(false);
        expect(isHexColour("#3B6FD4A")).toBe(false);
        expect(isHexColour("3B6FD4")).toBe(false);
        expect(isHexColour("#GGGGGG")).toBe(false);
        expect(isHexColour("var(--color-primary-500)")).toBe(false);
        expect(isHexColour("")).toBe(false);
    });
});
