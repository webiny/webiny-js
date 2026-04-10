import { describe, test, expect } from "vitest";
import { createRegistry } from "./registry";

describe("between filter", () => {
    const registry = createRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "between", value: null, compareValue: null });
        expect(filter).toBeDefined();
        return filter!;
    };

    const betweenList: [
        [number, [number, number]],
        [number, [number, number]],
        [Date, [Date, Date]],
        [Date, [Date, Date]]
    ] = [
        [5, [4, 6]],
        [5, [4, 5]],
        [
            new Date("2021-01-02T23:23:23.000Z"),
            [new Date("2021-01-02T23:23:22.000Z"), new Date("2021-01-02T23:23:24.000Z")]
        ],
        [
            new Date("2021-01-02T23:23:23.000Z"),
            [new Date("2021-01-02T23:23:22.999Z"), new Date("2021-01-02T23:23:23.001Z")]
        ]
    ];
    test.each(betweenList)("values should be in between", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notBetweenList: [
        [number, [number, number]],
        [number, [number, number]],
        [Date, [Date, Date]],
        [Date, [Date, Date]]
    ] = [
        [3, [4, 6]],
        [8, [4, 7]],
        [
            new Date("2021-01-02T23:23:22.000Z"),
            [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:24.000Z")]
        ],
        [
            new Date("2021-01-02T23:23:22.998Z"),
            [new Date("2021-01-02T23:23:22.999Z"), new Date("2021-01-02T23:23:23.001Z")]
        ]
    ];
    test.each(notBetweenList)("values should not be in between", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
