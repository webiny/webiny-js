import { describe, test, expect } from "vitest";
import { createRegistry } from "./registry";

describe("lt filter", () => {
    const registry = createRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "lt", value: null, compareValue: null });
        expect(filter).toBeDefined();
        return filter!;
    };

    const ltList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:25.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:25:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:24.000Z")]
    ];
    test.each(ltList)("value should be lesser", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notLtList: ([number, number] | [Date, Date])[] = [
        [4, 3],
        [3, 2],
        [935, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:23.001Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(notLtList)("value should not be lesser", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
