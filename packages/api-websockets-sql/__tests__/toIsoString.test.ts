import { describe, it, expect } from "vitest";
import { toIsoString } from "../src/toIsoString.js";

const ISO = "2026-08-04T17:02:06.028Z";

describe("toIsoString", () => {
    it("should convert the Date that node-postgres and mysql2 return", () => {
        expect(toIsoString(new Date(ISO))).toBe(ISO);
    });

    it("should pass through the ISO string that better-sqlite3 returns", () => {
        expect(toIsoString(ISO)).toBe(ISO);
    });

    it("should read a T-less, zone-less timestamp as UTC", () => {
        expect(toIsoString("2026-08-04 17:02:06")).toBe("2026-08-04T17:02:06.000Z");
    });

    it("should preserve the instant, whatever shape it arrives in", () => {
        const date = new Date(ISO);

        expect(new Date(toIsoString(date)).getTime()).toBe(date.getTime());
        expect(new Date(toIsoString(ISO)).getTime()).toBe(date.getTime());
    });

    /**
     * These are the shapes that used to sort below any ISO string and silently drop a user's
     * connections from the recency filter. Throwing keeps that from happening quietly again.
     */
    it.each([
        ["null", null],
        ["undefined", undefined],
        ["a number", 1789041600028],
        ["an object", {}],
        ["an unparseable string", "not a date"]
    ])("should throw rather than stringify %s", (_label, value) => {
        expect(() => toIsoString(value)).toThrow(/websockets connection timestamp/);
    });
});
