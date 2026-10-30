import { afterAll } from "vitest";
import { beforeAll } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatDateForDisplay } from "./dateHelpers.js";
import { parseDateValue } from "./dateHelpers.js";

const originalTimeZone = process.env.TZ;

const useTimeZone = (timeZone: string): void => {
    process.env.TZ = timeZone;
};

const restoreTimeZone = (): void => {
    if (originalTimeZone === undefined) {
        delete process.env.TZ;
        return;
    }
    process.env.TZ = originalTimeZone;
};

describe("date-only values in a zone west of UTC (America/New_York)", () => {
    beforeAll(() => {
        useTimeZone("America/New_York");
    });

    afterAll(() => {
        restoreTimeZone();
    });

    it("runs in the New York zone, where a UTC parse of a yyyy-MM-dd value lands on the previous day", () => {
        const utcMidnight = new Date("2026-10-20");

        expect(utcMidnight.getDate()).toBe(19);
        expect(utcMidnight.getHours()).toBe(20);
    });

    it("parses a yyyy-MM-dd value as local midnight of that day", () => {
        const date = parseDateValue("2026-10-20");

        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
        expect(date.toISOString()).toBe("2026-10-20T04:00:00.000Z");
    });

    it("parses a full ISO instant as before", () => {
        const value = "2026-10-20T02:00:00.000Z";

        const date = parseDateValue(value);

        expect(date.getTime()).toBe(Date.parse(value));
        expect(date.getDate()).toBe(19);
    });

    it("parses an ISO value with an offset as before", () => {
        const value = "2026-10-20T23:59:59.999+02:00";

        const date = parseDateValue(value);

        expect(date.toISOString()).toBe("2026-10-20T21:59:59.999Z");
    });

    it("parses a local date-time value as before", () => {
        const value = "2026-10-20T00:00:00";
        const expected = new Date(value);

        const date = parseDateValue(value);

        expect(date.getTime()).toBe(expected.getTime());
    });

    it("shows a yyyy-MM-dd value as that day with the default format", () => {
        const label = formatDateForDisplay("2026-10-20", "date");

        expect(label).toBe("October 20th, 2026");
    });

    it("shows a yyyy-MM-dd value as that day with a display format", () => {
        const label = formatDateForDisplay("2026-10-20", "date", "d MMM yyyy");

        expect(label).toBe("20 Oct 2026");
    });

    it("shows a full ISO instant on its local day as before", () => {
        const label = formatDateForDisplay("2026-10-20T02:00:00.000Z", "date");

        expect(label).toBe("October 19th, 2026");
    });

    it("shows nothing for no value", () => {
        const label = formatDateForDisplay(undefined, "date");

        expect(label).toBeUndefined();
    });

    it("leaves the local date-time display unchanged", () => {
        const label = formatDateForDisplay(
            "2026-10-20T02:00:00.000Z",
            "dateTimeLocal",
            "yyyy-MM-dd HH:mm"
        );

        expect(label).toBe("2026-10-19 22:00");
    });
});

describe("date-only values in a zone east of UTC (Asia/Tokyo)", () => {
    beforeAll(() => {
        useTimeZone("Asia/Tokyo");
    });

    afterAll(() => {
        restoreTimeZone();
    });

    it("parses a yyyy-MM-dd value as local midnight of that day", () => {
        const date = parseDateValue("2026-10-20");

        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.toISOString()).toBe("2026-10-19T15:00:00.000Z");
    });

    it("shows a yyyy-MM-dd value as that day", () => {
        const label = formatDateForDisplay("2026-10-20", "date", "d MMM yyyy");

        expect(label).toBe("20 Oct 2026");
    });
});

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
