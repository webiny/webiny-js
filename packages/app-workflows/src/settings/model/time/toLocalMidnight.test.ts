import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toLocalMidnight } from "./toLocalMidnight.js";

describe("toLocalMidnight (R337)", () => {
    it("is local midnight of the day in the browser", () => {
        const date = toLocalMidnight("2026-10-20");

        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
    });

    it("reads the first and the last day of a year", () => {
        const first = toLocalMidnight("2027-01-01");
        const last = toLocalMidnight("2026-12-31");

        expect(first.getFullYear()).toBe(2027);
        expect(first.getMonth()).toBe(0);
        expect(first.getDate()).toBe(1);
        expect(last.getMonth()).toBe(11);
        expect(last.getDate()).toBe(31);
    });
});
