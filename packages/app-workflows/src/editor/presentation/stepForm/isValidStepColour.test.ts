import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isValidStepColour } from "./isValidStepColour.js";

describe("isValidStepColour (R273)", () => {
    it("accepts a preset token string", () => {
        expect(isValidStepColour("var(--color-primary-500)")).toBe(true);
    });

    it("accepts #RRGGBB in either case", () => {
        expect(isValidStepColour("#3B6FD4")).toBe(true);
        expect(isValidStepColour("#3b6fd4")).toBe(true);
    });

    it("rejects an unfinished or malformed hex", () => {
        expect(isValidStepColour("#")).toBe(false);
        expect(isValidStepColour("#3B6")).toBe(false);
        expect(isValidStepColour("#3B6FD4A")).toBe(false);
        expect(isValidStepColour("#GGGGGG")).toBe(false);
    });

    it("keeps a loaded value that is neither a preset nor a hex (it is not a hex error)", () => {
        expect(isValidStepColour("blue")).toBe(true);
        expect(isValidStepColour("")).toBe(true);
    });
});
