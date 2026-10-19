import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { normaliseReason } from "./normaliseReason.js";

describe("normaliseReason (R328, Q65)", () => {
    it("trims the reason and keeps the whitespace inside it", () => {
        expect(normaliseReason("  On  leave \n")).toBe("On  leave");
    });

    it("is null for an empty reason and for whitespace only", () => {
        expect(normaliseReason("")).toBeNull();
        expect(normaliseReason("   \n\t  ")).toBeNull();
    });

    it("keeps a reason of exactly 500 characters", () => {
        const reason = "a".repeat(500);

        expect(normaliseReason(reason)).toBe(reason);
    });

    it("cuts a longer reason to 500 characters after trimming", () => {
        const long = "b".repeat(600);
        const padded = `   ${long}   `;

        const result = normaliseReason(padded);

        expect(result).toBe("b".repeat(500));
        expect(result?.length).toBe(500);
    });
});
