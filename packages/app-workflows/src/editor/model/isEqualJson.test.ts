import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isEqualJson } from "./isEqualJson.js";

describe("isEqualJson", () => {
    it("compares primitives", () => {
        expect(isEqualJson(1, 1)).toBe(true);
        expect(isEqualJson("a", "a")).toBe(true);
        expect(isEqualJson(null, null)).toBe(true);
        expect(isEqualJson(1, "1")).toBe(false);
        expect(isEqualJson(null, undefined)).toBe(false);
    });

    it("ignores the key order of objects", () => {
        expect(isEqualJson({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
    });

    it("compares arrays by position", () => {
        expect(isEqualJson([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(isEqualJson([1, 2, 3], [3, 2, 1])).toBe(false);
        expect(isEqualJson([1], [1, 2])).toBe(false);
    });

    it("sees a different key set, a different value and an array against an object", () => {
        expect(isEqualJson({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(isEqualJson({ a: 1 }, { a: 2 })).toBe(false);
        expect(isEqualJson({ a: undefined }, {})).toBe(false);
        expect(isEqualJson([], {})).toBe(false);
        expect(isEqualJson({}, [])).toBe(false);
    });

    it("compares nested structures", () => {
        const left = { teams: ["a", "b"], assignment: { rules: [{ id: "r1" }] } };
        const right = { assignment: { rules: [{ id: "r1" }] }, teams: ["a", "b"] };

        expect(isEqualJson(left, right)).toBe(true);
    });
});
