import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getTimeZoneOffset } from "./getTimeZoneOffset.js";

const HOUR = 3600000;

describe("getTimeZoneOffset (R319)", () => {
    it("is local minus UTC in milliseconds, in summer and in winter", () => {
        const summer = Date.parse("2026-10-20T12:00:00.000Z");
        const winter = Date.parse("2026-12-01T12:00:00.000Z");

        expect(getTimeZoneOffset(summer, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(winter, "Europe/Zagreb")).toBe(1 * HOUR);
        expect(getTimeZoneOffset(summer, "America/New_York")).toBe(-4 * HOUR);
        expect(getTimeZoneOffset(winter, "America/New_York")).toBe(-5 * HOUR);
        expect(getTimeZoneOffset(summer, "Asia/Tokyo")).toBe(9 * HOUR);
        expect(getTimeZoneOffset(summer, "UTC")).toBe(0);
    });

    it("truncates the instant to its whole second, so .999 has the offset of the same second", () => {
        const withMilliseconds = Date.parse("2026-10-20T21:59:59.999Z");
        const wholeSecond = Date.parse("2026-10-20T21:59:59.000Z");

        expect(getTimeZoneOffset(withMilliseconds, "Europe/Zagreb")).toBe(
            getTimeZoneOffset(wholeSecond, "Europe/Zagreb")
        );
        expect(getTimeZoneOffset(withMilliseconds, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(withMilliseconds, "America/New_York")).toBe(-4 * HOUR);
    });

    it("changes at the DST end in Zagreb and in New York", () => {
        const beforeZagreb = Date.parse("2026-10-25T00:59:59.999Z");
        const afterZagreb = Date.parse("2026-10-25T01:00:00.000Z");
        const beforeNewYork = Date.parse("2026-11-01T05:59:59.999Z");
        const afterNewYork = Date.parse("2026-11-01T06:00:00.000Z");

        expect(getTimeZoneOffset(beforeZagreb, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(afterZagreb, "Europe/Zagreb")).toBe(1 * HOUR);
        expect(getTimeZoneOffset(beforeNewYork, "America/New_York")).toBe(-4 * HOUR);
        expect(getTimeZoneOffset(afterNewYork, "America/New_York")).toBe(-5 * HOUR);
    });
});
