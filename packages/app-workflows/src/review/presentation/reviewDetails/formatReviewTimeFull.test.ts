import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

describe("formatReviewTimeFull", () => {
    it("formats a valid date with its weekday, time and timezone", () => {
        const result = formatReviewTimeFull(new Date(2026, 9, 6, 14, 20).toISOString());
        expect(result).toMatch(/^Tue 6 Oct 2026, 14:20 /);
    });

    it("returns an empty string for an invalid date instead of throwing", () => {
        expect(formatReviewTimeFull("not a date")).toBe("");
    });
});
