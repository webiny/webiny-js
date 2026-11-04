import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getZonedDateParts } from "./getZonedDateParts.js";

const END_OF_20_OCT_ZAGREB = Date.parse("2026-10-20T21:59:59.999Z");

const shortZoneName = (instant: number, timeZone: string): string => {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" });
    const parts = formatter.formatToParts(instant);
    const part = parts.find(candidate => candidate.type === "timeZoneName");
    if (!part) {
        return "";
    }
    return part.value;
};

describe("getZonedDateParts", () => {
    it("reads the wall-clock fields, the weekday and the zone name in Zagreb", () => {
        expect(getZonedDateParts(END_OF_20_OCT_ZAGREB, "Europe/Zagreb")).toEqual({
            year: 2026,
            month: 10,
            day: 20,
            hour: 23,
            minute: 59,
            second: 59,
            weekday: "Tue",
            zoneName: "CEST"
        });
    });

    it("reads the same instant in New York, Tokyo and UTC", () => {
        const newYork = getZonedDateParts(END_OF_20_OCT_ZAGREB, "America/New_York");
        const tokyo = getZonedDateParts(END_OF_20_OCT_ZAGREB, "Asia/Tokyo");
        const utc = getZonedDateParts(END_OF_20_OCT_ZAGREB, "UTC");

        expect(newYork).toMatchObject({ day: 20, hour: 17, minute: 59, weekday: "Tue" });
        expect(newYork.zoneName).toBe(shortZoneName(END_OF_20_OCT_ZAGREB, "America/New_York"));
        expect(tokyo).toMatchObject({ day: 21, hour: 6, minute: 59, weekday: "Wed" });
        expect(tokyo.zoneName).toBe(shortZoneName(END_OF_20_OCT_ZAGREB, "Asia/Tokyo"));
        expect(utc).toMatchObject({ day: 20, hour: 21, minute: 59, weekday: "Tue" });
        expect(utc.zoneName).toBe("UTC");
    });

    it("reads local midnight as hour 0", () => {
        const midnight = Date.parse("2026-10-19T22:00:00.000Z");

        expect(getZonedDateParts(midnight, "Europe/Zagreb")).toMatchObject({
            day: 20,
            hour: 0,
            minute: 0,
            second: 0
        });
    });
});
