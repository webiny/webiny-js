import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatReviewTime } from "./formatReviewTime.js";

const NOW = new Date(2026, 9, 16, 15, 0);

const at = (year: number, month: number, day: number, hour: number, minute: number): string => {
    return new Date(year, month, day, hour, minute).toISOString();
};

describe("formatReviewTime (QBZ-54)", () => {
    it("returns an empty string for an invalid date", () => {
        expect(formatReviewTime("not a date", NOW)).toBe("");
    });

    it("shows today as the time only", () => {
        expect(formatReviewTime(at(2026, 9, 16, 14, 20), NOW)).toBe("14:20");
    });

    it("pads minutes and hours", () => {
        expect(formatReviewTime(at(2026, 9, 16, 9, 5), NOW)).toBe("09:05");
    });

    it("shows yesterday", () => {
        expect(formatReviewTime(at(2026, 9, 15, 14, 20), NOW)).toBe("Yesterday 14:20");
    });

    it("shows earlier this year with the day and month", () => {
        expect(formatReviewTime(at(2026, 9, 6, 14, 20), NOW)).toBe("6 Oct, 14:20");
    });

    it("shows older dates with the year", () => {
        expect(formatReviewTime(at(2025, 9, 6, 14, 20), NOW)).toBe("6 Oct 2025, 14:20");
    });
});
