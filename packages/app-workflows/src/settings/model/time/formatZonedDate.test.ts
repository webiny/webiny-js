import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ZonedDateParts } from "./ZonedDateParts.js";
import { formatZonedDate } from "./formatZonedDate.js";

const createParts = (overrides: Partial<ZonedDateParts>): ZonedDateParts => {
    return {
        year: 2026,
        month: 10,
        day: 20,
        hour: 23,
        minute: 59,
        second: 59,
        weekday: "Tue",
        zoneName: "CEST",
        ...overrides
    };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("formatZonedDate (R339)", () => {
    it("writes d Mon yyyy without padding the day", () => {
        const parts = createParts({ day: 3, month: 9 });

        expect(formatZonedDate(parts)).toBe("3 Sep 2026");
    });

    it("uses the fixed three-letter month names", () => {
        MONTHS.forEach((name, index) => {
            const parts = createParts({ month: index + 1, day: 1 });

            expect(formatZonedDate(parts)).toBe(`1 ${name} 2026`);
        });
    });
});
