import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatDateForDisplay, parseDateValue } from "./dateHelpers.js";

describe("dateHelpers in a timezone west of UTC", () => {
    const originalTz = process.env.TZ;

    beforeAll(() => {
        process.env.TZ = "America/Chicago";
    });

    afterAll(() => {
        process.env.TZ = originalTz;
    });

    it("should parse a bare date as that calendar day", () => {
        const date = parseDateValue("2026-10-10");
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(10);
    });

    it("should leave full ISO strings to the Date constructor", () => {
        const date = parseDateValue("2026-10-10T00:00:00.000Z");
        expect(date.toISOString()).toBe("2026-10-10T00:00:00.000Z");
    });

    it("should display a date-only value as the stored day", () => {
        expect(formatDateForDisplay("2026-10-10", "date")).toBe("October 10th, 2026");
    });

    it("should display a date range as the stored days", () => {
        expect(
            formatDateForDisplay(
                { from: "2026-10-10", to: "2026-10-12" },
                "dateRange",
                "yyyy-MM-dd"
            )
        ).toBe("2026-10-10 – 2026-10-12");
    });
});
