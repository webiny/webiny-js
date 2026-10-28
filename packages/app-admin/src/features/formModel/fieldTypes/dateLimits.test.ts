import { describe, it, expect } from "vitest";
import { getDateLimits, resolveDateLimits } from "./dateLimits.js";

describe("resolveDateLimits", () => {
    it("takes the latest lower limit and the earliest upper one", () => {
        expect(
            resolveDateLimits(
                {
                    gte: ["1900-01-01", { expression: "today-100y" }],
                    lte: [{ expression: "today-18y" }, "2020-01-01"]
                },
                "2026-10-19"
            )
        ).toEqual({ min: "1926-10-19", max: "2008-10-19" });
    });

    it("leaves out a side without limits and an expression it can't read", () => {
        expect(resolveDateLimits({ gte: [], lte: [{ expression: "nope" }] }, "2026-10-19")).toEqual(
            { min: undefined, max: undefined }
        );
        expect(resolveDateLimits(undefined, "2026-10-19")).toEqual({
            min: undefined,
            max: undefined
        });
    });
});

describe("getDateLimits", () => {
    it("reads the limits from renderer settings", () => {
        const dateLimits = { gte: ["2000-01-01"], lte: [] };
        expect(getDateLimits({ type: "date", dateLimits })).toBe(dateLimits);
        expect(getDateLimits({ type: "date" })).toBeUndefined();
        expect(getDateLimits(undefined)).toBeUndefined();
    });
});
