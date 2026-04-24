import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("lte filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get("lte");
        expect(filter).toBeDefined();
        return filter!;
    };

    const lteList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [2, 2],
        [933, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:25.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:25:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:24.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-03T00:23:23.000Z")]
    ];
    test.each(lteList)("value should be lesser or equal", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notLteList: ([number, number] | [Date, Date])[] = [
        [4, 3],
        [935, 934],
        [new Date("2021-01-02T23:23:23.001Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(notLteList)("value should not be lesser or equal", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
