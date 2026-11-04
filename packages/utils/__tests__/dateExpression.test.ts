import { describe, it, expect } from "vitest";
import {
    getLenientToday,
    getLocalToday,
    isDateExpression,
    parseDateExpression,
    resolveDateBound,
    resolveDateExpression
} from "~/dateExpression";

describe("parseDateExpression", () => {
    it.each([
        ["today", { amount: 0, unit: "d" }],
        ["today-18y", { amount: -18, unit: "y" }],
        ["today+1d", { amount: 1, unit: "d" }],
        ["today-6m", { amount: -6, unit: "m" }],
        [" today - 100y ", { amount: -100, unit: "y" }],
        ["today+0d", { amount: 0, unit: "d" }],
        ["today-1000y", { amount: -1000, unit: "y" }],
        ["today+12000m", { amount: 12000, unit: "m" }],
        ["today-366000d", { amount: -366000, unit: "d" }]
    ])("reads %j", (expression, expected) => {
        expect(parseDateExpression(expression)).toEqual(expected);
        expect(isDateExpression(expression)).toBe(true);
    });

    it.each([
        "",
        "now-18y",
        "today-18",
        "today-y",
        "today-18w",
        "today-18y+1d",
        "today-1.5y",
        "Today-18y",
        "2008-10-19",
        "today -18 years",
        "today-1001y",
        "today+12001m",
        "today-366001d",
        "today-99999999999y"
    ])("rejects %j", expression => {
        expect(parseDateExpression(expression)).toBeNull();
        expect(isDateExpression(expression)).toBe(false);
    });
});

describe("resolveDateExpression", () => {
    it.each([
        ["today", "2026-10-19", "2026-10-19"],
        ["today-18y", "2026-10-19", "2008-10-19"],
        ["today-100y", "2026-10-19", "1926-10-19"],
        ["today+1d", "2026-10-19", "2026-10-20"],
        ["today+1d", "2026-12-31", "2027-01-01"],
        ["today-1d", "2026-03-01", "2026-02-28"],
        ["today-1d", "2028-03-01", "2028-02-29"],
        ["today+3m", "2026-10-19", "2027-01-19"],
        ["today-10m", "2026-10-19", "2025-12-19"]
    ])("%s on %s is %s", (expression, today, expected) => {
        expect(resolveDateExpression(expression, today)).toBe(expected);
    });

    it("uses the month's last day when the day doesn't exist there", () => {
        expect(resolveDateExpression("today-1m", "2026-03-31")).toBe("2026-02-28");
        expect(resolveDateExpression("today-1m", "2028-03-31")).toBe("2028-02-29");
        expect(resolveDateExpression("today+1m", "2026-01-31")).toBe("2026-02-28");
        expect(resolveDateExpression("today+2m", "2026-08-31")).toBe("2026-10-31");
    });

    it("turns 29 February into 28 February in a year without one", () => {
        expect(resolveDateExpression("today-18y", "2028-02-29")).toBe("2010-02-28");
        expect(resolveDateExpression("today-4y", "2028-02-29")).toBe("2024-02-29");
    });

    it("reads only the date part of today", () => {
        expect(resolveDateExpression("today-18y", "2026-10-19T23:59:59.000Z")).toBe("2008-10-19");
    });

    it("throws on an expression or a today it can't read", () => {
        expect(() => resolveDateExpression("now-18y", "2026-10-19")).toThrow(
            'Invalid date expression "now-18y"'
        );
        expect(() => resolveDateExpression("today", "19.10.2026")).toThrow(
            'Invalid date "19.10.2026"'
        );
    });

    it("throws when the worked-out date falls outside 4-digit years", () => {
        expect(() => resolveDateExpression("today-1000y", "0500-06-01")).toThrow(
            "gives a date out of range"
        );
        expect(() => resolveDateExpression("today+1000y", "9500-06-01")).toThrow(
            "gives a date out of range"
        );
    });
});

describe("resolveDateBound", () => {
    it("keeps a fixed date and works out an expression", () => {
        expect(resolveDateBound("2000-12-31", "2026-10-19")).toBe("2000-12-31");
        expect(resolveDateBound({ expression: "today-18y" }, "2026-10-19")).toBe("2008-10-19");
    });
});

describe("getLocalToday", () => {
    it("formats the local date", () => {
        expect(getLocalToday(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    });
});

describe("getLenientToday", () => {
    it("gives the earliest date on Earth for a lower limit and the latest for an upper one", () => {
        // 11:00 UTC: UTC-12 is still on the 18th, UTC+14 is already on the 20th.
        const now = new Date("2026-10-19T11:00:00.000Z");
        expect(getLenientToday("gte", now)).toBe("2026-10-18");
        expect(getLenientToday("lte", now)).toBe("2026-10-20");
    });

    it("lands on the UTC date at the edges of the day", () => {
        // 12:00 UTC is midnight at UTC-12; 10:00 UTC is midnight at UTC+14.
        expect(getLenientToday("gte", new Date("2026-10-19T12:00:00.000Z"))).toBe("2026-10-19");
        expect(getLenientToday("gte", new Date("2026-10-19T11:59:59.999Z"))).toBe("2026-10-18");
        expect(getLenientToday("lte", new Date("2026-10-19T09:59:59.999Z"))).toBe("2026-10-19");
        expect(getLenientToday("lte", new Date("2026-10-19T10:00:00.000Z"))).toBe("2026-10-20");
    });
});
