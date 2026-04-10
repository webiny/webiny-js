import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("gt filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "gt" });
        expect(filter).toBeDefined();
        return filter!;
    };

    const gtList: ([number, number] | [Date, Date])[] = [
        [2, 1],
        [933, 932],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:22.999Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(gtList)("value should be greater", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notGtList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [2, 2],
        [933, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:24:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:23.000Z")]
    ];
    test.each(notGtList)("value should not be greater", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
