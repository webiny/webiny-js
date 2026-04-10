import { describe, test, expect } from "vitest";
import { createRegistry } from "./registry";

describe("in filter", () => {
    const registry = createRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "in", value: null, compareValue: null });
        expect(filter).toBeDefined();
        return filter!;
    };

    const inList: [
        [number, [number, number, number]],
        [number, [number, string, Date]],
        [string, [string, number, boolean]],
        [boolean, [boolean, boolean, string, number]],
        [boolean, [boolean, string, Date]]
    ] = [
        [1, [1, 2, 3]],
        [932, [932, "text", new Date()]],
        ["some text", ["some text", 2, true]],
        [true, [true, false, "2", 1]],
        [false, [false, "4", new Date()]]
    ];
    test.each(inList)("values should be in", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notInList: [
        [number, [number, number, number]],
        [number, [string, string, Date]],
        [string, [string, number, boolean]],
        [boolean, [string, boolean, string, number]],
        [boolean, [string, string, Date]]
    ] = [
        [1, [5, 2, 3]],
        [932, ["932", "text", new Date()]],
        ["some text", ["some text 2", 2, true]],
        [true, ["true", false, "2", 1]],
        [false, ["false", "4", new Date()]]
    ];
    test.each(notInList)("values should not be in", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
