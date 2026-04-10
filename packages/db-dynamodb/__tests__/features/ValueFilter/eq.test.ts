import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("eq filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "eq" });
        expect(filter).toBeDefined();
        return filter!;
    };

    const equalList: ([number, number] | [string, string] | [boolean, boolean])[] = [
        [1, 1],
        [932, 932],
        ["some text", "some text"],
        [true, true],
        [false, false]
    ];
    test.each(equalList)("values should be equal - %s == %s", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notEqualList: ([number, number] | [string, string] | [boolean, boolean])[] = [
        [1, 2],
        [932, 132],
        ["some text", "some text 2"],
        [true, false],
        [false, true]
    ];
    test.each(notEqualList)("values should not be equal - %s != %s", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
