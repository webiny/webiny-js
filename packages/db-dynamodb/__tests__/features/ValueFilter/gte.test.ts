import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("gte filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "gte" });
        expect(filter).toBeDefined();
        return filter!;
    };

    const gteList: ([number, number] | [Date, Date])[] = [
        [2, 1],
        [2, 2],
        [933, 932],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:22.999Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T23:23:23.000Z"), new Date("2021-01-03T23:23:23.000Z")]
    ];
    test.each(gteList)("value should be greater or equal", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notGteList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-03T00:23:23.000Z")]
    ];
    test.each(notGteList)("value should not be greater or equal", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
